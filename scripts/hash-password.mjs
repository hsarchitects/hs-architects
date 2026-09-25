#!/usr/bin/env node
/**
 * One-off helper to generate the bcrypt hash for ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/hash-password.mjs "your-password-here"
 *
 * Copy the printed hash into .env.local — never commit the plaintext
 * password anywhere.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log(hash);
