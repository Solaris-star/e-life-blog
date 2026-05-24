import "server-only";

import fs from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { MemberPlan, MemberUser, SubscriptionStatus } from "./member-auth";
import type { AccessLogEntry } from "./member-access-log";

export type MemberRole = "member" | "admin";

export interface StoredMemberUser extends MemberUser {
  role: MemberRole;
  createdAt: string;
}

const dataDir = path.join(process.cwd(), "member-private", "data");
const usersPath = path.join(dataDir, "users.json");
const logsPath = path.join(dataDir, "access-logs.json");

async function ensureDataFiles() {
  await mkdir(dataDir, { recursive: true });
  if (!fs.existsSync(usersPath)) {
    await writeFile(usersPath, "[]", "utf-8");
  }
  if (!fs.existsSync(logsPath)) {
    await writeFile(logsPath, "[]", "utf-8");
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataFiles();
  const raw = await readFile(filePath, "utf-8");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw) as T;
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await ensureDataFiles();
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export async function getStoredUsers() {
  return readJsonFile<StoredMemberUser[]>(usersPath, []);
}

export async function getStoredUserById(id: string) {
  const users = await getStoredUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function getStoredUserByEmail(email: string) {
  const users = await getStoredUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createStoredUser(input: {
  name: string;
  email: string;
  plan?: MemberPlan;
  status?: SubscriptionStatus;
}) {
  const users = await getStoredUsers();
  const existing = users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) return existing;

  const now = new Date().toISOString();
  const user: StoredMemberUser = {
    id: `user_${Date.now().toString(36)}`,
    name: input.name,
    email: input.email,
    plan: input.plan ?? "free",
    role: "member",
    createdAt: now,
    subscription: {
      status: input.status ?? "inactive",
    },
  };

  await writeJsonFile(usersPath, [...users, user]);
  return user;
}

export async function getStoredAccessLogs() {
  return readJsonFile<AccessLogEntry[]>(logsPath, []);
}

export async function appendStoredAccessLog(entry: AccessLogEntry) {
  const logs = await getStoredAccessLogs();
  await writeJsonFile(logsPath, [...logs, entry]);
}
