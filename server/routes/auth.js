import { loginBody } from '../schemas.js';

export async function authRoutes(api, { auth, config, rl }) {
  const cookieOpts = (maxAge) => ({
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: 'strict',
    path: '/',
    maxAge,
  });

  api.post('/auth/login', { config: rl(10, '15 minutes') }, async (req, reply) => {
    const body = loginBody.parse(req.body);
    const r = await auth.login(body);
    reply.setCookie(auth.cookieName, r.token, cookieOpts(r.maxAgeSeconds));
    return { user: r.user, csrf: r.csrf };
  });

  api.get('/auth/me', async (req, reply) => {
    const s = auth.loadSession(req.cookies?.[auth.cookieName]);
    if (!s) return reply.code(401).send({ error: 'auth', message: 'Não autenticado.' });
    return { user: s.user, csrf: s.csrf };
  });

  api.post('/auth/logout', async (req, reply) => {
    auth.destroySession(req.cookies?.[auth.cookieName]);
    reply.clearCookie(auth.cookieName, { path: '/' });
    return { ok: true };
  });
}
