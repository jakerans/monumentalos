import React, { useState } from 'react';
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
import { toast } from '@/components/ui/use-toast';

export default function AddLootPrizeModal({ open, onOpenChange, onPrizeAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: 'common',
    prize_type: 'cash',
    cash_value: 0,
    drop_weight: 10,
    is_active: true,
    fulfillment_notes: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Prize name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await base44.entities.LootPrize.create(formData);
      setFormData({
        name: '',
        description: '',
        rarity: 'common',
        prize_type: 'cash',
        cash_value: 0,
        drop_weight: 10,
        is_active: true,
        fulfillment_notes: '',
      });
      onOpenChange(false);
      onPrizeAdded();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Prize</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-300">Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Prize name"
              className="bg-slate-700 border-slate-600 mt-1"
            />
          </div>

          <div>
            <Label className="text-slate-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description"
              className="bg-slate-700 border-slate-600 mt-1 h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Rarity</Label>
              <Select value={formData.rarity} onValueChange={(value) => handleChange('rarity', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Type</Label>
              <Select value={formData.prize_type} onValueChange={(value) => handleChange('prize_type', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.prize_type === 'cash' && (
            <div>
              <Label className="text-slate-300">Cash Value ($)</Label>
              <Input
                type="number"
                value={formData.cash_value}
                onChange={(e) => handleChange('cash_value', parseFloat(e.target.value))}
                className="bg-slate-700 border-slate-600 mt-1"
              />
            </div>
          )}

          <div>
            <Label className="text-slate-300">Drop Weight</Label>
            <p className="text-xs text-slate-500 mb-1">Higher number = more likely within this rarity</p>
            <Input
              type="number"
              value={formData.drop_weight}
              onChange={(e) => handleChange('drop_weight', parseFloat(e.target.value))}
              className="bg-slate-700 border-slate-600"
            />
          </div>

          <div>
            <Label className="text-slate-300">Fulfillment Notes</Label>
            <Textarea
              value={formData.fulfillment_notes}
              onChange={(e) => handleChange('fulfillment_notes', e.target.value)}
              placeholder="Notes for admins on how to fulfill this prize"
              className="bg-slate-700 border-slate-600 mt-1 h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#D6FF03] text-black hover:bg-[#C4E603]"
          >
            Create Prize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}