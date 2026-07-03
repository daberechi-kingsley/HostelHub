/**
 * /chat/:chatId — renders a live chat thread.
 *
 * Guards:
 *   • Redirects to / if not signed in after auth loads.
 *   • Shows 404 EmptyState if the chatId doesn't match any RTDB record.
 *   • Subscribes to meta live so the thread stays in sync with new messages.
 */
import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { subscribeChatMeta } from '@/features/chat/api';
import ChatThread from '@/features/chat/ChatThread';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';
import type { ChatMeta } from '@/types/chat';

/** Three-state for the meta: undefined = loading, null = not found, ChatMeta = loaded. */
type MetaState = ChatMeta | null | undefined;

export default function ChatThreadPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { firebaseUser, appUser, loading: authLoading } = useUser();

  const [meta, setMeta] = useState<MetaState>(undefined);

  useEffect(() => {
    if (!chatId) {
      setMeta(null);
      return;
    }
    return subscribeChatMeta(chatId, setMeta);
  }, [chatId]);

  // Auth check first — an unauthenticated user's RTDB subscription will never
  // resolve (rules deny access), so we'd spin forever if we waited on meta.
  if (authLoading) return <PageSpinner />;
  if (!firebaseUser || !appUser) return <Navigate to="/" replace />;

  if (meta === undefined) return <PageSpinner />;

  if (!chatId || meta === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          title="Chat not found"
          description="This conversation doesn't exist or you may not have access to it."
        />
      </div>
    );
  }

  return <ChatThread chatId={chatId} meta={meta} currentUser={appUser} />;
}
