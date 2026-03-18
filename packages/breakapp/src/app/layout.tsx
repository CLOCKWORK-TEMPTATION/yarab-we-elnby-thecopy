import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Break Break - Film Production Management",
  description: "Modern film production management system with QR-based authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
