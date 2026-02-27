import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HYPOXIA | L'Écho Numérique",
  description:
    "Une installation d'art interactif qui visualise l'impact environnemental de l'IA générative. Chaque mot tapé consume de l'énergie — regardez l'écosystème mourir en temps réel.",
  keywords: ["DevArt", "art numérique", "IA", "environnement", "three.js", "interactive art", "2026"],
  authors: [{ name: "Nebula DevArt Team" }],
  openGraph: {
    title: "HYPOXIA | L'Écho Numérique",
    description:
      "Une installation d'art interactif qui visualise l'impact environnemental de l'IA générative.",
    type: "website",
    locale: "fr_FR",
    siteName: "HYPOXIA",
  },
  twitter: {
    card: "summary_large_image",
    title: "HYPOXIA | L'Écho Numérique",
    description:
      "Une installation d'art interactif qui visualise l'impact environnemental de l'IA générative.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
