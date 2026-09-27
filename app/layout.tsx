import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { product } from "./config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: product.name, template: `%s | ${product.name}` },
  description: product.description,
  icons: { icon: "/brand/bunyip-box-mark.png", apple: "/brand/bunyip-box-mark.png" },
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
            <Image className="brand-image" src="/brand/bunyip-box-mark.png" alt="" width={40} height={40} priority />
            <span>{product.name}</span>
          </Link>
          <nav className="app-nav" aria-label="Application"><Link href="/lists">Lists</Link><Link href="/team">Team</Link><Link href="/account">Account</Link></nav>
        </header>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
