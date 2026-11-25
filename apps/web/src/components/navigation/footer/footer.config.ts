export type FooterLink = {
  label: string;
  href: string;
};

export type FooterLinkColumn = {
  id: "shop" | "customer" | "account";
  title: string;
  links: FooterLink[];
};

export const footerLinkColumns: FooterLinkColumn[] = [
  {
    id: "shop",
    title: "Shop",
    links: [
      { label: "Shop All", href: "/shop" },
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "Collections", href: "/collections" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    id: "customer",
    title: "Customer Care",
    links: [
      { label: "Track an Order", href: "/tracking" },
      { label: "My Orders", href: "/orders" },
      { label: "Shopping Bag", href: "/cart" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    id: "account",
    title: "Your Veyora",
    links: [
      { label: "Account", href: "/account" },
      { label: "Profile", href: "/profile" },
      { label: "Checkout", href: "/checkout" },
    ],
  },
];
