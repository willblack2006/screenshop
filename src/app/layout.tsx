import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "screenshop — Screenshot to Shopify Storefront",
  description:
    "Turn any ecommerce screenshot into a production-ready Shopify storefront using Claude AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
