export type ChapterType = "front" | "body" | "back";

export const MATTER_PRESETS = [
  { key: "title-page", type: "front", title: "Title Page" },
  { key: "copyright", type: "front", title: "Copyright" },
  { key: "dedication", type: "front", title: "Dedication" },
  { key: "epigraph", type: "front", title: "Epigraph" },
  { key: "acknowledgments", type: "back", title: "Acknowledgments" },
  { key: "about-the-author", type: "back", title: "About the Author" },
] as const;

const RANK: Record<string, number> = { front: 0, body: 1, back: 2 };

export function sortChapters<T extends { type: string; position: number }>(
  rows: T[],
): T[] {
  return [...rows].sort(
    (a, b) =>
      (RANK[a.type] ?? 1) - (RANK[b.type] ?? 1) || a.position - b.position,
  );
}
