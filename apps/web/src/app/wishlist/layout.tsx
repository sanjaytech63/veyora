import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
