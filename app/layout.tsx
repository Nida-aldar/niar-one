import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIAR One — One Platform. Endless Possibilities.",
  description:
    "Discover useful AI tools, study smarter, and make sense of your data with NIAR One.",
  applicationName: "NIAR One",
  icons: { icon: "/brand-mark.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body><SiteHeader />{children}<SiteFooter /></body>
    </html>
  );
}
