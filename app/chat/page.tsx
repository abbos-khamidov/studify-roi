import { AIChat } from "@/components/dashboard/AIChat";

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20 md:pb-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">AI-аналитик</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Полноэкранный чат на телефоне. На компьютере чат также в левом меню.
        </p>
      </div>
      <AIChat variant="page" />
    </div>
  );
}
