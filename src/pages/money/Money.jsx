import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../components/UI';
import Transactions from './Transactions';
import Budget from './Budget';
import Accounts from './Accounts';
import Insights from './Insights';

export default function Money() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || (params.get('add') ? 'transactions' : 'transactions');
  const addType = params.get('add');

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
            { value: 'transactions', label: 'Transactions' },
            { value: 'budget', label: 'Budget' },
            { value: 'accounts', label: 'Accounts' },
            { value: 'insights', label: 'Insights' },
          ]}
          active={tab} onChange={setTab}
        />
      </div>
      {tab === 'transactions' && <Transactions autoOpenType={addType} />}
      {tab === 'budget' && <Budget />}
      {tab === 'accounts' && <Accounts />}
      {tab === 'insights' && <Insights />}
    </div>
  );
}
