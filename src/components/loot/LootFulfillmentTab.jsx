import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const rarityColors = {
  common: 'bg-slate-600 text-white',
  rare: 'bg-blue-600 text-white',
  epic: 'bg-purple-600 text-white',
  legendary: 'bg-amber-600 text-white',
};

export default function LootFulfillmentTab({ pendingWins, onWinUpdated, users = [], prizes = [] }) {
  const [notes, setNotes] = useState({});

  const getSetterName = (setterId) => {
    const user = users.find(u => u.id === setterId);
    return user?.full_name || setterId?.slice(0, 8);
  };

  const getPrizeFulfillmentNotes = (prizeId) => {
    const prize = prizes.find(p => p.id === prizeId);
    return prize?.fulfillment_notes || null;
  };

  const handleAction = async (win, action) => {
    const today = new Date().toISOString().split('T')[0];
    const updateData = {
      fulfillment_date: today,
      fulfillment_notes: notes[win.id] || '',
    };

    if (action === 'payroll') {
      updateData.fulfillment_status = 'added_to_payroll';
    } else if (action === 'fulfilled') {
      updateData.fulfillment_status = 'fulfilled';
    }

    try {
      await base44.entities.LootWin.update(win.id, updateData);
      onWinUpdated();
      setNotes(prev => ({ ...prev, [win.id]: '' }));
      toast({ title: 'Win updated', variant: 'default' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (pendingWins.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-12 text-center">
        <p className="text-slate-400">No pending wins to fulfill</p>
      </div>
    );
  }

  const cashWins = pendingWins.filter(w => w.prize_type === 'cash');
  const physicalWins = pendingWins.filter(w => w.prize_type === 'physical');

  const renderTable = (wins) => (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Setter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Prize Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Rarity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Won Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {wins.map(win => {
              const prizeFulfillmentNotes = getPrizeFulfillmentNotes(win.prize_id);
              return (
                <tr key={win.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{getSetterName(win.setter_id)}</td>
                  <td className="px-6 py-4 text-sm text-white">{win.prize_name}</td>
                  <td className="px-6 py-4">
                    <Badge className={rarityColors[win.rarity]}>{win.rarity}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    {win.prize_type === 'cash' ? `$${win.cash_value}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(win.won_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="text"
                      placeholder="Fulfillment notes..."
                      value={notes[win.id] || ''}
                      onChange={(e) => setNotes(prev => ({ ...prev, [win.id]: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-xs w-40"
                    />
                    {prizeFulfillmentNotes && (
                      <p className="text-xs text-amber-400 mt-1">⚠ {prizeFulfillmentNotes}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() => handleAction(win, win.prize_type === 'cash' ? 'payroll' : 'fulfilled')}
                      size="sm"
                      variant="outline"
                      className="text-xs border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      {win.prize_type === 'cash' ? (
                        <><DollarSign className="w-3 h-3 mr-1" /> Payroll</>
                      ) : (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Fulfilled</>
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-bold mb-3">💵 Cash Prizes — Add to Payroll</h3>
        {cashWins.length > 0 ? renderTable(cashWins) : (
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 text-center">
            <p className="text-sm text-slate-500">None pending</p>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-white font-bold mb-3">📦 Physical Prizes — Fulfill</h3>
        {physicalWins.length > 0 ? renderTable(physicalWins) : (
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 text-center">
            <p className="text-sm text-slate-500">None pending</p>
          </div>
        )}
      </div>
    </div>
  );
}