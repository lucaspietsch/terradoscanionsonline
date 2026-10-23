// Gera os links de acesso de vários parceiros de uma vez.
//   npm run invite-partners -- parceiros.csv
// Planilha: docs/parceiros.csv (colunas parceiro;slug;email;responsavel). Preencha e-mail e responsável de quem já tiver;
// as linhas em branco são puladas. Aceita ; (Excel em português) ou vírgula.
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

// Aceita vírgula ou ponto e vírgula (Excel em português), BOM, aspas e cabeçalho (colunas: slug, email, responsavel).
const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const sep = (lines[0] || '').includes(';') ? ';' : ',';
const split = (l) => l.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
let cols = { slug: 0, email: 1, nome: 2 };
if (/slug/i.test(lines[0] || '')) {
  const head = split(lines.shift()).map((c) => c.toLowerCase());
  cols = { slug: head.indexOf('slug'), email: head.indexOf('email'), nome: head.findIndex((c) => /respons|nome/.test(c)) };
  if (cols.slug < 0 || cols.email < 0 || cols.nome < 0) { console.error('Cabeçalho precisa ter as colunas: slug, email, responsavel'); process.exit(1); }
}

let ok = 0;
let skipped = 0;
for (const [n, line] of lines.entries()) {
  const c = split(line);
  const slug = c[cols.slug];
  const email = c[cols.email];
  const name = c[cols.nome];
  if (!email && !name) { skipped++; continue; } // ainda não preenchido
  try {
    const partner = db.prepare('SELECT id FROM partners WHERE slug = ?').get(slug);
    if (!partner) throw new Error(`parceiro "${slug}" não existe`);
    if (!email || !name) throw new Error('faltam e-mail ou nome do responsável');
    const inv = await invites.create({ partnerId: partner.id, email, name, actor: 'cli' });
    ok++;
    console.log(`\n✔ ${inv.partnerName} (${email}) — ${inv.purpose === 'reset' ? 'REDEFINIÇÃO' : 'convite'}, vale até ${new Date(inv.expiresAt).toLocaleDateString('pt-BR')}`);
    console.log(`  ${inv.url}`);
    console.log(`  Mensagem: Olá, ${name.split(' ')[0]}! O ${inv.partnerName} já está no Terra dos Cânions Online. Crie sua senha neste link (vale ${invites.INVITE_DAYS} dias, uso único) e preencha seus dados e produtos: ${inv.url}`);
  } catch (e) {
    console.error(`\n✖ linha ${n + 1} (${slug || '?'}): ${e.message}`);
  }
}
if (skipped) console.log(`\n${skipped} linha(s) sem e-mail/responsável foram puladas (preencha quando tiver).`);
console.log(`\n${ok} convite(s) gerado(s). Trate estes links como senhas: envie só ao responsável de cada parceiro.`);
db.close();
