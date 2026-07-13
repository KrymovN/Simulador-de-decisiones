"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteOwnedSimulationDraft } from "./simulation-draft-deletion-execution";

const CONFIRM_IRREVERSIBLE_DRAFT_DELETION = "confirm_irreversible_draft_deletion";

export async function deleteSimulationDraftFromDashboard(formData: FormData): Promise<void> {
  const draftIdValue = formData.get("draftId");
  const confirmation = formData.get("confirmDeletion");
  const draftId = typeof draftIdValue === "string" ? draftIdValue : "";
  const destination = `/dashboard/drafts/${encodeURIComponent(draftId)}`;

  if (confirmation !== CONFIRM_IRREVERSIBLE_DRAFT_DELETION) {
    redirect(`${destination}?delete=confirmation_required`);
  }

  let result: Awaited<ReturnType<typeof deleteOwnedSimulationDraft>>;
  try {
    result = await deleteOwnedSimulationDraft({ draftId });
  } catch {
    redirect(`${destination}?delete=error`);
  }

  if (result.status === "deleted" || result.status === "already_absent") {
    revalidatePath(destination);
    revalidatePath("/dashboard/privacy/export");
    revalidatePath("/dashboard/privacy/deletion");
    revalidatePath("/dashboard/privacy/retention");
    redirect("/dashboard/privacy?draftDeletion=completed");
  }

  if (result.status === "blocked" && result.reason === "delete_restricted") {
    redirect(`${destination}?delete=restricted`);
  }

  redirect(`${destination}?delete=error`);
}
