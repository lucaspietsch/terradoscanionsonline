import type { Metadata } from "next";
import { DemoNotice, PageHeader } from "@/components/admin/ui";
import { SettingsForm, TestimonialManager } from "@/components/admin/settings-form";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/data/settings";
import { dbReady } from "@/lib/server/admin-page";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  if (!dbReady()) return <><PageHeader title="Configurações" /><DemoNotice /></>;
  const [settings, testimonials] = await Promise.all([getSettings(), prisma.testimonial.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] })]);
  return (
    <>
      <PageHeader title="Configurações" />
      <SettingsForm settings={settings} />
      <h2 className="mb-4 mt-16 font-serif text-2xl font-light">Depoimentos</h2>
      <TestimonialManager items={testimonials.map((t) => ({ id: t.id, author: t.author, location: t.location, text: t.text, published: t.published }))} />
    </>
  );
}
