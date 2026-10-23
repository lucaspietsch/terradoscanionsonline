import { decryptField, encryptField } from './crypto.js';

const REDACTED = '-';

// Dados pessoais são cifrados por campo (AES-256-GCM) com AAD = coluna + identificador do registro.
export function createPii(key) {
  return {
    enc: (column, ownerId, value) => encryptField(key, value, `${column}:${ownerId}`),
    dec: (column, ownerId, payload) => {
      if (payload === REDACTED) return '';
      return decryptField(key, payload, `${column}:${ownerId}`);
    },
    REDACTED,
  };
}
