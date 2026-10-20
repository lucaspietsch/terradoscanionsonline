import type { Metadata } from "next";
import { CouponManager } from "@/components/admin/coupon-manager";
import { DemoNotice, PageHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { dbReady } from "@/lib/server/admin-page";

export const metadata: Metadata = { title: "Cupons" };

export default async function CouponsPage() {
  if (!dbReady()) return <><PageHeader title="Cupons" /><DemoNotice /></>;
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Cupons" subtitle="Percentual ou valor fixo, com validade e limite de uso. O desconto nunca passa do subtotal." />
      <CouponManager
        coupons={rows.map((c) => ({ id: c.id, code: c.code, type: c.type, value: c.value, startsAt: c.startsAt?.toISOString() ?? null, expiresAt: c.expiresAt?.toISOString() ?? null, maxUses: c.maxUses, usedCount: c.usedCount, minSubtotalCents: c.minSubtotalCents, active: c.active }))}
      />
    </>
  );
}
