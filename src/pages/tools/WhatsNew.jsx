import { PageHeader, Card } from '../../components/UI';

const updates = [
  { date: 'Aug 2026', title: 'Allocation rebalancing insights', text: 'See target vs actual allocation gaps and get suggested rebalancing actions.' },
  { date: 'Jul 2026', title: 'Financial health score', text: 'Essentials now scores your emergency fund, savings rate, insurance cover, and debt ratio out of 10.' },
  { date: 'Jun 2026', title: 'Goals tracking', text: 'Set target amounts and dates, and track progress against your net worth automatically.' },
  { date: 'May 2026', title: 'Budgets', text: 'Plan a monthly budget by category, with auto-suggestions based on your income.' },
];

export default function WhatsNew() {
  return (
    <div>
      <PageHeader title="What's New" subtitle="Recent updates to FinBoom" />
      <div className="flex flex-col gap-3">
        {updates.map((u, i) => (
          <Card key={i} className="p-5">
            <div className="text-[11px] font-semibold text-[var(--color-ink-faint)] tracking-wide">{u.date.toUpperCase()}</div>
            <div className="text-[14.5px] font-medium text-[var(--color-ink)] mt-1">{u.title}</div>
            <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1">{u.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
