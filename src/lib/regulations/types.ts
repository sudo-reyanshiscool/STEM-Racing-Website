// The shape of a regulations document. One JSON file per document in src/data/regulations/.
// Text fields allow **bold** and nothing else; see inline() in ./inline.ts.

export type Block =
  | { type: 'p'; text: string }
  /** A numbered rule such as C2.1.1. Its own text sits beside the number. */
  | { type: 'clause'; id: string; text: string; blocks?: Block[] }
  | { type: 'list'; ordered?: boolean; items: (string | { text: string; items?: string[] })[] }
  | { type: 'table'; caption?: string; head: string[]; rows: string[][] }
  | { type: 'callout'; tone?: 'note' | 'important'; text: string }
  | { type: 'figure'; src: string; alt: string; caption?: string };

export interface RegSection {
  /** Anchor id, lower case, letters, digits and hyphens. Unique in the document. */
  id: string;
  /** The number the document gives it: "Article C2", "C2.1", "3.2". Empty when it has none. */
  label?: string;
  title: string;
  blocks?: Block[];
  children?: RegSection[];
}

export interface RegDoc {
  slug: string;
  /** Up to three words, drawn in the page banner. */
  track: string;
  title: string;
  /** One line for cards and the meta description. */
  summary: string;
  /** For example "Season 2025-26". */
  edition: string;
  /** Extra sentence for the introduction, for example about text added from another source. */
  note?: string;
  /** The original file, in public/regulations/. */
  pdf: string;
  pdfPages: number;
  sections: RegSection[];
}
