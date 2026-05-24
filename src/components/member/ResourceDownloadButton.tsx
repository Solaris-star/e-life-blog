"use client";

import { Download } from "lucide-react";

export function ResourceDownloadButton({
  resourceId,
  disabled,
}: {
  resourceId: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="mcm-button mcm-button-secondary cursor-not-allowed opacity-60"
      >
        当前方案不可下载
      </button>
    );
  }

  return (
    <a
      href={`/api/member/resources/${resourceId}/download`}
      className="mcm-button mcm-button-primary"
    >
      下载资料
      <Download className="h-4 w-4" />
    </a>
  );
}
