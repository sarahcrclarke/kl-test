import type { TagId } from "./types";

// Mirrors scraper/src/taxonomy.json (id + label) plus a fixed display color per
// tag, assigned in order from the dataviz categorical palette. Keep tag ids in
// sync with scraper/src/taxonomy.json if the taxonomy changes.
export const TAG_META: Record<TagId, { label: string; color: string }> = {
  promo: { label: "Sale / Promo", color: "#e34948" },
  new_in: { label: "New-In", color: "#2a78d6" },
  bestsellers: { label: "Bestsellers", color: "#eda100" },
  gifting: { label: "Gifting", color: "#e87ba4" },
  personalisation: { label: "Personalisation", color: "#4a3aa7" },
  social_proof: { label: "Social Proof", color: "#1baf7a" },
  sustainability: { label: "Sustainability", color: "#008300" },
  loyalty: { label: "Loyalty / Rewards", color: "#eb6834" },
  free_shipping: { label: "Free Shipping", color: "#898781" },
  editorial: { label: "Editorial / Storytelling", color: "#8a7a5c" },
};

export const TAG_ORDER: TagId[] = [
  "promo",
  "new_in",
  "bestsellers",
  "gifting",
  "personalisation",
  "social_proof",
  "sustainability",
  "loyalty",
  "free_shipping",
  "editorial",
];

export const SEGMENT_LABELS: Record<string, string> = {
  own: "Katie Loxton",
  "bags-leather": "Bags & Leather Goods",
  "jewellery-accessories": "Jewellery & Accessories",
  "gifting-lifestyle": "Gifting & Lifestyle",
  "luxury-fashion": "Luxury Fashion House",
  "contemporary-fashion": "High Street & Contemporary",
};
