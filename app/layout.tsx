import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import LeadershipShell from "@/components/leadership-shell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cockpit de Gestão",
  description: "Gestão qualitativa, frentes, pessoas, decisões e rituais",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <LeadershipShell>{children}</LeadershipShell>
      </body>
    </html>
  );
}
