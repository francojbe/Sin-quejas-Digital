"use client";

import { useEffect } from "react";
import { initNativePlugins } from "@/lib/capacitor-init";

export function CapacitorManager() {
  useEffect(() => {
    initNativePlugins();
  }, []);

  return null;
}
