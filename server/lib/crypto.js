import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

// ---------- Cifra de campos (AES-256-GCM) ----------
// Formato: v1.<iv>.<tag>.<ciphertext> (base64url). O `aad` amarra o valor à
// tabela/coluna/linha, impedindo copiar um campo cifrado para outro registro.
export function encryptField(key, plaintext, aad = '') {
  if (plaintext === null || plaintext === undefined) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(aad));
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv, tag, ct].map((p) => (typeof p === 'string' ? p : p.toString('base64url'))).join('.');
}

export function decryptField(key, payload, aad = '') {
  if (payload === null || payload === undefined) return null;
  const [v, iv, tag, ct] = String(payload).split('.');
  if (v !== 'v1' || !iv || !tag || ct === undefined) throw new Error('Campo cifrado inválido');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8');
}

// Índice cego: HMAC determinístico para busca por igualdade sem guardar o valor em claro.
export function blindIndex(key, value) {
  return createHmac('sha256', key).update(String(value).trim().toLowerCase()).digest('base64url');
}

export const sha256 = (v) => createHash('sha256').update(v).digest('base64url');

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) {
    // Mantém tempo aproximadamente constante mesmo com tamanhos diferentes.
    timingSafeEqual(x, x);
    return false;
  }
  return timingSafeEqual(x, y);
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

// ---------- Códigos legíveis (Crockford base32, sem I, L, O, U) ----------
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function randomCode(len) {
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] & 31];
  return out;
}

export function normalizeCode(input) {
  return String(input || '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

// ---------- Senhas (scrypt) ----------
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keylen: 64, maxmem: 128 * 1024 * 1024 };

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const dk = await scrypt(password, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64url')}$${dk.toString('base64url')}`;
}

export async function verifyPassword(password, stored) {
  const [alg, N, r, p, salt, hash] = String(stored).split('$');
  if (alg !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64url');
  const dk = await scrypt(password, Buffer.from(salt, 'base64url'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return timingSafeEqual(dk, expected);
}

// Hash descartável usado quando o usuário não existe, para não vazar existência por tempo de resposta.
let dummyHashPromise;
export function dummyHash() {
  dummyHashPromise ??= hashPassword('dummy-password-for-timing');
  return dummyHashPromise;
}

export function checkPasswordPolicy(password) {
  if (typeof password !== 'string' || password.length < 12) return 'A senha deve ter ao menos 12 caracteres.';
  if (password.length > 128) return 'A senha deve ter no máximo 128 caracteres.';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes < 3) return 'Use ao menos 3 tipos: minúscula, maiúscula, número e símbolo.';
  if (/(.)\1{4,}/.test(password)) return 'A senha tem caracteres repetidos demais.';
  return null;
}

// ---------- TOTP (RFC 6238) ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(str) {
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of str.replace(/=+$/, '').toUpperCase()) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error('Base32 inválido');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const newTotpSecret = () => base32Encode(randomBytes(20));

export function totpAt(secretB32, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac('sha1', base32Decode(secretB32)).update(counter).digest();
  const off = h[h.length - 1] & 15;
  const code = (h.readUInt32BE(off) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, '0');
}

// Retorna o passo (time step) aceito ou null. O chamador deve recusar passos <= último usado (anti-replay).
export function verifyTotp(secretB32, token, now = Date.now(), window = 1) {
  if (!/^\d{6}$/.test(String(token))) return null;
  const step = Math.floor(now / 30000);
  for (let i = -window; i <= window; i++) {
    if (safeEqual(totpAt(secretB32, step + i), token)) return step + i;
  }
  return null;
}

export const totpUri = (secret, account, issuer = 'Terra dos Canions Online') =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

// ---------- Assinatura do QR do ingresso ----------
export function signTicket(key, code) {
  const mac = createHmac('sha256', key).update(`ticket:${code}`).digest().subarray(0, 8);
  return base32Encode(mac);
}

export const ticketQrPayload = (key, code) => `TDC1.${code}.${signTicket(key, code)}`;

export function parseTicketQr(key, payload) {
  const m = /^TDC1\.([0-9A-Z]{10})\.([A-Z2-7]{13})$/.exec(String(payload || '').trim().toUpperCase());
  if (!m) return null;
  return safeEqual(signTicket(key, m[1]), m[2]) ? m[1] : null;
}

// ---------- Link de acesso ao pedido (sem estado: código + HMAC de 128 bits) ----------
export function orderAccessToken(key, orderCode) {
  const mac = createHmac('sha256', key).update(`order:${orderCode}`).digest().subarray(0, 16);
  return `${orderCode}.${base32Encode(mac)}`;
}

export function parseOrderAccessToken(key, token) {
  const m = /^([0-9A-Z]{8})\.([A-Z2-7]{26})$/.exec(String(token || '').trim().toUpperCase());
  if (!m) return null;
  return safeEqual(orderAccessToken(key, m[1]), `${m[1]}.${m[2]}`) ? m[1] : null;
}
