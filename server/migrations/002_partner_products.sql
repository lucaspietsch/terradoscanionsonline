-- Vitrine de produtos/serviços dos parceiros (hospedagem, passeios, refeições…).
-- Não são vendidos pelo site (exceto a Tirolesa, produto próprio): o cliente pede informações ao parceiro.
CREATE TABLE partner_products (
  id              INTEGER PRIMARY KEY,
  partner_id      INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL CHECK (kind IN ('hospedagem','passeio','refeicao','experiencia','servico','produto')),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  price_cents     INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),   -- NULL = "consulte"
  price_note      TEXT NOT NULL DEFAULT '',                                  -- ex.: "por noite", "por pessoa"
  attraction_slug TEXT,                                                      -- liga o produto a um atrativo
  published       INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0,1)),
  sort_order      INTEGER NOT NULL DEFAULT 100,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_pp_partner ON partner_products(partner_id, published, sort_order);
CREATE INDEX idx_pp_attraction ON partner_products(attraction_slug) WHERE attraction_slug IS NOT NULL;

-- Parceiro que administra/hospeda um atrativo (ex.: Costão do Cambará).
ALTER TABLE partners ADD COLUMN attraction_slug TEXT;
