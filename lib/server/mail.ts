import "server-only";
import { site } from "@/lib/site";
import { formatBRL } from "@/lib/money";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[mail] RESEND_API_KEY ausente — e-mail "${opts.subject}" para ${opts.to} não enviado.`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? `Cambará Ornamentais <pedidos@${new URL(site.url).hostname}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo && { reply_to: opts.replyTo }),
      }),
    });
    if (!res.ok) console.error("[mail] Resend", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[mail] falha ao enviar", err);
    return false;
  }
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#ECEAE5;padding:32px 12px;font-family:Helvetica,Arial,sans-serif;color:#232A21">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#F6F5F2;border-radius:4px">
    <tr><td style="padding:28px 32px 8px"><span style="font-family:Georgia,serif;font-size:24px;font-weight:300;letter-spacing:.06em;color:#2F3E2C">Cambará</span><br>
      <span style="font-size:10px;letter-spacing:.5em;color:#5C6657">ORNAMENTAIS</span></td></tr>
    <tr><td style="padding:16px 32px 8px"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0 0 12px;color:#232A21">${title}</h1>${body}</td></tr>
    <tr><td style="padding:20px 32px 28px;font-size:12px;color:#5C6657;border-top:1px solid #C9C5BD">Cambará Ornamentais · CNPJ ${esc(site.cnpj)}<br>Dúvidas? Responda este e-mail ou fale pelo <a href="https://wa.me/${site.whatsapp}" style="color:#2F3E2C">WhatsApp</a>.</td></tr>
  </table></body></html>`;
}

const p = (t: string) => `<p style="font-size:15px;line-height:1.6;margin:0 0 14px">${t}</p>`;
const btn = (href: string, label: string) =>
  `<p style="margin:20px 0"><a href="${href}" style="background:#2F3E2C;color:#F6F5F2;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:14px;display:inline-block">${label}</a></p>`;

interface MailOrder {
  number: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  items: { productName: string; finishName: string; quantity: number; unitPriceCents: number }[];
  accessToken: string;
  trackingCode?: string | null;
  deliveryMethod: "SHIPPING" | "PICKUP";
  pixExpiresAt?: Date | null;
  boletoUrl?: string | null;
}

const orderUrl = (o: MailOrder) => `${site.url}/pedido/${o.number}?token=${o.accessToken}`;

function summary(o: MailOrder) {
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;font-size:14px">${i.quantity}× ${esc(i.productName)} <span style="color:#5C6657">· ${esc(i.finishName)}</span></td><td align="right" style="font-size:14px">${formatBRL(i.unitPriceCents * i.quantity)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" style="border-top:1px solid #C9C5BD;border-bottom:1px solid #C9C5BD;margin:14px 0">${rows}
    <tr><td style="padding:6px 0;font-size:13px;color:#5C6657">Frete</td><td align="right" style="font-size:13px;color:#5C6657">${o.shippingCents ? formatBRL(o.shippingCents) : "Grátis"}</td></tr>
    ${o.discountCents ? `<tr><td style="font-size:13px;color:#5C6657">Desconto</td><td align="right" style="font-size:13px;color:#5C6657">− ${formatBRL(o.discountCents)}</td></tr>` : ""}
    <tr><td style="padding:8px 0;font-size:15px"><strong>Total</strong></td><td align="right" style="font-size:15px"><strong>${formatBRL(o.totalCents)}</strong></td></tr></table>`;
}

export const mails = {
  orderCreated(o: MailOrder) {
    const pay = o.boletoUrl
      ? p(`Seu boleto vence em 3 dias. ${`<a href="${esc(o.boletoUrl)}" style="color:#2F3E2C">Abrir boleto</a>`}`)
      : o.pixExpiresAt
        ? p("O código Pix vale por 30 minutos. Você pode copiá-lo novamente na página do pedido.")
        : "";
    return {
      subject: `Recebemos seu pedido ${o.number}`,
      html: layout(
        `Pedido ${o.number} recebido`,
        p(`Olá, ${esc(o.customerName.split(" ")[0])}! Obrigada por escolher a Cambará. Assim que o pagamento for confirmado, começamos a preparar suas peças.`) +
          summary(o) + pay + btn(orderUrl(o), "Acompanhar pedido"),
      ),
    };
  },
  paymentApproved(o: MailOrder) {
    return {
      subject: `Pagamento aprovado — pedido ${o.number}`,
      html: layout(
        "Pagamento aprovado",
        p(`Tudo certo, ${esc(o.customerName.split(" ")[0])}. Recebemos o pagamento do pedido <strong>${o.number}</strong> e já estamos preparando suas peças à mão.`) +
          summary(o) +
          p(
            o.deliveryMethod === "PICKUP"
              ? "Avisaremos assim que estiver pronto para retirada."
              : "Você receberá outro e-mail com o código de rastreio assim que o pedido for enviado.",
          ) +
          btn(orderUrl(o), "Ver pedido"),
      ),
    };
  },
  orderShipped(o: MailOrder) {
    const pickup = o.deliveryMethod === "PICKUP";
    return {
      subject: pickup ? `Pedido ${o.number} pronto para retirada` : `Pedido ${o.number} a caminho`,
      html: layout(
        pickup ? "Pronto para retirada" : "Seu pedido foi enviado",
        pickup
          ? p(`O pedido <strong>${o.number}</strong> está pronto para retirada no endereço combinado.`)
          : p(`O pedido <strong>${o.number}</strong> saiu da nossa oficina, embalado com cuidado.`) +
              (o.trackingCode
                ? p(`Código de rastreio: <strong style="letter-spacing:.04em">${esc(o.trackingCode)}</strong>`) +
                  btn(`https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(o.trackingCode)}`, "Rastrear entrega")
                : "") +
              p("Ao receber, confira a peça. Se algo chegar danificado, avise em até 7 dias com fotos."),
      ),
    };
  },
  contact(name: string, email: string, message: string) {
    return {
      subject: `Contato pelo site — ${name}`,
      html: layout("Nova mensagem", p(`<strong>${esc(name)}</strong> &lt;${esc(email)}&gt;`) + p(esc(message).replace(/\n/g, "<br>"))),
    };
  },
};
export type { MailOrder };
