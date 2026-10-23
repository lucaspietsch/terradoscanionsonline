-- Convites de acesso (e redefinição de senha) para parceiros: link de uso único, guardado só como hash.
CREATE TABLE invites (
  id          INTEGER PRIMARY KEY,
  token_hash  TEXT NOT NULL UNIQUE,
  partner_id  INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL,
  purpose     TEXT NOT NULL CHECK (purpose IN ('invite','reset')),
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_by  TEXT NOT NULL DEFAULT 'system',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_invites_partner ON invites(partner_id, used_at);
