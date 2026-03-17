import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const shortcuts = [
  { key: '⌘/Ctrl + K', action: 'Open command palette' },
  { key: 'Focus button', action: 'Toggle focus mode (hide navigation)' },
  { key: 'A / A+', action: 'Adjust global font size' },
];

export default function ShortcutsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyboard shortcuts guide</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.key} className="flex items-center justify-between rounded border border-border p-2">
              <span>{shortcut.action}</span>
              <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{shortcut.key}</kbd>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
