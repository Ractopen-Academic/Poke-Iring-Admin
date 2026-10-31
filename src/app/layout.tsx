import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poke-Iring Admin Portal",
  description: "Management and administration portal for Poke-Iring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-neutral-950 text-neutral-100 antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
