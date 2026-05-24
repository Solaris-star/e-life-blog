"use client";

import { useState } from "react";

export function GroupJoinButton({
  groupId,
  disabled,
}: {
  groupId: string;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function joinGroup() {
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/member/groups/${groupId}/join`, {
      method: "POST",
      cache: "no-store",
    });
    const data = await response.json();

    setLoading(false);
    setMessage(response.ok ? `临时邀请码：${data.inviteCode}` : data.error || "暂时无法生成邀请码。");
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={joinGroup}
        className="mcm-button mcm-button-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "生成中" : disabled ? "当前方案不可加入" : "生成临时邀请码"}
      </button>
      {message && (
        <p className="text-sm font-bold leading-6 text-[color:var(--walnut)]">
          {message}
        </p>
      )}
    </div>
  );
}
