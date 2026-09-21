import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listRedemptions } from '../services/redeemService';
import { formatDateTime } from '../lib/format';
import { onAppData } from '../lib/events';
import type { Redemption } from '../types/models';

export function RedeemHistoryPage() {
  const [rows, setRows] = useState<Redemption[]>([]);

  useEffect(() => {
    const load = () => {
      void listRedemptions().then(setRows);
    };
    load();
    return onAppData(load);
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Local ledger</p>
        <h1>Redemption history</h1>
        <p>
          <Link to="/redeem">Back to rewards</Link>
        </p>
      </header>
      {rows.length === 0 ? (
        <div className="empty">
          No redemptions yet. Convert Game Coins on the Rewards page to see them here.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reward</th>
                <th>Quantity</th>
                <th>Game Coins</th>
                <th>Status</th>
                <th>ID</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.rewardTitle}</td>
                  <td>{row.quantity}</td>
                  <td>{row.gameCoinsSpent}</td>
                  <td>{row.status}</td>
                  <td className="mono">{row.id}</td>
                  <td>{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
