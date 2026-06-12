import "server-only";

import { appendStoredAccessLog, getStoredAccessLogs } from "./member-store";

export type AccessAction = "visit_member" | "view_post" | "search" | "view_resource" | "download" | "join_group";

export interface AccessLogEntry {
  action: AccessAction;
  userId: string;
  targetId?: string;
  createdAt: string;
}

export async function logMemberAccess(entry: Omit<AccessLogEntry, "createdAt">) {
  await appendStoredAccessLog({
    ...entry,
    createdAt: new Date().toISOString(),
  });
}

export async function getAccessLogs(): Promise<AccessLogEntry[]> {
  return getStoredAccessLogs();
}
