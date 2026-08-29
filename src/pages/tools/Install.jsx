import { Smartphone, Monitor } from 'lucide-react';
import { PageHeader, Card } from '../../components/UI';

export default function Install() {
  return (
    <div>
      <PageHeader title="Install App" subtitle="Add FinBoom to your device" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-6">
          <Monitor size={20} className="text-[var(--color-ink-soft)] mb-3" />
          <div className="text-[14.5px] font-medium text-[var(--color-ink)]">On desktop</div>
          <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1.5">Open the browser menu and choose "Install FinBoom" — or click the install icon in the address bar.</p>
        </Card>
        <Card className="p-6">
          <Smartphone size={20} className="text-[var(--color-ink-soft)] mb-3" />
          <div className="text-[14.5px] font-medium text-[var(--color-ink)]">On mobile</div>
          <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-1.5">Tap Share → "Add to Home Screen" on iOS, or the browser menu → "Install app" on Android.</p>
        </Card>
      </div>
    </div>
  );
}
