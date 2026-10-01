import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hola, Perú",
  description:
    "Prototipo no oficial de Crafter Research: cuéntale tu situación y te lleva al trámite correcto de gob.pe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-PE"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <div className="border-b border-border bg-surface px-4 py-2 text-center text-xs text-muted">
          Prototipo no oficial de Crafter Research. No es un sitio del Estado
          peruano. Verifica siempre en gob.pe.
        </div>
        {children}
      </body>
    </html>
  );
}
