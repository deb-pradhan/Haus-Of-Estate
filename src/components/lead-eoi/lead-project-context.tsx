"use client";

import { useEffect } from "react";
import { useLeadEoi } from "./lead-eoi-controller";
import type { LeadProjectContext } from "./types";

export function LeadProjectContextRegistration({
  project,
}: {
  project: LeadProjectContext;
}) {
  const { setPageProject } = useLeadEoi();
  const serializedProject = JSON.stringify(project);

  useEffect(() => {
    setPageProject(JSON.parse(serializedProject) as LeadProjectContext);
    return () => setPageProject(null);
  }, [serializedProject, setPageProject]);

  return null;
}
