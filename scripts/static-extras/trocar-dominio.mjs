// Troca o endereço provisório (http://localhost:3000) pelo endereço real do seu site em todos os arquivos.
// Uso (precisa do Node instalado):   node trocar-dominio.mjs https://www.seudominio.com.br
// Serve para: imagem de compartilhamento (WhatsApp/Instagram), sitemap.xml, canonical e dados estruturados.
import fs from "node:fs";
import path from "node:path";

const novo = (process.argv[2] ?? "").replace(/\/+$/, "");
if (!/^https?:\/\/[^\s/]+/.test(novo)) {
  console.error("Informe o endereço completo, ex.: node trocar-dominio.mjs https://www.seudominio.com.br");
  process.exit(1);
}
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
let arquivos = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(html|txt|xml|json|webmanifest|js)$/.test(e.name) && !e.name.startsWith("trocar-")) {
      const t = fs.readFileSync(p, "utf8");
      if (t.includes("http://localhost:3000")) { fs.writeFileSync(p, t.replaceAll("http://localhost:3000", novo)); arquivos++; }
    }
  }
})(dir);
console.log(`Pronto: ${arquivos} arquivos atualizados para ${novo}`);
