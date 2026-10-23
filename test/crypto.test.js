import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  base32Decode, base32Encode, blindIndex, checkPasswordPolicy, decryptField, encryptField, hashPassword,
  orderAccessToken, parseOrderAccessToken, parseTicketQr, randomCode, ticketQrPayload, totpAt, verifyPassword, verifyTotp,
} from '../server/lib/crypto.js';

const key = Buffer.alloc(32, 7);

test('AES-GCM cifra e decifra; AAD diferente falha; adulteração falha', () => {
  const c = encryptField(key, 'Maria', 'orders.name:ABC');
  assert.notEqual(c, 'Maria');
  assert.equal(decryptField(key, c, 'orders.name:ABC'), 'Maria');
  assert.throws(() => decryptField(key, c, 'orders.name:OUTRO'));
  const parts = c.split('.');
  parts[3] = Buffer.from('xxxxx').toString('base64url');
  assert.throws(() => decryptField(key, parts.join('.'), 'orders.name:ABC'));
  assert.notEqual(encryptField(key, 'Maria', 'a'), encryptField(key, 'Maria', 'a'), 'IV aleatório');
});

test('índice cego é determinístico e normaliza caixa/espaços', () => {
  assert.equal(blindIndex(key, ' A@B.com '), blindIndex(key, 'a@b.com'));
  assert.notEqual(blindIndex(key, 'a@b.com'), blindIndex(Buffer.alloc(32, 8), 'a@b.com'));
});

test('senha: hash verifica e política recusa fracas', async () => {
  const h = await hashPassword('Senha-Forte-123!');
  assert.ok(await verifyPassword('Senha-Forte-123!', h));
  assert.ok(!(await verifyPassword('senha-forte-123!', h)));
  assert.ok(checkPasswordPolicy('curta1A!'));
  assert.ok(checkPasswordPolicy('somenteminusculas'));
  assert.equal(checkPasswordPolicy('Senha-Forte-123!'), null);
});

test('TOTP bate com o vetor da RFC 6238 e rejeita fora da janela', () => {
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  assert.equal(totpAt(secret, Math.floor(59 / 30)), '287082'); // RFC 6238: 94287082 (8 díg.) → 6 díg. 287082
  assert.equal(verifyTotp(secret, '287082', 59_000), 1);
  assert.equal(verifyTotp(secret, '287082', 59_000 + 120_000), null);
  assert.equal(verifyTotp(secret, 'abcdef', 59_000), null);
  assert.deepEqual(base32Decode(secret), Buffer.from('12345678901234567890'));
});

test('QR do ingresso e token do pedido: assinatura válida e adulteração rejeitada', () => {
  const code = randomCode(10);
  const qr = ticketQrPayload(key, code);
  assert.equal(parseTicketQr(key, qr), code);
  assert.equal(parseTicketQr(key, qr.slice(0, -1) + (qr.endsWith('A') ? 'B' : 'A')), null);
  assert.equal(parseTicketQr(Buffer.alloc(32, 9), qr), null);
  const o = randomCode(8);
  assert.equal(parseOrderAccessToken(key, orderAccessToken(key, o)), o);
  assert.equal(parseOrderAccessToken(key, `${o}.${'A'.repeat(26)}`), null);
});
