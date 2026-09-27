"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormActionState } from "@/app/action-form";
import { getCurrentUser } from "@/lib/auth/session";
import { createList, deleteList, renameList } from "@/lib/lists/service";

async function actorId() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.id;
}

function failure(error: unknown): FormActionState {
  return { error: error instanceof Error ? error.message : "The List could not be updated." };
}

export async function createListAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  try {
    await createList(await actorId(), String(formData.get("workspaceId") ?? ""), String(formData.get("name") ?? ""));
    revalidatePath("/lists");
    return { error: null };
  } catch (error) { return failure(error); }
}

export async function renameListAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  try {
    const listId = String(formData.get("listId") ?? "");
    await renameList(await actorId(), listId, String(formData.get("name") ?? ""));
    revalidatePath("/lists");
    revalidatePath(`/lists/${listId}`);
    return { error: null };
  } catch (error) { return failure(error); }
}

export async function deleteListAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  try {
    await deleteList(
      await actorId(),
      String(formData.get("listId") ?? ""),
      String(formData.get("confirmation") ?? ""),
    );
    revalidatePath("/lists");
  } catch (error) { return failure(error); }
  redirect("/lists");
}
