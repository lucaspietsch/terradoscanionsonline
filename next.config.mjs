const isDev = process.env.NODE_ENV !== "production";
// upgrade-insecure-requests quebraria `next start` em http://localhost; só em produção https.
const isHttps = Boolean(process.env.VERCEL) || (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const supabaseHost = supabaseUrl?.hostname ?? null;
// origem exata do projeto (cobre também domínio customizado do Supabase)
const supabaseOrigin = supabaseUrl ? supabaseUrl.origin : "";

const csp = [
  "default-src 'self'",
  // Next injeta scripts inline; um CSP com nonce forçaria renderização dinâmica e desligaria o ISR.
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://sdk.mercadopago.com https://http2.mlstatic.com https://www.googletagmanager.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin} https://*.supabase.co https://www.mercadopago.com https://http2.mlstatic.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://*.tile.openstreetmap.org`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://viacep.com.br https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net`,
  "frame-src 'self' https://*.mercadopago.com https://*.mercadolibre.com https://www.openstreetmap.org https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isHttps && !isDev ? ["upgrade-insecure-requests"] : []),
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/webp"],
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost }] : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
        ],
      },
    ];
  },
};
export default nextConfig;
