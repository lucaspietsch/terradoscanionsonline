# Segurança

## Modelo de ameaças e controles

| Ameaça | Controle | Onde |
|---|---|---|
| Vazamento do banco | Dados pessoais cifrados por campo (AES-256-GCM, AAD = coluna+registro); chaves derivadas (HKDF) da `MASTER_KEY`, que **não** fica no banco | `lib/crypto.js`, `lib/pii.js` |
| Roubo de conta da equipe | 2FA TOTP obrigatório em produção (com anti-replay), scrypt, bloqueio após 5 falhas, resposta idêntica para usuário inexistente (sem enumeração, tempo equalizado) | `auth.js` |
| Sequestro de sessão / CSRF | Cookie `__Host-` `HttpOnly` `Secure` `SameSite=Strict`, token CSRF por sessão + checagem de `Origin`, só JSON aceito, sessão guardada com hash, expira por ociosidade e por tempo absoluto | `app.js`, `auth.js` |
| XSS | CSP `script-src 'self'` sem inline; o front monta DOM via `textContent` (nunca `innerHTML`); links externos só `https://` | `app.js`, `public/js` |
| Injeção SQL | Apenas consultas parametrizadas; colunas dinâmicas só de lista branca | `routes/admin.js` |
| Fraude de pagamento | Confirmação **sempre** via API do provedor; valor e `external_reference` conferidos; webhook assinado + janela de 10 min + idempotência | `services/orders.js`, `payments/` |
| Overselling / corrida | Reserva atômica (`UPDATE … WHERE reserved+qty<=capacity`), expiração, pagamento tardio re-reserva ou estorna | `services/orders.js` |
| Ingresso falso / reuso | QR com HMAC + código aleatório; check-in atômico `valid→used`; bloqueio por dia e por pagamento | `services/orders.js` |
| Adivinhar pedido alheio | Link = código + HMAC de 128 bits; o código curto sozinho não dá acesso | `lib/crypto.js` |
| Abuso/automação | Rate limit por rota (login, pedidos, cotação, reenvio), corpo máx. 64 KB, limite de ingressos por pedido | `app.js`, `routes/` |
| Adulteração de logs | Auditoria com cadeia HMAC; `GET /api/admin/audit/verify` | `lib/audit.js` |
| Privacidade / LGPD | Minimização (sem CPF/IP), consentimento com versão do termo, acesso a PII auditado, anonimização após `RETENTION_DAYS` | `services/orders.js` |
| Configuração insegura | Em produção o servidor **recusa subir** sem `MASTER_KEY`, sem `https://` ou com pagamento `mock` | `config.js` |

## Limitações conhecidas (leia)

- O **bloqueio de conta** protege contra força bruta, mas permite que alguém trave a conta de um admin por 15 min. O rate limit por IP mitiga; considere alertas.
- **SQLite** = um único servidor. Backup e restauração são responsabilidade sua; guarde a `MASTER_KEY` separada do backup.
- A **rotação da `MASTER_KEY`** não está automatizada (exige recifrar os campos).
- O adaptador **Mercado Pago não foi validado contra a API real** neste repositório.
- Falta WAF/proteção DDoS de borda: use Cloudflare (ou similar) à frente do site.
- Rode `npm audit` e atualize dependências regularmente (o CI já falha em vulnerabilidades altas).

## Reportar vulnerabilidade

Escreva para **[e-mail de segurança — preencher]**. Não abra issue pública com detalhes exploráveis.
