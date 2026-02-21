import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';

export default function EditLootPrizeModal({ open, onOpenChange, prize, onPrizeSaved }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prize) {
      setFormData({
        name: prize.name || '',
        description: prize.description || '',
        rarity: prize.rarity || 'common',
        prize_type: prize.prize_type || 'cash',
        cash_value: prize.cash_value || 0,
        drop_weight: prize.drop_weight || 10,
        is_active: !!prize.is_active,
        fulfillment_notes: prize.fulfillment_notes || '',
      });
    }
  }, [prize]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Prize name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.LootPrize.update(prize.id, formData);
      toast({ title: 'Prize updated' });
      onOpenChange(false);
      onPrizeSaved();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Prize</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-200">Name</Label>
            <Input value={formData.name || ''} onChange={e => handleChange('name', e.target.value)}
              placeholder="Prize name" className="bg-slate-900 border-slate-600 text-white mt-1" />
          </div>
          <div>
            <Label className="text-slate-200">Description</Label>
            <Textarea value={formData.description || ''} onChange={e => handleChange('description', e.target.value)}
              placeholder="Brief description" className="bg-slate-900 border-slate-600 text-white mt-1 h-20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-200">Rarity</Label>
              <Select value={formData.rarity} onValueChange={v => handleChange('rarity', v)}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-200">Type</Label>
              <Select value={formData.prize_type} onValueChange={v => handleChange('prize_type', v)}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {formData.prize_type === 'cash' && (
            <div>
              <Label className="text-slate-200">Cash Value ($)</Label>
              <Input type="number" value={formData.cash_value || 0}
                onChange={e => handleChange('cash_value', parseFloat(e.target.value))}
                className="bg-slate-900 border-slate-600 text-white mt-1" />
            </div>
          )}
          <div>
            <Label className="text-slate-200">Drop Weight</Label>
            <p className="text-xs text-slate-500 mb-1">Higher number = more likely within this rarity</p>
            <Input type="number" value={formData.drop_weight || 0}
              onChange={e => handleChange('drop_weight', parseFloat(e.target.value))}
              className="bg-slate-900 border-slate-600 text-white" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-slate-200">Active</Label>
            <Switch checked={!!formData.is_active} onCheckedChange={v => handleChange('is_active', v)} />
          </div>
          <div>
            <Label className="text-slate-200">Fulfillment Notes</Label>
            <Textarea value={formData.fulfillment_notes || ''}
              onChange={e => handleChange('fulfillment_notes', e.target.value)}
              placeholder="Notes for admins on how to fulfill this prize"
              className="bg-slate-900 border-slate-600 text-white mt-1 h-20" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#D6FF03] text-black hover:bg-[#C4E603]">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}