import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadTrack CRM",
  description: "Ad lead tracking for agencies — capture, route, and close every Meta and Google Ads lead.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,600,700,900&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
