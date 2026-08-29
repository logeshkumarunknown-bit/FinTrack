export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 pt-1 pb-6 flex-wrap">
      <div>
        <h1 className="font-display text-[28px] leading-tight text-[var(--color-ink)]">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-[var(--color-paper)] border border-[var(--color-line)] rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    good: 'bg-[var(--color-forest-soft)] text-[var(--color-forest)]',
    risky: 'bg-[var(--color-clay-soft)] text-[var(--color-clay)]',
    warn: 'bg-[var(--color-gold-soft)] text-[var(--color-gold)]',
    neutral: 'bg-black/[0.04] text-[var(--color-ink-soft)]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${tones[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        tone === 'good' ? 'bg-[var(--color-forest)]' : tone === 'risky' ? 'bg-[var(--color-clay)]' : tone === 'warn' ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-ink-faint)]'
      }`} />
      {children}
    </span>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-[var(--color-forest)] text-white hover:bg-[var(--color-forest-deep)]',
    secondary: 'bg-transparent border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-black/[0.03]',
    ghost: 'bg-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]',
    danger: 'bg-transparent border border-[var(--color-clay)]/30 text-[var(--color-clay)] hover:bg-[var(--color-clay-soft)]',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[13.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-11 h-11 rounded-full bg-black/[0.04] flex items-center justify-center mb-4">
          <Icon size={20} className="text-[var(--color-ink-soft)]" />
        </div>
      )}
      <div className="font-medium text-[15px] text-[var(--color-ink)]">{title}</div>
      {description && <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({ label, children, hint, required }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-[13px] font-medium text-[var(--color-ink)]">
          {label}{required && ' *'}
        </span>
      )}
      {children}
      {hint && <span className="text-[11.5px] text-[var(--color-ink-faint)]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-cream-soft)] text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/30 focus:border-[var(--color-forest)] transition-colors';

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-[var(--color-paper)] border border-[var(--color-line)] rounded-2xl w-full ${width} max-h-[88vh] overflow-y-auto p-6 shadow-2xl animate-in`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-semibold text-[var(--color-ink)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-6 border-b border-[var(--color-line)]">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`relative py-3 text-[14px] transition-colors ${
            active === t.value ? 'text-[var(--color-forest)] font-medium' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
          }`}
        >
          {t.label}
          {active === t.value && (
            <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[var(--color-forest)] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

export function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
        active ? 'bg-[var(--color-ink)] text-[var(--color-cream)]' : 'bg-black/[0.04] text-[var(--color-ink-soft)] hover:bg-black/[0.07]'
      }`}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, max = 100, className = '', barClassName = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`h-2 rounded-full bg-black/[0.06] overflow-hidden ${className}`}>
      <div className={`h-full rounded-full bg-[var(--color-forest)] ${barClassName}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
