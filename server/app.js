import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { AuthError, createAuth } from './auth.js';
import { loadConfig } from './config.js';
import { openDb } from './db.js';
import { createAudit } from './lib/audit.js';
import { createPii } from './lib/pii.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { publicRoutes } from './routes/public.js';
import { staffRoutes } from './routes/staff.js';
import { createMailer } from './services/mailer.js';
import { OrderError, createOrderService } from './services/orders.js';
import { createPaymentProvider } from './services/payments/index.js';
import { PricingError } from './services/pricing.js';

const here = dirname(fileURLToPath(import.meta.url));

export async function buildApp({ config = loadConfig(), db = openDb(config.dbPath), payments } = {}) {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      // Nunca registra cabeçalhos sensíveis nem corpos de requisição (dados pessoais).
      redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    },
    trustProxy: config.trustProxy,
    bodyLimit: 64 * 1024,
    requestIdHeader: 'x-request-id',
  });

  const pii = createPii(config.keys.enc);
  const audit = createAudit(db, config.keys.audit);
  const auth = createAuth({ db, config, audit });
  const provider = payments ?? createPaymentProvider(config);
  const mailer = createMailer(config, app.log);
  const orders = createOrderService({ db, config, pii, audit, payments: provider, mailer, log: app.log });

  // Rate limit por rota (desligado nos testes, exceto quando pedido).
  const rl = (max, timeWindow) => (config.rateLimitDisabled ? {} : { rateLimit: { max, timeWindow } });
  const ctx = { app, db, config, pii, audit, auth, orders, payments: provider, mailer, rl };

  // ---------- Segurança ----------
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'self'"],
        ...(config.secureCookies ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    strictTransportSecurity: config.secureCookies ? { maxAge: 63072000, includeSubDomains: true, preload: false } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    xFrameOptions: { action: 'deny' },
  });

  app.addHook('onSend', async (req, reply) => {
    reply.header('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()');
    if (req.url.startsWith('/api/') || req.url.startsWith('/admin')) {
      reply.header('Cache-Control', 'no-store');
    }
  });

  await app.register(cookie);
  if (!config.rateLimitDisabled) {
    await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute' });
  }

  // ---------- Autenticação por sessão ----------
  app.decorateRequest('session', null);
  app.decorate('requireRole', (...roles) => async (req) => {
    const token = req.cookies?.[auth.cookieName];
    const session = auth.loadSession(token);
    if (!session) throw new AuthError('Sessão expirada. Entre novamente.', 401);
    if (!roles.includes(session.user.role)) throw new AuthError('Sem permissão.', 403);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Defesa em profundidade contra CSRF: cookie SameSite=Strict + Origin + token por sessão.
      const origin = req.headers.origin;
      if (origin && origin !== config.baseUrl) throw new AuthError('Origem não permitida.', 403);
      const sent = req.headers['x-csrf-token'];
      if (typeof sent !== 'string' || sent !== session.csrf) throw new AuthError('Token CSRF inválido.', 403);
    }
    req.session = session;
  });

  // ---------- Erros ----------
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({ error: 'validation', message: 'Dados inválidos.', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
    }
    if (err instanceof OrderError) return reply.code(err.status).send({ error: err.code, message: err.message });
    if (err instanceof PricingError) return reply.code(400).send({ error: err.code, message: err.message });
    if (err instanceof AuthError) return reply.code(err.status).send({ error: 'auth', message: err.message, ...err.extra });
    if (err.statusCode === 429) return reply.code(429).send({ error: 'rate_limited', message: 'Muitas tentativas. Aguarde um pouco e tente de novo.' });
    if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({ error: 'bad_request', message: 'Requisição inválida.' });
    req.log.error({ err: err.message, stack: config.production ? undefined : err.stack }, 'erro interno');
    return reply.code(500).send({ error: 'internal', message: 'Erro interno. Tente novamente.' });
  });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'not_found', message: 'Não encontrado.' });
    return reply.code(404).type('text/html; charset=utf-8').sendFile('404.html');
  });

  // ---------- Rotas ----------
  await app.register(async (api) => {
    await publicRoutes(api, ctx);
    await authRoutes(api, ctx);
    await staffRoutes(api, ctx);
    await adminRoutes(api, ctx);
  }, { prefix: '/api' });
  await publicRoutes.redirects(app, ctx); // /q/:code

  // ---------- Site estático ----------
  await app.register(fastifyStatic, {
    root: join(here, '..', 'public'),
    extensions: ['html'],
    index: ['index.html'],
    maxAge: config.production ? '1h' : 0,
    cacheControl: true,
    dotfiles: 'deny',
  });
  // Rotas "bonitas" com parâmetro: servem a mesma página; o JS lê o caminho.
  const page = (name) => (req, reply) => reply.type('text/html; charset=utf-8').sendFile(name);
  app.get('/pedido/:token', page('pedido.html'));
  app.get('/parceiros/:slug', page('parceiro.html'));
  app.get('/admin', page('admin/index.html'));

  // ---------- Jobs ----------
  const timers = [];
  if (config.nodeEnv !== 'test') {
    timers.push(setInterval(() => { try { orders.expirePending(); auth.purgeExpiredSessions(); } catch (e) { app.log.error(e); } }, 60_000));
    timers.push(setInterval(() => { try { orders.anonymizeOld(); } catch (e) { app.log.error(e); } }, 24 * 3600_000));
    timers.forEach((t) => t.unref());
  }
  app.addHook('onClose', async () => { timers.forEach(clearInterval); db.close(); });

  app.decorate('ctx', ctx);
  return app;
}
