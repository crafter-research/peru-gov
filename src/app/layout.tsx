import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Hola, Perú",
  description:
    "Prototipo no oficial de Crafter Research: cuéntale tu situación y te lleva al trámite correcto de gob.pe.",
};

export const viewport: Viewport = {
  themeColor: "#121a14",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-PE"
      className={`${inter.variable} ${fraunces.variable} h-full`}
    >
      <body className="flex min-h-dvh flex-col font-sans">
        {children}
        <footer className="px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 text-center text-[10px] text-white/45 sm:px-6">
          Foto: Martin St-Amant,{" "}
          <a
            className="underline underline-offset-2 hover:text-white/70"
            href="https://commons.wikimedia.org/wiki/File:80_-_Machu_Picchu_-_Juin_2009_-_edit.2.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Wikimedia Commons
          </a>
          ,{" "}
          <a
            className="underline underline-offset-2 hover:text-white/70"
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 3.0
          </a>
          . Verifica siempre en gob.pe.
        </footer>
      </body>
    </html>
  );
}
