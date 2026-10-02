import "server-only";
import { cache } from "react";
import { getDb } from "./mongodb";

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export type StudioTextBlock = {
  id: string;
  text: string;
};

export type StudioPrinciple = {
  id: string;
  heading: string;
  text: string;
};

export type StudioContent = {
  intro: StudioTextBlock[];
  principles: StudioPrinciple[];
  images: GalleryImage[];
};

export type AboutCard = {
  id: string;
  heading: string;
  text: string;
};

export type AboutPerson = {
  id: string;
  name: string;
  role: string;
  paragraphs: StudioTextBlock[];
  image: GalleryImage;
  /** The three small stat tiles beneath the portrait. */
  cards: AboutCard[];
};

export type AboutContent = {
  people: AboutPerson[];
  together: {
    eyebrow: string;
    lines: StudioTextBlock[];
    text: string;
  };
};

export type ProjectLink = {
  id: string;
  label: string;
  /** Projects filed under this category, in the order they're walked through. */
  projects: ProjectDetail[];
};

/**
 * One image inside a canvas row. `span` is a relative width — the spans of a
 * row's items are normalised against their sum, so [1, 1] is a 50/50 split and
 * [2, 1] is 66/33, and a row stays valid however many items it holds.
 */
export type ProjectImage = {
  id: string;
  src: string;
  alt: string;
  span: number;
};

/**
 * A row of 1–4 images on the project canvas. `aspect` is the width/height
 * ratio of the whole row, which fixes the row's height; every image in the
 * row shares that height and differs only in width.
 */
export type ProjectImageRow = {
  id: string;
  aspect: number;
  items: ProjectImage[];
};

/** The metadata shown in the fixed left column of a project page. */
export type ProjectMeta = {
  area: string;
  location: string;
  year: string;
  type: string;
};

export type ProjectDetail = {
  /** Slug — used in the URL as /projects/<category>/<id>. */
  id: string;
  title: string;
  meta: ProjectMeta;
  /** Right-column paragraphs. */
  description: StudioTextBlock[];
  /** The italic line centred in the bottom bar. Empty hides it. */
  caption: string;
  rows: ProjectImageRow[];
};

export type ProjectSection = {
  id: string;
  heading: string;
  links: ProjectLink[];
  /** The discipline's tile grid, on the same row model as the other canvases. */
  rows: ProjectImageRow[];
};

export type ProjectsContent = {
  sections: ProjectSection[];
};

export const CONTACT_DETAIL_TYPES = ["email", "phone", "text"] as const;

export type ContactDetailType = (typeof CONTACT_DETAIL_TYPES)[number];

export type ContactDetail = {
  id: string;
  label: string;
  value: string;
  /** Drives whether the value renders as a mailto:/tel: link or plain text. */
  type: ContactDetailType;
};

export type ContactContent = {
  intro: string;
  details: ContactDetail[];
};

export type SiteContent = {
  /**
   * Bumped on every save. A save names the version it was made from, so one
   * made from a stale copy (another tab, another admin) is refused rather
   * than silently overwriting the newer edits. Absent on content seeded
   * before versioning, which counts as 0.
   */
  version?: number;
  header: {
    logoSrc: string;
    logoText: string;
  };
  /**
   * The landing grid. Uses the same row model as a project page's canvas, so
   * the admin gets identical add/resize/reorder controls in both places.
   */
  gallery: {
    rows: ProjectImageRow[];
  };
  studio: StudioContent;
  about: AboutContent;
  projects: ProjectsContent;
  contact: ContactContent;
};


/**
 * The whole site lives in one document. The content is a single editable tree
 * that the admin always saves atomically, so splitting it across collections
 * would buy nothing and cost a multi-document read on every page.
 */
export const CONTENT_COLLECTION = "content";
export const CONTENT_DOC_ID = "site";

type ContentDocument = { _id: string; content: SiteContent };

/** Thrown when a save was made from a copy older than what's stored. */
export class ContentConflictError extends Error {
  constructor() {
    super(
      "This content was changed somewhere else. Reload the page to get the latest version, then edit again."
    );
  }
}

// `cache` dedupes the read within one request — a page and its
// generateMetadata share a single query.
export const readSiteContent = cache(async (): Promise<SiteContent> => {
  const db = await getDb();
  const document = await db
    .collection<ContentDocument>(CONTENT_COLLECTION)
    .findOne({ _id: CONTENT_DOC_ID });

  if (!document) {
    throw new Error(
      `No site content found in MongoDB (${CONTENT_COLLECTION}/${CONTENT_DOC_ID}). ` +
        "Run `npm run migrate:content` to seed it."
    );
  }

  return document.content;
});

/** Saves the content and resolves to its new version. */
export async function writeSiteContent(content: SiteContent): Promise<number> {
  assertValidSiteContent(content);
  const base = content.version ?? 0;
  const version = base + 1;
  const db = await getDb();
  const result = await db
    .collection<ContentDocument>(CONTENT_COLLECTION)
    .updateOne(
      {
        _id: CONTENT_DOC_ID,
        // Only matches if nobody has saved since this copy was read. `null`
        // also matches a missing field, i.e. never-versioned content.
        "content.version": base === 0 ? { $in: [0, null] } : base,
      },
      { $set: { content: { ...content, version } }, $currentDate: { updatedAt: true } }
    );

  if (result.matchedCount === 0) throw new ContentConflictError();
  return version;
}

