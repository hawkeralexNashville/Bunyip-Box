import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { listDetailForUser } from "@/lib/lists/service";

export const dynamic = "force-dynamic";

export default async function ListPage({ params }: { params: Promise<{ listId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { listId } = await params;
  const list = await listDetailForUser(user.id, listId);
  if (!list) notFound();

  return (
    <section className="app-page">
      <Link className="back-link" href="/lists">← All Lists</Link>
      <div className="page-heading">
        <div><p className="eyebrow">{list.role} access</p><h1>{list.name}</h1></div>
        <span className="status-pill">Meta not connected</span>
      </div>
      <div className="utility-card">
        <div className="card-heading"><div><h2>Facebook Pages</h2><p>Pages added here will become the sources tracked by this List.</p></div>
          {list.canManagePages ? <button className="button button-primary" disabled title="Available after Meta connection">Add Page to Track</button> : null}
        </div>
        {list.pages.length ? (
          <ul className="page-list">{list.pages.map(({ facebookPage }) => <li key={facebookPage.id}><strong>{facebookPage.name}</strong><span>{facebookPage.facebookPageId}</span></li>)}</ul>
        ) : <p className="empty-state">No Pages are connected. Page lookup will be enabled after the Meta capability proof of concept.</p>}
      </div>
    </section>
  );
}
