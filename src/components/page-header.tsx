import type { ReactNode } from 'react';

import { WrenchIcon } from '@/components/icons';

export function PageHeader({
  title,
  description,
  aside,
}: {
  title: ReactNode;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <header className="page-head-row">
      <div style={{ minWidth: 0 }}>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">{description}</p>
      </div>
      {aside}
    </header>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <p className="empty">{children}</p>
    </div>
  );
}

/** Ekran zakładki, która jest w nawigacji, ale nie ma jeszcze implementacji. */
export function WorkInProgress({ title, body }: { title: string; body: string }) {
  return (
    <div className="wip">
      <span className="wip-mark">
        <WrenchIcon />
      </span>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
