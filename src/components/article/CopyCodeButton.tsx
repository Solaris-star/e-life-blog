'use client';

import { useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * 代码块右上角的一键复制按钮。
 * 保留 .copy-btn 类名:globals.css 的定位样式与 ContentProtection 的
 * 可点击白名单都依赖它。
 */
export function CopyCodeButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [state, setState] = useState<CopyState>('idle');

  const showResult = (next: CopyState) => {
    setState(next);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState('idle'), 1500);
  };

  const handleCopy = async () => {
    const pre = buttonRef.current
      ?.closest('.code-block-wrapper')
      ?.querySelector('pre');
    const text = pre?.textContent ?? '';
    if (!text) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      showResult('copied');
    } catch {
      try {
        fallbackCopy(text);
        showResult('copied');
      } catch {
        showResult('failed');
      }
    }
  };

  const Icon = state === 'copied' ? Check : state === 'failed' ? X : Copy;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleCopy}
      className={state === 'copied' ? 'copy-btn copied' : 'copy-btn'}
      aria-label={state === 'copied' ? '已复制' : '复制代码'}
      title="复制内容"
    >
      <Icon
        className="h-4 w-4"
        style={
          state === 'copied'
            ? { color: '#4caf50' }
            : state === 'failed'
              ? { color: '#ff5252' }
              : undefined
        }
      />
    </button>
  );
}

function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}
