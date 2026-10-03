-- Valores monetários sempre em centavos (INTEGER). Datas em ISO-8601 UTC, exceto `slots.day` (data local YYYY-MM-DD).

CREATE TABLE products (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  summary       TEXT NOT NULL DEFAULT '',
  price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
  min_weight_kg INTEGER NOT NULL DEFAULT 0,
  max_weight_kg INTEGER NOT NULL DEFAULT 999,
  min_age       INTEGER NOT NULL DEFAULT 0,
  minor_age     INTEGER NOT NULL DEFAULT 18,
  waiver_version TEXT NOT NULL DEFAULT 'v1',
  active        INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE slots (
  id         INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  day        TEXT NOT NULL CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  time       TEXT NOT NULL CHECK (time GLOB '[0-2][0-9]:[0-5][0-9]'),
  capacity   INTEGER NOT NULL CHECK (capacity >= 0),
  reserved   INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  note       TEXT NOT NULL DEFAULT '',
  UNIQUE (product_id, day, time),
  CHECK (reserved <= capacity OR status = 'closed')
);
CREATE INDEX idx_slots_day ON slots(product_id, day);

CREATE TABLE partners (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('atrativo','guia','agencia','hospedagem','gastronomia','servico')),
  tagline     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  whatsapp    TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  website     TEXT NOT NULL DEFAULT '',
  instagram   TEXT NOT NULL DEFAULT '',
  address     TEXT NOT NULL DEFAULT '',
  plan        TEXT NOT NULL DEFAULT 'fundador' CHECK (plan IN ('fundador','gratuito','pago')),
  free_until  TEXT,            -- fim do período de cortesia (YYYY-MM-DD)
  featured    INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 100,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE coupons (
  id          INTEGER PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,            -- sempre MAIÚSCULO
  label       TEXT NOT NULL DEFAULT '',
  kind        TEXT NOT NULL CHECK (kind IN ('percent','fixed')),
  value       INTEGER NOT NULL CHECK (value > 0),  -- percent: 1..100 ; fixed: centavos por ingresso
  min_qty     INTEGER NOT NULL DEFAULT 1,
  max_uses    INTEGER,                             -- NULL = ilimitado
  used_count  INTEGER NOT NULL DEFAULT 0,
  valid_from  TEXT,
  valid_until TEXT,
  partner_id  INTEGER REFERENCES partners(id),      -- atribui a venda ao parceiro indicador
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (kind <> 'percent' OR value <= 100)
);

-- Regras automáticas (ex.: grupo). A melhor oferta vence; descontos NÃO se acumulam.
CREATE TABLE discount_rules (
  id       INTEGER PRIMARY KEY,
  label    TEXT NOT NULL,
  min_qty  INTEGER NOT NULL CHECK (min_qty >= 2),
  percent  INTEGER NOT NULL CHECK (percent BETWEEN 1 AND 100),
  active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE qr_codes (
  id          INTEGER PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,   -- slug curto usado em /q/<code> (impresso nas placas)
  label       TEXT NOT NULL,
  location    TEXT NOT NULL DEFAULT '',
  target      TEXT NOT NULL DEFAULT '/tirolesa',
  coupon_id   INTEGER REFERENCES coupons(id),  -- cupom aplicado automaticamente a quem chega por esta placa
  partner_id  INTEGER REFERENCES partners(id),
  scans       INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE qr_scans_daily (
  qr_id INTEGER NOT NULL REFERENCES qr_codes(id),
  day   TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (qr_id, day)
);

CREATE TABLE orders (
  id               INTEGER PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,     -- referência curta para suporte (não dá acesso)
  status           TEXT NOT NULL CHECK (status IN ('pending','paid','expired','cancelled','refunded')),
  product_id       INTEGER NOT NULL REFERENCES products(id),
  slot_id          INTEGER NOT NULL REFERENCES slots(id),
  qty              INTEGER NOT NULL CHECK (qty >= 1),
  unit_price_cents INTEGER NOT NULL,
  subtotal_cents   INTEGER NOT NULL,
  discount_cents   INTEGER NOT NULL DEFAULT 0,
  total_cents      INTEGER NOT NULL CHECK (total_cents >= 0),
  discount_label   TEXT NOT NULL DEFAULT '',
  coupon_id        INTEGER REFERENCES coupons(id),
  qr_id            INTEGER REFERENCES qr_codes(id),
  partner_id       INTEGER REFERENCES partners(id),
  buyer_name_enc   TEXT NOT NULL,
  buyer_email_enc  TEXT NOT NULL,
  buyer_email_idx  TEXT NOT NULL,
  buyer_phone_enc  TEXT NOT NULL,
  waiver_version   TEXT NOT NULL,
  consent_at       TEXT NOT NULL,
  payment_provider TEXT NOT NULL,
  payment_ref      TEXT,
  pix_payload      TEXT,
  idempotency_key  TEXT UNIQUE,
  expires_at       TEXT NOT NULL,
  paid_at          TEXT,
  anonymized_at    TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_orders_status ON orders(status, expires_at);
CREATE INDEX idx_orders_email ON orders(buyer_email_idx);
CREATE INDEX idx_orders_slot ON orders(slot_id);
CREATE UNIQUE INDEX idx_orders_payment_ref ON orders(payment_provider, payment_ref) WHERE payment_ref IS NOT NULL;

CREATE TABLE tickets (
  id             INTEGER PRIMARY KEY,
  order_id       INTEGER NOT NULL REFERENCES orders(id),
  code           TEXT NOT NULL UNIQUE,       -- 10 caracteres Crockford base32 (50 bits)
  holder_name_enc TEXT NOT NULL,
  birth_date_enc TEXT NOT NULL,
  weight_kg      INTEGER NOT NULL,
  is_minor       INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','used','cancelled')),
  used_at        TEXT,
  used_by        INTEGER REFERENCES users(id)
);
CREATE INDEX idx_tickets_order ON tickets(order_id);

CREATE TABLE users (
  id             INTEGER PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('admin','checkin','partner')),
  partner_id     INTEGER REFERENCES partners(id),
  pass_hash      TEXT NOT NULL,
  totp_secret_enc TEXT,
  totp_enabled   INTEGER NOT NULL DEFAULT 0,
  totp_last_step INTEGER NOT NULL DEFAULT 0,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until   TEXT,
  disabled       INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (role <> 'partner' OR partner_id IS NOT NULL)
);

CREATE TABLE sessions (
  id_hash     TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf        TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  last_seen   TEXT NOT NULL,
  expires_at  TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE webhook_events (
  provider    TEXT NOT NULL,
  event_id    TEXT NOT NULL,
  received_at TEXT NOT NULL,
  PRIMARY KEY (provider, event_id)
);

-- Log de auditoria encadeado por hash (detecta adulteração/remoção de linhas).
CREATE TABLE audit_log (
  id        INTEGER PRIMARY KEY,
  ts        TEXT NOT NULL,
  actor     TEXT NOT NULL,
  action    TEXT NOT NULL,
  entity    TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  meta      TEXT NOT NULL DEFAULT '{}',
  prev_hash TEXT NOT NULL,
  hash      TEXT NOT NULL
);
