import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Security Code",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function VerifyOtpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
