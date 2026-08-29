import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../components/UI';
import Essentials from './Essentials';
import Goals from './Goals';

export default function EssentialsSection() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'essentials';

  function setTab(v) {
    const next = new URLSearchParams(params);
    next.set('tab', v);
    setParams(next, { replace: true });
  }

  return (
    <div>
      <div className="pt-2">
        <Tabs
          tabs={[
            { value: 'essentials', label: 'Essentials' },
            { value: 'goals', label: 'Goals' },
          ]}
          active={tab} onChange={setTab}
        />
      </div>
      {tab === 'essentials' && <Essentials />}
      {tab === 'goals' && <Goals />}
    </div>
  );
}
