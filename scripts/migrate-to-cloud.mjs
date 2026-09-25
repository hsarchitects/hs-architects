#!/usr/bin/env node
/**
 * One-off migration: content/site-content.json -> MongoDB, and every local
 * /uploads/* image -> Cloudinary.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-to-cloud.mjs [--dry-run]
 *
 * Safe to re-run: images already pointing at Cloudinary are left alone, and
 * each local file is uploaded once and reused wherever it appears.
 */
import { promises as fs } from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = process.cwd();
const CONTENT_PATH = path.join(ROOT, "content", "site-content.json");
const FOLDER = "hs-architects";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Add it to .env.local.`);
    process.exit(1);
  }
  return value;
}

const MONGODB_URI = requireEnv("MONGODB_URI");
const DB_NAME = process.env.MONGODB_DB || "hs_architects";

// Configured only when we're actually going to upload, so --dry-run works
// before any Cloudinary credentials exist.
let cloudinaryReady = false;
function configureCloudinary() {
  if (cloudinaryReady) return;
  cloudinary.config({
    cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: requireEnv("CLOUDINARY_API_KEY"),
    api_secret: requireEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });
  cloudinaryReady = true;
}

/** Rewrites every `src` in the tree, in place, via `replace`. */
async function walkImages(node, replace) {
  if (Array.isArray(node)) {
    for (const item of node) await walkImages(item, replace);
    return;
  }
  if (!node || typeof node !== "object") return;

  for (const [key, value] of Object.entries(node)) {
    if ((key === "src" || key === "logoSrc") && typeof value === "string") {
      node[key] = await replace(value);
    } else {
      await walkImages(value, replace);
    }
  }
}

const uploaded = new Map();

async function toCloudinary(src) {
  if (!src.startsWith("/uploads/")) return src; // already remote, or empty
  if (uploaded.has(src)) return uploaded.get(src);

  const filePath = path.join(ROOT, "public", src);
  try {
    await fs.access(filePath);
  } catch {
    console.warn(`  ! missing file, leaving as-is: ${src}`);
    return src;
  }

  if (DRY_RUN) {
    console.log(`  would upload ${src}`);
    uploaded.set(src, src);
    return src;
  }

  configureCloudinary();
  const publicId = path.parse(src).name;
  const result = await cloudinary.uploader.upload(filePath, {
    folder: FOLDER,
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
  });
  console.log(`  uploaded ${src} -> ${result.secure_url}`);
  uploaded.set(src, result.secure_url);
  return result.secure_url;
}

const raw = await fs.readFile(CONTENT_PATH, "utf-8");
const content = JSON.parse(raw);

console.log(DRY_RUN ? "Dry run — nothing will be written.\n" : "");
console.log("Uploading images to Cloudinary...");
await walkImages(content, toCloudinary);
console.log(`\n${uploaded.size} distinct image(s) handled.`);

if (DRY_RUN) {
  console.log("Dry run complete — MongoDB not touched.");
  process.exit(0);
}

console.log("\nWriting content to MongoDB...");
const client = new MongoClient(MONGODB_URI);
await client.connect();
try {
  const result = await client
    .db(DB_NAME)
    .collection("content")
    .updateOne(
      { _id: "site" },
      { $set: { content }, $currentDate: { updatedAt: true } },
      { upsert: true }
    );
  console.log(
    result.upsertedCount ? "  inserted site content" : "  updated site content"
  );
} finally {
  await client.close();
}

// Keep the migrated JSON on disk as a record of what was pushed.
const backup = CONTENT_PATH.replace(/\.json$/, ".migrated.json");
await fs.writeFile(backup, JSON.stringify(content, null, 2) + "\n");
console.log(`\nDone. Cloudinary-rewritten copy saved to ${path.relative(ROOT, backup)}`);
console.log("The site now reads from MongoDB; content/site-content.json is no longer used at runtime.");
