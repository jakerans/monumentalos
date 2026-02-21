import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

const RARITY_BADGE = {
  common: 'bg-slate-600 text-white',
  rare: 'bg-blue-600 text-white',
  epic: 'bg-purple-600 text-white',
  legendary: 'bg-amber-600 text-white',
};

export default function SetterBonusSummaryTab({ defaultPeriod }) {
  const now = new Date();
  const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod || currentMonthString);
  const [expanded, setExpanded] = useState({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['setter-bonus-summary', period],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSetterBonusSummary', { period });
      return res.data;
    },
    staleTime: 60000,
  });

  const toggleExpanded = (setterId) => {
    setExpanded(prev => ({ ...prev, [setterId]: !prev[setterId] }));
  };

  const handleMarkLootPaid = async (setter) => {
    const today = new Date().toISOString().split('T')[0];
    for (const item of setter.loot_items) {
      await base44.entities.LootWin.update(item.id, {
        fulfillment_status: 'approved',
        fulfillment_date: today,
      });
    }
    toast({ title: 'Loot prizes approved for payroll' });
    queryClient.invalidateQueries({ queryKey: ['setter-bonus-summary'] });
  };

  const setterSummaries = data?.setterSummaries || [];
  const teamBonuses = data?.teamBonuses || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-slate-400 font-medium">Bonus Period:</span>
        <input
          type="month"
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
        />
      </div>

      {isLoading && <p className="text-sm text-slate-400 text-center py-8">Loading...</p>}

      {!isLoading && setterSummaries.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">No setter bonuses for this period.</p>
      )}

      {!isLoading && setterSummaries.map(setter => (
        <div key={setter.setter_id} className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 mb-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-bold">{setter.setter_name}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: '#D6FF03' }}>${setter.total}</span>
              <button onClick={() => toggleExpanded(setter.setter_id)} className="p-1 text-slate-400 hover:text-white transition-colors">
                {expanded[setter.setter_id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Breakdown pills */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              🎁 Spiffs: {setter.spiff_total > 0 ? `$${setter.spiff_total}` : 'None'}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              📦 Loot: {setter.loot_total > 0 ? `$${setter.loot_total}` : 'None'}
            </span>
          </div>

          {/* Expanded detail */}
          {expanded[setter.setter_id] && (
            <div className="mt-3 space-y-3">
              {setter.spiff_items.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Spiffs</p>
                  <div className="space-y-1">
                    {setter.spiff_items.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-white truncate">{item.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${item.scope === 'individual' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {item.scope === 'individual' ? 'Individual' : 'Team'}
                          </span>
                          {item.reward && <span className="text-[10px] text-slate-400 italic truncate">{item.reward}</span>}
                        </div>
                        {item.cash_value > 0 && (
                          <span className="text-xs text-green-400 font-medium shrink-0 ml-2">${item.cash_value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {setter.loot_items.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Loot Box Wins</p>
                  <div className="space-y-1">
                    {setter.loot_items.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-white truncate">{item.prize_name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${RARITY_BADGE[item.rarity] || RARITY_BADGE.common}`}>
                            {item.rarity}
                          </span>
                          {item.won_date && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.won_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-green-400 font-medium shrink-0 ml-2">${item.cash_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {setter.loot_items.length > 0 && (
                <button
                  data-tour="approve-for-payroll-btn"
                  onClick={() => handleMarkLootPaid(setter)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors"
                >
                  ✓ Approve for Payroll
                </button>
              )}

              <p className="text-xs text-slate-500 italic">Spiff totals and approved loot prizes are automatically included when you run payroll.</p>
            </div>
          )}
        </div>
      ))}

      {!isLoading && teamBonuses.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm text-white font-bold mb-2">🏆 Team Bonuses — All Setters</h4>
          <div className="space-y-1">
            {teamBonuses.map(bonus => (
              <div key={bonus.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-800/40 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white">{bonus.title}</span>
                  {bonus.reward && <span className="text-[10px] text-slate-400">{bonus.reward}</span>}
                </div>
                {bonus.cash_value > 0 && (
                  <span className="text-xs text-green-400 font-medium">${bonus.cash_value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}