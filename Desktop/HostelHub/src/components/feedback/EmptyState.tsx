import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-text-subtle">{icon}</div> : null}
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-xs text-sm text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
