import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FlashcardItem } from '@/lib/api-client';

export function FlashcardWidget({ flashcards }: { flashcards: FlashcardItem[] }) {
  const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardItem | null>(null);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    setSelectedFlashcard(flashcards[0] ?? null);
    setShowBack(false);
  }, [flashcards]);

  const currentIndex = selectedFlashcard ? flashcards.findIndex((card) => card.id === selectedFlashcard.id) : -1;
  const progressPercentage = flashcards.length > 0 
    ? Math.min(100, Math.round(((currentIndex + 1) / flashcards.length) * 100))
    : 0;

  const handleRating = () => {
    const nextCard = flashcards[currentIndex + 1] ?? null;
    setSelectedFlashcard(nextCard);
    setShowBack(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Flashcards practice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <p className="text-sm text-muted-foreground">Due today: {flashcards.length}</p>
        {selectedFlashcard ? (
          <div className="rounded border p-4 bg-card shadow-sm perspective-1000">
            <div className={`relative transition-all duration-500 transform-style-3d ${showBack ? 'rotate-y-180' : ''}`}>
              <div className="min-h-[100px] flex items-center justify-center p-4 text-center break-words bg-background rounded-md border">
                <p className="text-sm font-medium">{showBack ? selectedFlashcard.back : selectedFlashcard.front}</p>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setShowBack((value) => !value)}
                className="w-full sm:w-auto"
              >
                {showBack ? 'Hide Answer' : 'Show Answer'}
              </Button>
              
              {showBack && (
                <div className="flex w-full gap-2 justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {(['easy', 'good', 'hard', 'forgot'] as const).map((rating) => (
                    <Button
                      key={rating}
                      variant="secondary"
                      size="sm"
                      onClick={handleRating}
                      className="capitalize flex-1 sm:flex-none active:scale-[0.98] transition-transform"
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Progress</span>
                <span>{currentIndex + 1} / {flashcards.length}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[150px] flex items-center justify-center rounded-md border border-dashed border-border bg-muted/20">
             <p className="text-sm text-muted-foreground text-center">
                {flashcards.length > 0 ? "You've finished all due flashcards! 🎉" : "No due flashcards. Load dashboard data first."}
             </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}