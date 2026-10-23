// Popula o banco com o produto da Tirolesa, os 15 parceiros fundadores e regras iniciais.
// Uso: npm run seed            (dados de demonstração: horários, cupom e placa de exemplo)
//      SEED_DEMO=0 npm run seed (apenas dados estruturais, sem horários/cupons de demonstração)
import { loadConfig } from '../server/config.js';
import { openDb } from '../server/db.js';

export const FOUNDING_PARTNERS = [
  ['serra-geral-vertical', 'Serra Geral Vertical — Projetos Turísticos', 'atrativo'],
  ['guia-aparados-da-serra', 'Guia Aparados da Serra', 'guia'],
  ['duperau-gastro-pub', 'DuPerau Gastro Pub', 'gastronomia'],
  ['pousada-costao-do-cambara', 'Pousada Costão do Cambará', 'hospedagem'],
  ['pousada-paradouro-da-serra', 'Pousada Paradouro da Serra', 'hospedagem'],
  ['canyons-chalet', 'Canyons Chalet', 'hospedagem'],
  ['campanario-chales', 'Campanário Chalés', 'hospedagem'],
  ['cambara-container', 'Cambará Container', 'hospedagem'],
  ['restaurante-galpao-costaneira', 'Restaurante Galpão Costaneira', 'gastronomia'],
  ['cafe-costaneira', 'Café Costaneira', 'gastronomia'],
  ['pousada-costaneira', 'Pousada Costaneira', 'hospedagem'],
  ['agencia-canion-turismo', 'Agência Cânion Turismo', 'agencia'],
  ['pousada-recanto-do-lago', 'Pousada Recanto do Lago', 'hospedagem'],
  ['pousada-morada-das-estrelas', 'Pousada Morada das Estrelas', 'hospedagem'],
  ['pousada-olhos-do-campo', 'Pousada Olhos do Campo', 'hospedagem'],
];

export function seed(db, { demo = true } = {}) {
  db.transaction(() => {
    // Produto: preço de demonstração só entra com demo=1. Em produção nasce INATIVO e com preço 0,
    // forçando o administrador a definir o valor real antes de abrir as vendas.
    db.prepare(
      `INSERT OR IGNORE INTO products (slug, name, summary, price_cents, min_weight_kg, max_weight_kg, min_age, active)
       VALUES ('tirolesa-mais-alta-das-americas', 'Tirolesa Mais Alta das Américas',
       'Voe sobre o Cânion Fortaleza, a cerca de 750 m do chão, em uma descida de 720 m no Parque Nacional da Serra Geral.',
       ?, 40, 110, 0, ?)`,
    ).run(demo ? 15000 : 0, demo ? 1 : 0);

    const insP = db.prepare(
      `INSERT OR IGNORE INTO partners (slug, name, category, plan, free_until, sort_order, tagline)
       VALUES (?, ?, ?, 'fundador', NULL, ?, 'Parceiro fundador — perfil em breve')`,
    );
    FOUNDING_PARTNERS.forEach(([slug, name, cat], i) => insP.run(slug, name, cat, (i + 1) * 10));

    // Costão do Cambará: o parque rural e a pousada são o mesmo empreendimento.
    db.prepare("UPDATE partners SET attraction_slug = 'costao-do-cambara' WHERE slug = 'pousada-costao-do-cambara'").run();

    db.prepare("INSERT OR IGNORE INTO discount_rules (id, label, min_qty, percent, active) VALUES (1, 'Desconto de grupo (4+ ingressos)', 4, 10, ?)").run(demo ? 1 : 0);

    if (demo) {
      const pid = db.prepare("SELECT id FROM products WHERE slug = 'tirolesa-mais-alta-das-americas'").get().id;
      const ins = db.prepare('INSERT OR IGNORE INTO slots (product_id, day, time, capacity) VALUES (?,?,?,?)');
      const start = Date.now();
      for (let i = 1; i <= 60; i++) {
        const day = new Date(start + i * 86400000).toISOString().slice(0, 10);
        for (const t of ['09:00', '10:30', '13:00', '14:30', '16:00']) ins.run(pid, day, t, 18);
      }
      // Produtos de EXEMPLO (só no modo demonstração) para você ver as páginas preenchidas. Nomes e valores são fictícios.
      const demoProducts = [
        ['canyons-chalet', 'hospedagem', 'Chalé para casal (exemplo)', 'Texto de exemplo: assim aparece a descrição de uma acomodação.', 48000, 'por noite', null, '5500000000'],
        ['canyons-chalet', 'hospedagem', 'Chalé família (exemplo)', 'Texto de exemplo para uma acomodação maior.', 72000, 'por noite', null, null],
        ['guia-aparados-da-serra', 'passeio', 'Trilha guiada no Itaimbezinho (exemplo)', 'Texto de exemplo: passeio guiado com saída pela manhã.', 25000, 'por pessoa', 'aparados-da-serra', '5500000000'],
        ['guia-aparados-da-serra', 'passeio', 'Cachoeira do Tigre Preto (exemplo)', 'Texto de exemplo de um passeio guiado.', null, '', 'serra-geral', null],
        ['duperau-gastro-pub', 'refeicao', 'Hambúrguer da casa (exemplo)', 'Texto de exemplo de um prato do cardápio.', 4200, 'por prato', null, '5500000000'],
        ['pousada-costao-do-cambara', 'experiencia', 'Cavalgada das cachoeiras (exemplo)', 'Texto de exemplo: passeio a cavalo pelas cachoeiras da fazenda.', 18000, 'por pessoa', 'costao-do-cambara', '5500000000'],
      ];
      const insProd = db.prepare('INSERT INTO partner_products (partner_id, kind, name, description, price_cents, price_note, attraction_slug) SELECT id, ?, ?, ?, ?, ?, ? FROM partners WHERE slug = ?');
      const setWa = db.prepare("UPDATE partners SET whatsapp = ? WHERE slug = ? AND whatsapp = ''");
      if (!db.prepare('SELECT 1 FROM partner_products LIMIT 1').get()) {
        for (const [slug, kind, name, desc, price, note, attr, wa] of demoProducts) {
          insProd.run(kind, name, desc, price, note, attr, slug);
          if (wa) setWa.run(wa, slug);
        }
      }
      db.prepare("INSERT OR IGNORE INTO coupons (code, label, kind, value, partner_id) VALUES ('PLACA10', 'Desconto exclusivo das placas', 'percent', 10, NULL)").run();
      const cid = db.prepare("SELECT id FROM coupons WHERE code = 'PLACA10'").get().id;
      db.prepare("INSERT OR IGNORE INTO qr_codes (code, label, location, coupon_id) VALUES ('praca-01', 'Placa Praça Central', 'Praça central de Cambará do Sul', ?)").run(cid);
    }
  })();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const db = openDb(config.dbPath);
  const demo = process.env.SEED_DEMO !== '0' && !config.production;
  seed(db, { demo });
  console.log(`Seed concluído (${demo ? 'com' : 'sem'} dados de demonstração).`);
  db.close();
}
