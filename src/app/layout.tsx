import type { Metadata, Viewport } from "next";
import { Quattrocento, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const serif = Quattrocento({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

const sans = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  // 600/700 are loaded because the UI leans on `font-semibold` and `font-bold`
  // throughout; without them the browser synthesises faux bold.
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
