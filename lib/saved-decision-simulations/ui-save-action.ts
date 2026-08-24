"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveSavedSimulationSurface,
  deleteSavedSimulationSurface,
  saveCompletedSimulationSurface,
} from "./product-surface";
import type { PersistableSimulationResponse } from "../persistence-runtime";

export async function saveCompletedSimulationFromUi(input: {
  simulation: PersistableSimulationResponse;
}) {
  const result = await saveCompletedSimulationSurface({
    simulation: input.simulation,
  });

  if (result.status === "saved") {
    revalidatePath("/dashboard/simulations");
    revalidatePath(result.detailHref);
  }

  return result;
}

export async function archiveSavedSimulationFromDashboard(formData: FormData): Promise<void> {
  const recordId = formData.get("recordId");
  const result = await archiveSavedSimulationSurface({
    recordId: typeof recordId === "string" ? recordId : "",
  });

  if (result.status === "archived") {
    revalidatePath("/dashboard/simulations");
    redirect(result.historyHref);
  }
}

export async function deleteSavedSimulationFromDashboard(formData: FormData): Promise<void> {
  const recordId = formData.get("recordId");
  const result = await deleteSavedSimulationSurface({
    recordId: typeof recordId === "string" ? recordId : "",
  });

  if (result.status === "deleted" || result.status === "already_absent") {
    revalidatePath("/dashboard/simulations");
    redirect(result.historyHref);
  }
}
