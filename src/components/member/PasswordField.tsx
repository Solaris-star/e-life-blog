"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordFieldProps {
  id: string;
  name: string;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
  className?: string;
}

export function PasswordField({
  id,
  name,
  autoComplete,
  minLength,
  required = true,
  className = "",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-2">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className={`min-h-12 w-full rounded-[2px] border-2 border-[color:var(--line)] bg-[color:var(--surface)] px-4 pr-12 font-bold outline-none ${className}`}
      />
      <button
        type="button"
        aria-label={visible ? "隐藏密码" : "显示密码"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[2px] text-[color:var(--walnut)] transition-colors hover:text-[color:var(--foreground)]"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
