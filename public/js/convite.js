import { $, ApiError, api, boot, clear, h, icon } from './common.js';
boot();
const root = $('#convite');
const token = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');

// Mesma regra do servidor (lib/crypto.js → checkPasswordPolicy), só para orientar enquanto digita.
const rules = [
  ['Pelo menos 12 caracteres', (p) => p.length >= 12],
  ['Ao menos 3 tipos: minúscula, MAIÚSCULA, número, símbolo', (p) => [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length >= 3],
  ['Sem o mesmo caractere repetido 5 vezes seguidas', (p) => !/(.)\1{4,}/.test(p)],
];

function gone(msg) {
  clear(root).append(h('div', { class: 'card stack' }, h('h1', {}, 'Link indisponível'), h('p', {}, msg || 'Este link já foi usado ou expirou.'),
    h('p', { class: 'muted' }, 'Peça um novo link ao administrador do Terra dos Cânions Online. Se você já criou sua senha, entre no painel.'),
    h('a', { class: 'btn btn-dark', href: '/admin' }, 'Ir para o painel')));
}

try {
  const info = await api(`/invites/${encodeURIComponent(token)}`);
  const reset = info.purpose === 'reset';
  const first = info.name.split(' ')[0];
  const list = h('ul', { class: 'info-list' }, rules.map(([t]) => h('li', { class: 'muted' }, h('span', { class: 'mark', 'aria-hidden': 'true' }, '○'), h('span', {}, t))));
  const err = h('div', { 'aria-live': 'assertive' });
  const pass = h('input', { id: 'pw', type: 'password', autocomplete: 'new-password', required: true, maxlength: 128 });
  const conf = h('input', { id: 'pw2', type: 'password', autocomplete: 'new-password', required: true, maxlength: 128 });
  const show = h('input', { type: 'checkbox', onchange: (e) => { pass.type = conf.type = e.target.checked ? 'text' : 'password'; } });
  const update = () => rules.forEach(([label, ok], i) => { const li = list.children[i]; const met = ok(pass.value); li.className = met ? 'rule-ok' : 'muted'; li.firstChild.textContent = met ? '✓' : '○'; li.lastChild.setAttribute('title', met ? `${label} — ok` : label); });
  pass.addEventListener('input', update);

  const form = h('form', { class: 'card stack', onsubmit: async (e) => {
    e.preventDefault(); clear(err);
    if (pass.value !== conf.value) { err.append(h('div', { class: 'alert alert-error', role: 'alert' }, 'As duas senhas não são iguais.')); return; }
    const btn = $('button[type=submit]', form); btn.disabled = true;
    try {
      await api('/invites/accept', { method: 'POST', body: { token, password: pass.value } });
      clear(root).append(h('div', { class: 'card stack' }, h('span', { class: 'tag' }, 'Tudo certo'), h('h1', {}, reset ? 'Senha redefinida!' : 'Senha criada!'),
        h('p', { class: 'lead' }, reset ? 'Já pode entrar com a nova senha.' : 'Agora entre no painel e deixe a página do seu negócio pronta.'),
        reset ? null : h('ol', { class: 'info-list' }, ['Entre com o e-mail e a senha que você acabou de criar.', 'Preencha a frase de destaque, a descrição e o WhatsApp.', 'Cadastre seus produtos e serviços — eles aparecem na sua página e no catálogo.'].map((t, i) => h('li', {}, h('span', { class: 'num' }, String(i + 1)), h('span', {}, t)))),
        h('a', { class: 'btn btn-primary', href: '/admin' }, 'Entrar no painel', icon('arrow-right'))));
    } catch (ex) {
      btn.disabled = false;
      if (ex instanceof ApiError && ex.status === 410) return gone(ex.message);
      err.append(h('div', { class: 'alert alert-error', role: 'alert' }, ex.message));
    }
  } },
    h('span', { class: 'tag' }, info.partnerName),
    h('h1', {}, reset ? 'Crie uma nova senha' : `Olá, ${first}!`),
    h('p', { class: 'lead' }, reset ? `Defina a nova senha de acesso ao painel de ${info.partnerName}.` : `Crie sua senha para cuidar da página de ${info.partnerName} no Terra dos Cânions Online.`),
    h('p', { class: 'small muted' }, 'Seu login será: ', h('b', {}, info.email)),
    h('div', { class: 'field' }, h('label', { for: 'pw' }, 'Senha'), pass, list),
    h('div', { class: 'field' }, h('label', { for: 'pw2' }, 'Repita a senha'), conf),
    h('label', { class: 'check' }, show, 'Mostrar senha'),
    err, h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, reset ? 'Salvar nova senha' : 'Criar minha senha'),
    h('p', { class: 'hint center' }, 'Este link é de uso único e só serve para você.'));
  clear(root).append(form);
  pass.focus();
} catch (e) {
  if (e instanceof ApiError && (e.status === 410 || e.status === 404)) gone(e.message);
  else clear(root).append(h('div', { class: 'alert alert-error', role: 'alert' }, e.message || 'Não foi possível verificar o convite agora. Tente de novo.'));
}
