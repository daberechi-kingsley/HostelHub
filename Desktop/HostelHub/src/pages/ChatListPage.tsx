/**
 * /chat — lists all threads for the signed-in user, newest first.
 * If not signed in, shows an auth prompt (anonymous users have no threads).
 */
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useChatList } from '@/features/chat/useChatList';
import { useUser } from '@/hooks/useUser';
import { useLazyAuth } from '@/hooks/useLazyAuth';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ChatListPage() {
  const { isSignedIn, loading: authLoading } = useUser();
  const { require } = useLazyAuth();
  const { threads, loading } = useChatList();

  if (authLoading) return <PageSpinner />;

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          title="Sign in to see your chats"
          description="Once you contact a landlord or agent about a listing, your conversations appear here."
          action={
            <Button variant="primary" onClick={() => require('contact')}>
              Sign in to chat
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12 pt-4 sm:pt-6">
      <h1 className="font-heading text-xl font-bold">Messages</h1>

      {loading ? (
        <PageSpinner />
      ) : threads.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            title="No conversations yet"
            description="Tap Contact on any listing to start chatting with the landlord or our concierge."
            action={
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Browse listings
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-card border border-border bg-bg-card">
          {threads.map(({ chatId, meta }) => (
            <li key={chatId}>
              <Link
                to={`/chat/${chatId}`}
                className="flex items-start gap-4 px-4 py-4 hover:bg-bg-hover"
              >
                {/* Avatar placeholder */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-semibold text-text">{meta.listingTitle}</p>
                    {meta.lastMessageTs > 0 && (
                      <span className="shrink-0 text-xs text-text-muted">
                        {formatRelativeTime(meta.lastMessageTs)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-text-muted">
                    {meta.lastMessage || 'No messages yet'}
                  </p>
                  {meta.mode === 'concierge' && (
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Concierge
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
