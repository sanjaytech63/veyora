import * as React from "react";
import { Metadata } from "next";
import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "Search Catalog | Veyora Atelier",
  description: "Search precision hardware, acoustic listening gear, and desk instruments crafted by Veyora.",
};

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
        </div>
      }
    >
      <SearchClient />
    </React.Suspense>
  );
}
