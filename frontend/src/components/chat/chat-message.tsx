import type { ChatMessage } from '@/lib/chat-api';
import { cn } from '@/lib/utils';

export function ChatMessageCard({ message }: { message: ChatMessage }) {
  const isUser = message.actor === 'user';

  return (
    <div className={cn('max-w-3xl rounded-lg border p-3 text-sm', isUser ? 'ml-auto bg-primary text-primary-foreground' : 'bg-card')}>
      <p className="whitespace-pre-wrap">{message.text}</p>
      {message.question ? (
        <div className="mt-3 rounded border border-border/70 bg-background/60 p-2 text-xs text-muted-foreground">
          Difficulty: {message.question.difficulty} · Topic: {message.question.topic}
        </div>
      ) : null}
    </div>
  );
}
