export type LegalDoc = {
  slug: string;
  title: string;
  updated: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
};
