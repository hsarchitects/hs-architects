/**
 * The site's public origin, for absolute URLs in metadata, the sitemap and
 * robots.txt. Set SITE_URL once the domain is known; on Vercel it falls back
 * to the project's production domain.
 */
export const SITE_URL =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
