"use client";

import { createBrowserClient } from "@supabase/ssr";
import { readBrowserAuthRuntimeConfig } from "../config";

export function createSupabaseBrowserAuthClient() {
  const config = readBrowserAuthRuntimeConfig();

  if (config.status === "disabled") {
    return null;
  }

  return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
}
