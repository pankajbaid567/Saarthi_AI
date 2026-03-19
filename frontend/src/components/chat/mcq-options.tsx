import { Button } from '@/components/ui/button';
import type { ChatQuestion } from '@/lib/chat-api';
import { cn } from '@/lib/utils';

export function MCQOptions({ question, onSelect, disabled }: { question: ChatQuestion; onSelect: (value: string) => void; disabled: boolean }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {question.options.map((option) => (
        <Button 
          key={option.key} 
          variant="outline" 
          disabled={disabled} 
          onClick={() => onSelect(option.key)} 
          className={cn(
            "justify-start transition-all duration-200 ease-out active:scale-[0.98]",
            "hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          <span className="font-semibold mr-2">{option.key}.</span> {option.text}
        </Button>
      ))}
    </div>
  );
}
