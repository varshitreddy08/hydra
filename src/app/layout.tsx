import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedResponse — Emergency Resource Allocation",
  description:
    "Multi-agent AI negotiation platform for real-time emergency resource reallocation across hospital networks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}
