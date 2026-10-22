export type CoverStyle = {
  bg: string;
  title: string;
  author: string;
  rule: string;
  spine: string;
};

const light = {
  spine: "from-stone-900/20 via-stone-900/5 to-transparent",
};
const dark = {
  spine: "from-black/40 via-black/10 to-transparent",
};

export const COVER_STYLES: CoverStyle[] = [
  {
    bg: "#F2EDE4",
    title: "#1c1917",
    author: "#44403c",
    rule: "#a8a29e",
    ...light,
  },
  {
    bg: "#1C2622",
    title: "#F4F6F4",
    author: "#D1D9D4",
    rule: "#6ee7b7",
    ...dark,
  },
  {
    bg: "#1E1B4B",
    title: "#EEF2FF",
    author: "#C7D2FE",
    rule: "#818cf8",
    ...dark,
  },
  {
    bg: "#8C3A27",
    title: "#FFF1EC",
    author: "#FFD5C8",
    rule: "#FFB4A3",
    ...dark,
  },
  {
    bg: "#DCE3DE",
    title: "#1c2b24",
    author: "#3f5248",
    rule: "#7c9486",
    ...light,
  },
  {
    bg: "#EFE8E1",
    title: "#1c1917",
    author: "#44403c",
    rule: "#ae3115",
    ...light,
  },
  {
    bg: "#18181B",
    title: "#FAFAF7",
    author: "#D4D4D8",
    rule: "#FF6B4A",
    ...dark,
  },
  {
    bg: "#F7F6F2",
    title: "#1b1b1e",
    author: "#464555",
    rule: "#4F46E5",
    ...light,
  },
];

export function coverStyleFor(id: string): CoverStyle {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return COVER_STYLES[hash % COVER_STYLES.length];
}
