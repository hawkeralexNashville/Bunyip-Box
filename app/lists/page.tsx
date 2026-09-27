import Link from "next/link";
import { redirect } from "next/navigation";

import { ActionForm } from "@/app/action-form";
import { getCurrentUser } from "@/lib/auth/session";
import { listDashboardForUser } from "@/lib/lists/service";

import { createListAction, deleteListAction, renameListAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const dashboard = await listDashboardForUser(user.id);
  if (!dashboard) redirect("/login");

  return (
    <section className="app-page">
      <div className="page-heading">
        <div><p className="eyebrow">{dashboard.workspace.name}</p><h1>Lists</h1></div>
        <div className="summary-stat"><strong>{dashboard.uniquePageCount}</strong><span>unique Pages accessible</span></div>
      </div>

      {dashboard.isOwner ? (
        <div className="utility-card">
          <h2>Create a List</h2>
          <ActionForm action={createListAction} submitLabel="Create List">
            <input name="workspaceId" type="hidden" value={dashboard.workspace.id} />
            <label>List name<input name="name" maxLength={100} required /></label>
          </ActionForm>
        </div>
      ) : null}

      <div className="list-grid">
        {dashboard.lists.map((list) => (
          <article className="list-card" key={list.id}>
            <p className="role-badge">{list.role}</p>
            <h2><Link href={`/lists/${list.id}`}>{list.name}</Link></h2>
            <p>{list.pageCount} tracked {list.pageCount === 1 ? "Page" : "Pages"}</p>
            <Link className="button button-secondary" href={`/lists/${list.id}`}>Open List</Link>
            {dashboard.isOwner ? (
              <details>
                <summary>Manage</summary>
                <ActionForm action={renameListAction} submitLabel="Rename List">
                  <input name="listId" type="hidden" value={list.id} />
                  <label>New name<input name="name" defaultValue={list.name} maxLength={100} required /></label>
                </ActionForm>
                <ActionForm action={deleteListAction} className="inline-form danger-zone" submitLabel="Delete List">
                  <input name="listId" type="hidden" value={list.id} />
                  <label>Type “{list.name}” to delete<input name="confirmation" required /></label>
                  <p>Deletion removes this List and its assignments, but not shared underlying Page records.</p>
                </ActionForm>
              </details>
            ) : null}
          </article>
        ))}
      </div>
      {!dashboard.lists.length ? <p className="empty-state">No Lists are available to you yet.</p> : null}
    </section>
  );
}
