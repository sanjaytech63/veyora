export interface FashionCollection {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  season: string;
  itemCount: number;
}

export const FASHION_COLLECTIONS: FashionCollection[] = [
  {
    slug: "festive-edit",
    title: "The Festive Edit // 2026",
    tagline: "Handcrafted Indian Couture",
    description:
      "Hand-tied Bandhani silks, regal Anarkali suits with scalloped organza dupattas, and mirror-work embellishments.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&q=85",
    season: "Festive / Wedding 2026",
    itemCount: 8,
  },
  {
    slug: "wedding-trousseau",
    title: "Wedding Trousseau & Bridal Heritage",
    tagline: "Heirloom Silks & Zardozi",
    description:
      "Regal Banarasi katan silk brocade sarees, hand-embroidered wedding lehengas, and timeless gold zari borders.",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&q=85",
    season: "Bridal Heirloom",
    itemCount: 6,
  },
  {
    slug: "everyday-mulmul",
    title: "Everyday Mulmul & Studio Tunics",
    tagline: "Pure Organic Cotton",
    description:
      "Feather-light Bagru hand-block printed straight kurtis, breathable linen tunics, and comfortable office wear.",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=85",
    season: "Everyday Wear",
    itemCount: 12,
  },
  {
    slug: "resort-linen",
    title: "Resort Linen & Loungewear",
    tagline: "Contemporary Minimalist Cuts",
    description:
      "European certified organic linen co-ords, relaxed cotton pajama sets, and modern fusion maxi dresses.",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&q=85",
    season: "Summer Capsule",
    itemCount: 7,
  },
];
