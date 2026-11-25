import "next/cache";

declare module "next/cache" {
  export function cacheLife(
    profile: "taxonomy" | "lookbook" | "garment" | "showcase" | (string & {})
  ): void;
}
