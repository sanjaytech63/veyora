import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("next/font/google", () => ({
  Poppins: () => ({
    variable: "--font-poppins",
    className: "font-poppins",
    style: { fontFamily: "Poppins" },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/products/chanderi-silk-kurti-set-organza-dupatta",
  useSearchParams: () => new URLSearchParams(),
}));
