// Gera os links de acesso de vários parceiros de uma vez.
//   npm run invite-partners -- parceiros.csv
// CSV (sem cabeçalho, separado por vírgula):  slug-do-parceiro,email,Nome do responsável
//   canyons-chalet,contato@canyons.com.br,Ana Souza
// Imprime um link por parceiro (uso único, vale 7 dias) e a mensagem pronta para colar no WhatsApp.
// Reexecutar para o mesmo parceiro gera um link novo e invalida o anterior.
import { readFileSync } from 'node:fs';
import { createAuth } from '../server/auth.js';
import { loadConfig } from '../server/config.js';
import { openDb } from '../server/db.js';
import { createAudit } from '../server/lib/audit.js';
import { createMailer } from '../server/services/mailer.js';
import { createInviteService } from '../server/services/invites.js';

const file = process.argv[2];
if (!file) { console.error('Uso: npm run invite-partners -- parceiros.csv'); process.exit(1); }

const config = loadConfig();
const db = openDb(config.dbPath);
const audit = createAudit(db, config.keys.audit);
const auth = createAuth({ db, config, audit });
const log = { info() {}, error: console.error, warn() {} };
const invites = createInviteService({ db, config, auth, audit, mailer: createMailer(config, log) });

let ok = 0;
for (const [n, raw] of readFileSync(file, 'utf8').split(/\r?\n/).entries()) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [slug, email, ...rest] = line.split(',').map((s) => s.trim());
  const name = rest.join(',').trim();
  try {
    const partner = db.prepare('SELECT id FROM partners WHERE slug = ?').get(slug);
    if (!partner) throw new Error(`parceiro "${slug}" não existe`);
    if (!email || !name) throw new Error('faltam e-mail ou nome');
    const inv = await invites.create({ partnerId: partner.id, email, name, actor: 'cli' });
    ok++;
    console.log(`\n✔ ${inv.partnerName} (${email}) — ${inv.purpose === 'reset' ? 'REDEFINIÇÃO' : 'convite'}, vale até ${new Date(inv.expiresAt).toLocaleDateString('pt-BR')}`);
    console.log(`  ${inv.url}`);
    console.log(`  Mensagem: Olá, ${name.split(' ')[0]}! O ${inv.partnerName} já está no Terra dos Cânions Online. Crie sua senha neste link (vale ${invites.INVITE_DAYS} dias, uso único) e preencha seus dados e produtos: ${inv.url}`);
  } catch (e) {
    console.error(`\n✖ linha ${n + 1} (${slug || '?'}): ${e.message}`);
  }
}
console.log(`\n${ok} convite(s) gerado(s). Trate estes links como senhas: envie só ao responsável de cada parceiro.`);
db.close();
