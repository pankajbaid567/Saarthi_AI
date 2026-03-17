import { Button } from '@/components/ui/button';
import type { ChatQuestion } from '@/lib/chat-api';

export function MCQOptions({ question, onSelect, disabled }: { question: ChatQuestion; onSelect: (value: string) => void; disabled: boolean }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {question.options.map((option) => (
        <Button key={option.key} variant="outline" disabled={disabled} onClick={() => onSelect(option.key)} className="justify-start">
          {option.key}. {option.text}
        </Button>
      ))}
    </div>
  );
}
