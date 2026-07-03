/**
 * Full chat thread UI.
 *
 * Layout: header + scrollable messages area + text input.
 * Fills the available viewport minus the top nav (and bottom nav on mobile).
 */
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { clsx } from 'clsx';
import { useChat } from './useChat';
import MessageBubble from './MessageBubble';
import type { ChatMeta } from '@/types/chat';
import type { AppUser } from '@/types/user';

interface Props {
  chatId: string;
  meta: ChatMeta;
  currentUser: AppUser;
}

export default function ChatThread({ chatId, meta, currentUser }: Props) {
  const otherUid =
    Object.keys(meta.participants).find((uid) => uid !== currentUser.uid) ?? '';

  const { messages, otherTyping, sendMessage, notifyTyping, sending } = useChat(
    chatId,
    otherUid,
  );

  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages or typing indicator change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, otherTyping]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    try {
      await sendMessage(text);
      // Only clear after a confirmed write — preserves the draft if the send fails
      setDraft('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch {
      // sendMessage already logs the error; draft stays intact so the user can retry
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    notifyTyping();
    // Auto-grow the textarea up to 5 lines
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    /*
     * Height: subtract TopNav (~56px) + BottomNav (~48px) on mobile.
     * On sm+ (desktop), BottomNav is hidden so only subtract TopNav.
     */
    <div className="flex h-[calc(100dvh-104px)] flex-col sm:h-[calc(100dvh-56px)]">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-bg-card px-4 py-3">
        <Link
          to="/chat"
          className="shrink-0 rounded-full p-1 text-text-muted hover:bg-bg-hover hover:text-text"
          aria-label="Back to chats"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight text-text">
            {meta.listingTitle}
          </p>
          <Link
            to={`/listing/${meta.listingId}`}
            className="text-xs text-primary hover:underline"
          >
            View listing →
          </Link>
        </div>

        {meta.mode === 'concierge' && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Concierge
          </span>
        )}
      </div>

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !otherTyping ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-semibold text-text-muted">No messages yet</p>
            <p className="max-w-xs text-xs text-text-subtle">
              Say hi! Ask about availability, viewing times, or anything about{' '}
              <span className="font-medium">{meta.listingTitle}</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {messages.map((msg, i) => {
              const isOwn = msg.senderId === currentUser.uid;
              // Show time when it's the last in a run (next msg is different sender or last msg)
              const showTime =
                i === messages.length - 1 || messages[i + 1]?.senderId !== msg.senderId;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                  showTime={showTime}
                />
              );
            })}

            {/* Animated typing indicator */}
            {otherTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-bg-card px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-end gap-2 border-t border-border bg-bg-card px-4 py-3"
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={handleTextareaChange}
          onKeyDown={(e) => {
            // Send on Enter (without Shift for newline)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e as unknown as FormEvent);
            }
          }}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          style={{ overflowY: 'auto' }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-label="Send message"
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
            draft.trim() && !sending
              ? 'bg-primary text-white hover:bg-primary-700'
              : 'cursor-not-allowed bg-bg-hover text-text-subtle',
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
