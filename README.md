# HS Architects

Portfolio site for HS Architects. Next.js 16 (App Router), Tailwind CSS v4, MongoDB for content, Cloudinary for images.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in:
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` — the admin sign-in. Generate the hash with `node scripts/hash-password.mjs "your-password"`.
   - `SESSION_SECRET` — any long random string, e.g. `openssl rand -base64 32`.
   - `MONGODB_URI` (and optionally `MONGODB_DB`) — where the site content lives.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — where uploaded images go.
   - `SITE_URL` — the public address, used for the sitemap and share previews. Optional on Vercel.
3. `npm run dev` and open http://localhost:3000.

## Content

All text and image references are one MongoDB document (`content` collection, `_id: "site"`). `content/site-content.json` and `public/uploads/` are only the starting seed.

`npm run migrate:content` uploads the seed images to Cloudinary and writes the seed content to MongoDB. **It replaces whatever content is in the database**, so run it once on a fresh database, not on a live one. Add `-- --dry-run` to see what it would do.

## Editing the site

Sign in at `/admin/login`. Every public page has an editable twin under `/admin` (`/admin`, `/admin/studio`, `/admin/about`, `/admin/projects`, `/admin/contact`, and each project page). Hover any text or image to edit it; changes save immediately.

If the same content is open in two tabs, or by two people, the second save is refused with a message asking to reload — nothing is overwritten silently.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run migrate:content` | Seed MongoDB and Cloudinary (see above) |
