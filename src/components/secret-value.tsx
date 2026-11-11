'use client';

import { useState } from 'react';

import { useI18n } from '@/i18n/client';

/** Wartość zamaskowana kropkami z przyciskiem „Pokaż" — na PESEL i podobne. */
export function SecretValue({ value }: { value: string }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  if (!value) return <span style={{ color: 'var(--muted)' }}>—</span>;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>
        {visible ? value : '•'.repeat(value.length)}
      </span>
      <button type="button" className="ghost-btn" onClick={() => setVisible((v) => !v)}>
        {visible ? t.common.hide : t.common.show}
      </button>
    </span>
  );
}
