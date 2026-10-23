import { createHmac } from 'node:crypto';

const GENESIS = '0'.repeat(64);

export function createAudit(db, key) {
  const last = db.prepare('SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1');
  const insert = db.prepare(
    'INSERT INTO audit_log (ts, actor, action, entity, entity_id, meta, prev_hash, hash) VALUES (?,?,?,?,?,?,?,?)',
  );
  const mac = (...parts) => createHmac('sha256', key).update(parts.join('\u001f')).digest('hex');

  // Executa em transação própria (better-sqlite3 aceita aninhamento via savepoint).
  const write = db.transaction(({ actor = 'system', action, entity = '', entityId = '', meta = {} }) => {
    const prev = last.get()?.hash ?? GENESIS;
    const ts = new Date().toISOString();
    const metaJson = JSON.stringify(meta);
    insert.run(ts, actor, action, entity, String(entityId), metaJson, prev, mac(prev, ts, actor, action, entity, entityId, metaJson));
  });

  function verify() {
    let prev = GENESIS;
    for (const r of db.prepare('SELECT * FROM audit_log ORDER BY id').iterate()) {
      if (r.prev_hash !== prev || r.hash !== mac(prev, r.ts, r.actor, r.action, r.entity, r.entity_id, r.meta)) {
        return { ok: false, brokenAt: r.id };
      }
      prev = r.hash;
    }
    return { ok: true };
  }

  return { write, verify };
}
