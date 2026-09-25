import type {
  ProjectDetail,
  ProjectLink,
  ProjectSection,
  ProjectsContent,
} from "./content";

/**
 * Pure navigation helpers over the projects tree. Kept apart from lib/content
 * so client components can import them without dragging that module's `fs`
 * import into the browser bundle — the same reason ContactView keeps its own
 * href helper.
 */

/** One project, plus the category and discipline it sits in. */
export type ProjectStop = {
  section: ProjectSection;
  category: ProjectLink;
  project: ProjectDetail;
};

export function projectHref(categoryId: string, projectId: string) {
  return `/projects/${categoryId}/${projectId}`;
}

export function adminProjectHref(categoryId: string, projectId: string) {
  return `/admin/projects/${categoryId}/${projectId}`;
}

/**
 * Every project in a discipline, flattened in category order — this is the
 * sequence the Previous/Next buttons walk. Architecture runs Holiday Homes →
 * Commercial spaces → Housing and Residential → Master Planning, and Interior
 * Design is a separate, independent sequence.
 */
export function sectionSequence(section: ProjectSection): ProjectStop[] {
  return section.links.flatMap((category) =>
    category.projects.map((project) => ({ section, category, project }))
  );
}

/** The first project of a category, or null when the category is empty. */
export function firstProjectOfCategory(category: ProjectLink) {
  return category.projects[0] ?? null;
}

export type ProjectLocation = {
  stop: ProjectStop;
  /** Position within the discipline's flattened sequence. */
  index: number;
  sequence: ProjectStop[];
  previous: ProjectStop | null;
  next: ProjectStop | null;
};

/**
 * Resolves a /projects/<category>/<project> pair to its place in the
 * discipline sequence, or null if either segment doesn't exist.
 */
export function locateProject(
  projects: ProjectsContent,
  categoryId: string,
  projectId: string
): ProjectLocation | null {
  for (const section of projects.sections) {
    const category = section.links.find((link) => link.id === categoryId);
    if (!category) continue;
    if (!category.projects.some((project) => project.id === projectId)) {
      return null;
    }

    const sequence = sectionSequence(section);
    const index = sequence.findIndex(
      (stop) => stop.category.id === categoryId && stop.project.id === projectId
    );
    if (index === -1) return null;

    return {
      stop: sequence[index],
      index,
      sequence,
      previous: sequence[index - 1] ?? null,
      next: sequence[index + 1] ?? null,
    };
  }
  return null;
}

/** Every (category, project) pair on the site — used to prerender routes. */
export function allProjectStops(projects: ProjectsContent): ProjectStop[] {
  return projects.sections.flatMap(sectionSequence);
}
