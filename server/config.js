import { hkdfSync, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

function int(name, def, { min = -Infinity, max = Infinity } = {}) {
  const raw = env[name];
  if (raw === undefined || raw === '') return def;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`Variável ${name} inválida: ${raw}`);
  }
  return n;
}

function bool(name, def) {
  const raw = env[name];
  if (raw === undefined || raw === '') return def;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

export function loadConfig(overrides = {}) {
  const e = { ...env, ...overrides };
  const nodeEnv = e.NODE_ENV || 'development';
  const production = nodeEnv === 'production';

  const dbPath = e.DB_PATH || (nodeEnv === 'test' ? ':memory:' : 'data/terra-dos-canions.db');
  let masterKeyB64 = e.MASTER_KEY;
  if (!masterKeyB64) {
    if (production) {
      throw new Error('MASTER_KEY é obrigatória em produção (rode `npm run gen-secrets`).');
    }
    if (dbPath === ':memory:') {
      masterKeyB64 = randomBytes(32).toString('base64');
    } else {
      // Desenvolvimento: chave persistida ao lado do banco (0600) para que servidor e scripts
      // (seed, create-admin) enxerguem os mesmos dados cifrados. Nunca use este arquivo em produção.
      const keyFile = join(dirname(dbPath), '.dev-master-key');
      if (!existsSync(keyFile)) {
        mkdirSync(dirname(keyFile), { recursive: true, mode: 0o700 });
        writeFileSync(keyFile, randomBytes(32).toString('base64'), { mode: 0o600 });
      }
      masterKeyB64 = readFileSync(keyFile, 'utf8').trim();
    }
  }
  const master = Buffer.from(masterKeyB64, 'base64');
  if (master.length < 32) throw new Error('MASTER_KEY deve ter ao menos 32 bytes (base64).');

  const derive = (info) =>
    Buffer.from(hkdfSync('sha256', master, Buffer.alloc(0), `tdc:${info}`, 32));

  const baseUrl = (e.BASE_URL || `http://localhost:${e.PORT || 3000}`).replace(/\/+$/, '');
  if (production && !baseUrl.startsWith('https://')) {
    throw new Error('BASE_URL deve usar https:// em produção.');
  }

  const paymentProvider = e.PAYMENT_PROVIDER || (production ? 'mercadopago' : 'mock');
  if (production && paymentProvider === 'mock') {
    throw new Error('PAYMENT_PROVIDER=mock é proibido em produção.');
  }
  if (paymentProvider === 'mercadopago' && !(e.MP_ACCESS_TOKEN && e.MP_WEBHOOK_SECRET) && !isTest) {
    throw new Error('MP_ACCESS_TOKEN e MP_WEBHOOK_SECRET são obrigatórios com PAYMENT_PROVIDER=mercadopago.');
  }

  return {
    nodeEnv,
    production,
    port: Number(e.PORT) || 3000,
    host: e.HOST || '0.0.0.0',
    baseUrl,
    secureCookies: baseUrl.startsWith('https://'),
    trustProxy: bool('TRUST_PROXY', production),
    dbPath,
    keys: {
      enc: derive('enc'), // AES-256-GCM para dados pessoais
      blind: derive('blind'), // índice cego (busca por e-mail sem guardar em claro)
      ticket: derive('ticket'), // assinatura dos QR dos ingressos
      audit: derive('audit'), // cadeia de hash do log de auditoria
      totp: derive('totp'), // cifra dos segredos TOTP
    },
    payments: {
      provider: paymentProvider,
      mpAccessToken: e.MP_ACCESS_TOKEN || '',
      mpWebhookSecret: e.MP_WEBHOOK_SECRET || '',
    },
    orderHoldMinutes: int('ORDER_HOLD_MINUTES', 15, { min: 5, max: 120 }),
    retentionDays: int('RETENTION_DAYS', 365, { min: 30, max: 3650 }),
    maxTicketsPerOrder: int('MAX_TICKETS_PER_ORDER', 10, { min: 1, max: 50 }),
    session: {
      idleMinutes: int('SESSION_IDLE_MINUTES', 30, { min: 5, max: 600 }),
      absoluteHours: int('SESSION_ABSOLUTE_HOURS', 8, { min: 1, max: 72 }),
    },
    requireTotpForStaff: bool('REQUIRE_TOTP', production),
    smtpUrl: e.SMTP_URL || '',
    mailFrom: e.MAIL_FROM || 'Terra dos Cânions Online <nao-responda@localhost>',
    rateLimitDisabled: isTest && !bool('TEST_RATE_LIMIT', false),
    logLevel: e.LOG_LEVEL || (isTest ? 'silent' : 'info'),
    isProd,
  };
}
