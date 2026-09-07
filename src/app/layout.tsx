import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "iAsset — IT Asset Management",
  description: "Internal IT asset, room, and transfer management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-sunken text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
