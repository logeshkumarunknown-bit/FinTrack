export default function OnboardingShell({ step, total = 4, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)] px-4 py-10">
      <div className="w-full max-w-[420px] animate-in">
        <div className="text-center mb-2">
          <h1 className="font-display text-[26px] text-[var(--color-ink)]">FinBoom</h1>
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-[var(--color-forest)]' : i < step ? 'w-1.5 bg-[var(--color-forest)]' : 'w-1.5 bg-[var(--color-line)]'
              }`}
            />
          ))}
        </div>
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-2xl p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
