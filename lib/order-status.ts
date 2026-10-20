import type { OrderStatus, DeliveryMethod } from "@prisma/client";

export const STATUS_OPTIONS: OrderStatus[] = ["AWAITING_PAYMENT", "PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "CANCELLED"];

export function ORDER_STATUS_LABEL(status: OrderStatus | string, method: DeliveryMethod | string = "SHIPPING"): string {
  switch (status) {
    case "AWAITING_PAYMENT": return "Aguardando pagamento";
    case "PAID": return "Pago";
    case "IN_PRODUCTION": return "Em produção";
    case "SHIPPED": return method === "PICKUP" ? "Pronto para retirada" : "Enviado";
    case "DELIVERED": return method === "PICKUP" ? "Retirado" : "Entregue";
    case "CANCELLED": return "Cancelado";
    default: return String(status);
  }
}
