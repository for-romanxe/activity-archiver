"use client";

import { useState } from "react";

export function InviteCopy({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn-ghost !py-1.5 !px-3 text-xs"
      onClick={async () => {
        const url = `${window.location.origin}/join/${token}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "복사됨 ✓" : "초대 링크 복사"}
    </button>
  );
}
