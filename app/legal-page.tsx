import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({ eyebrow, title, intro, children }: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="legal-page">
      <Link className="back-link" href="/">← Back to Bunyip Box</Link>
      <header><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="legal-intro">{intro}</div><p className="updated">Effective September 26, 2026</p></header>
      <div className="legal-content">{children}</div>
    </article>
  );
}

