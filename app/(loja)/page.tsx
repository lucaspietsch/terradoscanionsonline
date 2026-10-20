import { About } from "@/components/home/about";
import { BuildGarden } from "@/components/home/build-garden";
import { Categories } from "@/components/home/categories";
import { FaqSection } from "@/components/home/faq";
import { FeaturedProducts } from "@/components/home/featured-products";
import { FeaturesMarquee } from "@/components/home/features-marquee";
import { Hero } from "@/components/home/hero";
import { InstagramGallery } from "@/components/home/instagram-gallery";
import { Newsletter } from "@/components/home/newsletter";
import { Testimonials } from "@/components/home/testimonials";
import { getCategories, getProductCards } from "@/lib/data/catalog";
import { getSettings, getTestimonials } from "@/lib/data/settings";
import { formatBRL } from "@/lib/money";

export const revalidate = 300;

export default async function HomePage() {
  const [products, categories, settings, testimonials] = await Promise.all([getProductCards(), getCategories(), getSettings(), getTestimonials()]);
  const thresholdLabel = formatBRL(settings.freeShippingThresholdCents).replace(",00", "");
  const featured = products.filter((p) => p.featured);

  return (
    <>
      <Hero />
      <FeaturesMarquee thresholdLabel={thresholdLabel} />
      <Categories categories={categories} products={products} />
      <FeaturedProducts products={featured} />
      <About />
      <BuildGarden products={products} />
      <InstagramGallery handle={settings.instagram} />
      <Testimonials items={testimonials} />
      <FaqSection thresholdLabel={thresholdLabel} />
      <Newsletter />
    </>
  );
}
