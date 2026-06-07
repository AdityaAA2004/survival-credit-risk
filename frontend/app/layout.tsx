import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Survival Credit Risk",
  description: "An underwriting workbench for time-to-default prediction on LendingClub loans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
