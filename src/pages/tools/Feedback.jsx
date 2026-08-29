import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { PageHeader, Card, Field, inputClass, Button } from '../../components/UI';

export default function Feedback() {
  const [sent, setSent] = useState(false);
  const [text, setText] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSent(true);
  }

  return (
    <div>
      <PageHeader title="Feedback" subtitle="Tell us what to build next" />
      <Card className="p-6 max-w-lg">
        {sent ? (
          <div className="flex flex-col items-center text-center py-6">
            <Check size={22} className="text-[var(--color-forest)] mb-3" />
            <div className="font-medium text-[14.5px] text-[var(--color-ink)]">Thanks — got it.</div>
            <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1.5">Your note stays on this device for now since FinBoom doesn't sync anywhere yet.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="What should we improve?">
              <textarea
                className={inputClass} rows={5}
                placeholder="A bug, a missing feature, anything at all..."
                value={text} onChange={e => setText(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-fit"><Send size={14} /> Send feedback</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
