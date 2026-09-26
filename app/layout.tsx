import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { product } from "./config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: product.name, template: `%s | ${product.name}` },
  description: product.description,
};

function Footer() {
  return (
    <footer className="site-footer">
      <nav aria-label="Legal">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/data-deletion">Data deletion</Link>
      </nav>
      <p>
        © {new Date().getUTCFullYear()} {product.legalOwner}. {product.name} is a
        product of {product.legalOwner}.
      </p>
    </footer>
  );
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/" aria-label={`${product.name} home`}>
            <span className="brand-mark" aria-hidden="true">B</span>
            <span>{product.name}</span>
          </Link>
          <span className="stage-pill">Foundation</span>
        </header>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

