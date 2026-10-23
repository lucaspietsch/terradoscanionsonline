export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Erro inesperado');
    this.status = status;
    this.body = body || {};
  }
}

let csrfToken = null;
export const setCsrf = (t) => { csrfToken = t; };

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const init = { method, headers: { Accept: 'application/json', ...headers }, credentials: 'same-origin' };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  if (method !== 'GET' && csrfToken) init.headers['X-CSRF-Token'] = csrfToken;
  let res;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, { message: 'Sem conexão. Verifique sua internet e tente de novo.' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
