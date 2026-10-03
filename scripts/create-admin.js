// Cria um usuário da equipe com 2FA (TOTP). Uso:
//   npm run create-admin -- email@dominio.com "Nome" [admin|checkin]
// A senha é lida do prompt (não fica no histórico do shell).
import QRCode from 'qrcode';
import readline from 'node:readline';
import { createAudit } from '../server/lib/audit.js';
import { createAuth } from '../server/auth.js';
import { newTotpSecret, totpUri } from '../server/lib/crypto.js';
import { loadConfig } from '../server/config.js';
import { openDb } from '../server/db.js';

const [email, name, role = 'admin'] = process.argv.slice(2);
if (!email || !name || !['admin', 'checkin'].includes(role)) {
  console.error('Uso: npm run create-admin -- email "Nome" [admin|checkin]');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (a) => { rl.output.write('\n'); rl.close(); resolve(a); });
  });
}

const config = loadConfig();
const db = openDb(config.dbPath);
const auth = createAuth({ db, config, audit: createAudit(db, config.keys.audit) });
const password = process.env.ADMIN_PASSWORD || (await askHidden('Senha (mín. 12 caracteres): '));
const secret = newTotpSecret();
const id = await auth.createUser({ email, name, role, password, enableTotp: true, totpSecret: secret });
const uri = totpUri(secret, email);
console.log(`\nUsuário #${id} (${role}) criado. Escaneie o QR no app autenticador (Google Authenticator, Authy, 1Password…):\n`);
console.log(await QRCode.toString(uri, { type: 'terminal', small: true }));
console.log(`Segredo manual: ${secret}\n`);
db.close();
