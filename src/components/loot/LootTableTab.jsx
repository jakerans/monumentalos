import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Pencil } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import EditLootPrizeModal from './EditLootPrizeModal';

const rarityColors = {
  common: 'bg-slate-600 text-white',
  rare: 'bg-blue-600 text-white',
  epic: 'bg-purple-600 text-white',
  legendary: 'bg-amber-600 text-white',
};

const rarityBgHeaders = {
  common: 'bg-slate-700/40',
  rare: 'bg-blue-700/40',
  epic: 'bg-purple-700/40',
  legendary: 'bg-amber-700/40',
};

export default function LootTableTab({ prizes, onPrizeUpdated, onPrizeDeleted }) {
  const [editPrize, setEditPrize] = useState(null);

  const groupedPrizes = {
    common: prizes.filter(p => p.rarity === 'common'),
    rare: prizes.filter(p => p.rarity === 'rare'),
    epic: prizes.filter(p => p.rarity === 'epic'),
    legendary: prizes.filter(p => p.rarity === 'legendary'),
  };

  const handleToggleActive = async (prize) => {
    try {
      await base44.entities.LootPrize.update(prize.id, { is_active: !prize.is_active });
      onPrizeUpdated();
      toast({
        title: 'Prize updated',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (prizeId) => {
    if (!confirm('Delete this prize?')) return;
    try {
      await base44.entities.LootPrize.delete(prizeId);
      onPrizeDeleted();
      toast({
        title: 'Prize deleted',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {['common', 'rare', 'epic', 'legendary'].map(rarity => (
        <div key={rarity} className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
          <div className={`${rarityBgHeaders[rarity]} px-6 py-3 border-b border-slate-700/50`}>
            <h3 className="text-lg font-bold text-white capitalize">{rarity}</h3>
          </div>
          
          {groupedPrizes[rarity].length === 0 ? (
            <div className="px-6 py-6 text-center text-slate-500">No prizes in this rarity</div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {groupedPrizes[rarity].map(prize => (
                <div key={prize.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{prize.name}</h4>
                    <p className="text-sm text-slate-300 mt-1">{prize.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className="text-xs bg-slate-700 text-white border-slate-600">
                        {prize.prize_type === 'cash' ? `$${prize.cash_value}` : 'Physical'}
                      </Badge>
                      <span className="text-xs text-slate-400">Weight: {prize.drop_weight}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300">Active</span>
                      <Switch
                        checked={prize.is_active}
                        onCheckedChange={() => handleToggleActive(prize)}
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditPrize(prize)}
                      className="text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prize.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <EditLootPrizeModal
        open={!!editPrize}
        onOpenChange={(v) => { if (!v) setEditPrize(null); }}
        prize={editPrize}
        onPrizeSaved={() => { setEditPrize(null); onPrizeUpdated(); }}
      />
    </div>
  );
}