import type { Metadata } from "next";
import "../styles/globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "النسخة - منصة الإبداع السينمائي",
  description: " اهداء ليسري نصر الله",
};

// Enable ISR with 24-hour revalidation (86400 seconds)
export const revalidate = 86400;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="media-src 'self' https://cdn.pixabay.com https://*.pixabay.com blob: data:;"
        />
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900;1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
