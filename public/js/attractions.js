import { $, api, attractionCard, boot, showError } from './common.js';
boot();
const root = $('#attractions');
try {
  const list = await api('/attractions');
  root.append(...list.map((a, i) => attractionCard(a, i)));
} catch (e) { showError(root, e); }
