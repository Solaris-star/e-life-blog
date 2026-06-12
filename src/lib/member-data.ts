import "server-only";

import path from "path";
import type { MemberPlan, MemberUser } from "./member-auth";

export type MemberResourceType = "资料库" | "扩展 Daily" | "项目资料";

export interface MemberResource {
  id: string;
  title: string;
  summary: string;
  type: MemberResourceType;
  requiredPlan: MemberPlan;
  filePath: string;
  updatedAt: string;
}

export interface MemberGroup {
  id: string;
  title: string;
  summary: string;
  requiredPlan: MemberPlan;
}

const privateRoot = path.join(process.cwd(), "member-private", "resources");

export const planRank: Record<MemberPlan, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  lifetime: 3,
};

export const memberResources: MemberResource[] = [
  {
    id: "ai-field-notes",
    title: "AI 工具观察手册",
    summary: "记录 AI 工具选择、试用和日常使用场景的会员资料。",
    type: "资料库",
    requiredPlan: "basic",
    filePath: path.join(privateRoot, "ai-field-notes.md"),
    updatedAt: "2026-05-20",
  },
  {
    id: "project-starter",
    title: "个人项目启动清单",
    summary: "从想法到发布的项目检查清单，适合准备做小工具时使用。",
    type: "项目资料",
    requiredPlan: "pro",
    filePath: path.join(privateRoot, "project-starter.md"),
    updatedAt: "2026-05-21",
  },
];

export const memberGroups: MemberGroup[] = [
  {
    id: "monthly-salon",
    title: "月度读写小组",
    summary: "围绕写作、工具和项目进展的小范围交流。",
    requiredPlan: "basic",
  },
  {
    id: "project-lab",
    title: "项目实验室",
    summary: "给正在做个人项目的订阅者使用的交流入口。",
    requiredPlan: "pro",
  },
];

export function canAccessResource(user: MemberUser, resource: Pick<MemberResource | MemberGroup, "requiredPlan">) {
  return user.subscription.status === "active" && planRank[user.plan] >= planRank[resource.requiredPlan];
}

export function getMemberResourceById(id: string) {
  return memberResources.find((resource) => resource.id === id);
}

export function getMemberGroupById(id: string) {
  return memberGroups.find((group) => group.id === id);
}

export function getVisibleResources(user: MemberUser) {
  return memberResources.map((resource) => ({
    ...resource,
    canAccess: canAccessResource(user, resource),
    filePath: undefined,
  }));
}
