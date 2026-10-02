#!/usr/bin/env node
/**
 * One-off helper to generate the bcrypt hash for ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/hash-password.mjs 'your-password-here'
 *
 * Use single quotes, so the shell doesn't rewrite a `$` or `!` in the
 * password. Paste the printed line into .env.local as-is — never commit the
 * plaintext password anywhere.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
// Next.js treats `$name` in an env file as a variable to substitute, which
// would mangle the hash — so the `$` signs are printed already escaped.
console.log(`ADMIN_PASSWORD_HASH=${hash.replaceAll("$", "\\$")}`);
