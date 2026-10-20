-- Row Level Security — execute no SQL Editor do Supabase DEPOIS de `prisma db push` / migrate.
--
-- O Prisma conecta com o papel `postgres` (dono das tabelas), que ignora RLS. Estas políticas
-- protegem o acesso via PostgREST/Realtime com a chave anon/authenticated: por padrão NADA é
-- exposto, exceto leitura pública do catálogo e o que pertence ao próprio usuário.

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '\_prisma%' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Catálogo: leitura pública (somente ativos)
CREATE POLICY "catalog_read_categories" ON "Category" FOR SELECT USING (true);
CREATE POLICY "catalog_read_finishes"   ON "Finish"   FOR SELECT USING (true);
CREATE POLICY "catalog_read_products"   ON "Product"  FOR SELECT USING (active = true);
CREATE POLICY "catalog_read_images"     ON "ProductImage" FOR SELECT USING (true);
CREATE POLICY "catalog_read_variants"   ON "ProductVariant" FOR SELECT USING (true);
CREATE POLICY "testimonials_read"       ON "Testimonial" FOR SELECT USING (published = true);

-- Dados do próprio usuário
CREATE POLICY "user_self_read"   ON "User" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_self_update" ON "User" FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = 'CUSTOMER');
CREATE POLICY "address_owner"    ON "Address" FOR ALL USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");
CREATE POLICY "cart_owner"       ON "Cart" FOR ALL USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");
CREATE POLICY "cartitem_owner"   ON "CartItem" FOR ALL
  USING (EXISTS (SELECT 1 FROM "Cart" c WHERE c.id = "cartId" AND c."userId" = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM "Cart" c WHERE c.id = "cartId" AND c."userId" = auth.uid()));
CREATE POLICY "wishlist_owner"   ON "WishlistItem" FOR ALL USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");
CREATE POLICY "order_owner_read" ON "Order" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "orderitem_owner_read" ON "OrderItem" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Order" o WHERE o.id = "orderId" AND o."userId" = auth.uid()));

-- Sem política = sem acesso via API pública: Coupon, Setting, PaymentEvent, NewsletterSubscriber, ContactMessage.
-- (Escritas de pedidos, cupons, newsletter e contato acontecem só no servidor, via Prisma.)

-- Storage: bucket público para fotos de produtos (upload só pelo servidor com service role)
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "products_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'products');
