import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entrar | PriceScout",
  description: "Acesse sua conta PriceScout e acompanhe os melhores preços.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
