import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LayoutWrapper } from "@/components/layout-wrapper";

export const metadata: Metadata = {
  title: "iAgrin Admin - AI Agriculture Admin Dashboard",
  description: "Next-generation futuristic AI agriculture administration, analytics, crop diagnostics, and satellite monitoring dashboard.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
