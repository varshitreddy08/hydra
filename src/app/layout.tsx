import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedNegotiate — Emergency Resource Allocation",
  description:
    "Multi-agent negotiation platform for real-time hospital emergency resource reallocation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
