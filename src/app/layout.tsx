import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: "LHP — Digital Staff ID",
    template: "%s · LHP",
  },
  description:
    "Secure digital staff identity and public QR verification for Lion Hospitality Partners (LHP).",
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  themeColor: "#8a6420",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
