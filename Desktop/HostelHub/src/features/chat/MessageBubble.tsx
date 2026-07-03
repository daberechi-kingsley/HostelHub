import { clsx } from 'clsx';
import type { ChatMessage } from '@/types/chat';

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  /** Show timestamp under this bubble (usually last in a run). */
  showTime?: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageBubble({ message, isOwn, showTime }: Props) {
  return (
    <div className={clsx('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isOwn
            ? 'rounded-br-sm bg-primary text-white'
            : 'rounded-bl-sm border border-border bg-bg-card text-text',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        {showTime && (
          <p
            className={clsx(
              'mt-1 text-right text-xs',
              isOwn ? 'text-primary-200' : 'text-text-subtle',
            )}
          >
            {formatTime(message.ts)}
          </p>
        )}
      </div>
    </div>
  );
}
