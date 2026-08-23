import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriceScout Admin",
  description: "Administre produtos, lojas e observações de preço do PriceScout.",
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