function isGalleryImage(value: unknown): value is GalleryImage {
  const image = value as Partial<GalleryImage> | null;
  return (
    !!image &&
    typeof image.id === "string" &&
    typeof image.src === "string" &&
    typeof image.alt === "string"
  );
}

function isTextBlock(value: unknown): value is StudioTextBlock {
  const block = value as Partial<StudioTextBlock> | null;
  return !!block && typeof block.id === "string" && typeof block.text === "string";
}

function isProjectImageRow(value: unknown): value is ProjectImageRow {
  const row = value as Partial<ProjectImageRow> | null;
  return (
    !!row &&
    typeof row.id === "string" &&
    typeof row.aspect === "number" &&
    Number.isFinite(row.aspect) &&
    row.aspect > 0 &&
    Array.isArray(row.items) &&
    row.items.length > 0 &&
    row.items.every(
      (item) =>
        isGalleryImage(item) &&
        typeof (item as ProjectImage).span === "number" &&
        Number.isFinite((item as ProjectImage).span) &&
        (item as ProjectImage).span > 0
    )
  );
}

function isProjectDetail(value: unknown): value is ProjectDetail {
  const project = value as Partial<ProjectDetail> | null;
  return (
    !!project &&
    typeof project.id === "string" &&
    typeof project.title === "string" &&
    typeof project.caption === "string" &&
    !!project.meta &&
    typeof project.meta.area === "string" &&
    typeof project.meta.location === "string" &&
    typeof project.meta.year === "string" &&
    typeof project.meta.type === "string" &&
    Array.isArray(project.description) &&
    project.description.every(isTextBlock) &&
    Array.isArray(project.rows) &&
    project.rows.every(isProjectImageRow)
  );
}

/** Narrow, defensive validation — enough to keep the JSON file well-formed. */
function assertValidSiteContent(value: unknown): asserts value is SiteContent {
  if (!value || typeof value !== "object") {
    throw new Error("Content must be an object");
  }
  const content = value as Partial<SiteContent>;

  if (
    content.version !== undefined &&
    !(Number.isInteger(content.version) && content.version >= 0)
  ) {
    throw new Error("Content has an invalid version");
  }

  if (
    !content.header ||
    typeof content.header.logoSrc !== "string" ||
    typeof content.header.logoText !== "string"
  ) {
    throw new Error("Content is missing a valid header.logoSrc/logoText");
  }

  if (
    !content.gallery ||
    !Array.isArray(content.gallery.rows) ||
    !content.gallery.rows.every(isProjectImageRow)
  ) {
    throw new Error("Content is missing a valid gallery.rows array");
  }

  const studio = content.studio;
  if (!studio) {
    throw new Error("Content is missing a studio section");
  }

  if (
    !Array.isArray(studio.intro) ||
    !studio.intro.every(
      (b) => b && typeof b.id === "string" && typeof b.text === "string"
    )
  ) {
    throw new Error("Content is missing a valid studio.intro array");
  }

  if (
    !Array.isArray(studio.principles) ||
    !studio.principles.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.heading === "string" &&
        typeof p.text === "string"
    )
  ) {
    throw new Error("Content is missing a valid studio.principles array");
  }

  if (!Array.isArray(studio.images) || !studio.images.every(isGalleryImage)) {
    throw new Error("Content is missing a valid studio.images array");
  }

  const about = content.about;
  if (!about) {
    throw new Error("Content is missing an about section");
  }

  if (
    !Array.isArray(about.people) ||
    !about.people.every(
      (person) =>
        person &&
        typeof person.id === "string" &&
        typeof person.name === "string" &&
        typeof person.role === "string" &&
        Array.isArray(person.paragraphs) &&
        person.paragraphs.every(isTextBlock) &&
        isGalleryImage(person.image) &&
        Array.isArray(person.cards) &&
        person.cards.every(
          (card) =>
            card &&
            typeof card.id === "string" &&
            typeof card.heading === "string" &&
            typeof card.text === "string"
        )
    )
  ) {
    throw new Error("Content is missing a valid about.people array");
  }

  if (
    !about.together ||
    typeof about.together.eyebrow !== "string" ||
    typeof about.together.text !== "string" ||
    !Array.isArray(about.together.lines) ||
    !about.together.lines.every(isTextBlock)
  ) {
    throw new Error("Content is missing a valid about.together section");
  }

  const projects = content.projects;
  if (
    !projects ||
    !Array.isArray(projects.sections) ||
    !projects.sections.every(
      (section) =>
        section &&
        typeof section.id === "string" &&
        typeof section.heading === "string" &&
        Array.isArray(section.links) &&
        section.links.every(
          (link) =>
            link &&
            typeof link.id === "string" &&
            typeof link.label === "string" &&
            Array.isArray(link.projects) &&
            link.projects.every(isProjectDetail)
        ) &&
        Array.isArray(section.rows) &&
        section.rows.every(isProjectImageRow)
    )
  ) {
    throw new Error("Content is missing a valid projects.sections array");
  }

  const contact = content.contact;
  if (!contact || typeof contact.intro !== "string") {
    throw new Error("Content is missing a valid contact.intro");
  }

  if (
    !Array.isArray(contact.details) ||
    !contact.details.every(
      (d) =>
        d &&
        typeof d.id === "string" &&
        typeof d.label === "string" &&
        typeof d.value === "string" &&
        CONTACT_DETAIL_TYPES.includes(d.type)
    )
  ) {
    throw new Error("Content is missing a valid contact.details array");
  }
}
