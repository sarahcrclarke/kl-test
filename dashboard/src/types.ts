export type TagId =
  | "promo"
  | "new_in"
  | "bestsellers"
  | "gifting"
  | "personalisation"
  | "social_proof"
  | "sustainability"
  | "loyalty"
  | "free_shipping"
  | "editorial";

export interface TaxonomyTag {
  id: TagId;
  label: string;
  description: string;
  keywords: string[];
}

export interface SiteSnapshot {
  slug: string;
  name: string;
  url: string;
  segment: string;
  isOwn: boolean;
  status: "ok" | "error";
  error?: string;
  title?: string;
  metaDescription?: string;
  navL1?: string[];
  heroHeading?: string;
  textSample?: string;
  tags: TagId[];
  screenshots?: { hero: string; full: string };
}

export interface WeekSnapshot {
  weekOf: string;
  capturedAt: string;
  isDemoData?: boolean;
  sites: SiteSnapshot[];
}

export interface CompetitorChange {
  slug: string;
  name: string;
  isOwn: boolean;
  tagsAdded: string[];
  tagsRemoved: string[];
  heroChanged: boolean;
  previousHero?: string;
  currentHero?: string;
}

export interface PrevalenceDelta {
  tag: TagId;
  label: string;
  currentPct: number;
  previousPct: number;
  deltaPct: number;
}

export interface Opportunity {
  tag: TagId;
  label: string;
  prevalencePct: number;
  competitorCount: number;
  exampleBrands: string[];
}

export interface TrendsData {
  weekOf: string;
  previousWeekOf: string | null;
  isBaseline: boolean;
  generatedAt: string;
  opportunities: Opportunity[];
  competitorChanges: CompetitorChange[];
  prevalenceDeltas: PrevalenceDelta[];
  tagPrevalence: Record<string, { count: number; pct: number }>;
  narrative: string[];
}

export interface DataIndex {
  weeks: string[];
}
