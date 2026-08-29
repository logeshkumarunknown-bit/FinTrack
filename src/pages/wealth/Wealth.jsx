import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../components/UI';
import Assets from './Assets';
import Liabilities from './Liabilities';
import NetWorth from './NetWorth';
import Allocation from './Allocation';

export default function Wealth() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'assets';
  const autoOpen = params.get('add') === '1';

  function setTab(v) {
    const next = new URLSearchParams(params);
    next.set('tab', v);
    next.delete('add');
    setParams(next, { replace: true });
  }

  return (
    <div>
      <div className="pt-2">
        <Tabs
          tabs={[
            { value: 'assets', label: 'Assets' },
            { value: 'liabilities', label: 'Liabilities' },
            { value: 'networth', label: 'Net Worth' },
            { value: 'allocation', label: 'Allocation' },
          ]}
          active={tab} onChange={setTab}
        />
      </div>
      {tab === 'assets' && <Assets autoOpen={autoOpen} />}
      {tab === 'liabilities' && <Liabilities />}
      {tab === 'networth' && <NetWorth />}
      {tab === 'allocation' && <Allocation />}
    </div>
  );
}
