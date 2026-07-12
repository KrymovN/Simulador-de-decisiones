"use server";

import { redirect } from "next/navigation";
import { saveSimulationDraftResumeSurface } from "./simulation-draft-resume-surface";

export async function saveSimulationDraftResumeAction(formData: FormData): Promise<void> {
  const draftId = formData.get("draftId");
  const draftText = formData.get("draftText");
  const id = typeof draftId === "string" ? draftId : "";
  const result = await saveSimulationDraftResumeSurface({
    draftId: id,
    draftText: typeof draftText === "string" ? draftText : "",
  });
  if (result.status === "saved" || result.status === "unchanged") {
    redirect(`/dashboard/drafts/${encodeURIComponent(id)}?save=${result.status}`);
  }
  redirect(`/dashboard/drafts/${encodeURIComponent(id)}?save=error`);
}
