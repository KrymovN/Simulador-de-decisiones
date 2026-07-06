"use server";

import { revalidatePath } from "next/cache";
import { saveCompletedSimulationSurface } from "./product-surface";
import type { SimulationResponse } from "../simulationEngine";

export async function saveCompletedSimulationFromUi(input: {
  simulation: SimulationResponse;
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
