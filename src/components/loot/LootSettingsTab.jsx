import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function LootSettingsTab({ settings, onSettingsSaved }) {
  const [formData, setFormData] = useState({
    base_drop_rate: 5,
    dry_spell_threshold: 25,
    escalation_per_booking: 1,
    inventory_cap: 10,
    inventory_yellow_warning: 8,
    eligibility_stl_threshold_minutes: 5,
    rarity_weight_common: 65,
    rarity_weight_rare: 25,
    rarity_weight_epic: 8,
    rarity_weight_legendary: 2,
    test_mode_enabled: false,
    test_target_setter_id: '',
    test_rarity_override: 'common',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        base_drop_rate: settings.base_drop_rate || 5,
        dry_spell_threshold: settings.dry_spell_threshold || 25,
        escalation_per_booking: settings.escalation_per_booking || 1,
        inventory_cap: settings.inventory_cap || 10,
        inventory_yellow_warning: settings.inventory_yellow_warning || 8,
        eligibility_stl_threshold_minutes: settings.eligibility_stl_threshold_minutes || 5,
        rarity_weight_common: settings.rarity_weight_common || 65,
        rarity_weight_rare: settings.rarity_weight_rare || 25,
        rarity_weight_epic: settings.rarity_weight_epic || 8,
        rarity_weight_legendary: settings.rarity_weight_legendary || 2,
        test_mode_enabled: settings.test_mode_enabled || false,
        test_target_setter_id: settings.test_target_setter_id || '',
        test_rarity_override: settings.test_rarity_override || 'common',
      });
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (settings && settings.id) {
        await base44.entities.LootSettings.update(settings.id, formData);
      } else {
        await base44.entities.LootSettings.create(formData);
      }
      onSettingsSaved();
      toast({
        title: 'Settings saved',
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
    <div className="space-y-6 max-w-2xl">
      {/* Drop Rate Settings */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-4">
        <h3 className="font-bold text-white mb-4">Drop Rate Settings</h3>

        <div>
          <Label className="text-slate-300">Base Drop Rate (%)</Label>
          <p className="text-xs text-slate-500 mb-2">Chance of a box dropping on any single booking</p>
          <Input
            type="number"
            value={formData.base_drop_rate}
            onChange={(e) => handleChange('base_drop_rate', parseFloat(e.target.value))}
            className="bg-slate-700 border-slate-600"
          />
        </div>

        <div>
          <Label className="text-slate-300">Dry Spell Threshold</Label>
          <p className="text-xs text-slate-500 mb-2">Consecutive bookings with no drop before escalation starts</p>
          <Input
            type="number"
            value={formData.dry_spell_threshold}
            onChange={(e) => handleChange('dry_spell_threshold', parseInt(e.target.value))}
            className="bg-slate-700 border-slate-600"
          />
        </div>

        <div>
          <Label className="text-slate-300">Escalation Per Booking (%)</Label>
          <p className="text-xs text-slate-500 mb-2">Percentage points added per booking after dry spell threshold</p>
          <Input
            type="number"
            value={formData.escalation_per_booking}
            onChange={(e) => handleChange('escalation_per_booking', parseFloat(e.target.value))}
            className="bg-slate-700 border-slate-600"
          />
        </div>
      </div>

      {/* Inventory Settings */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-4">
        <h3 className="font-bold text-white mb-4">Inventory Settings</h3>

        <div>
          <Label className="text-slate-300">Inventory Cap</Label>
          <p className="text-xs text-slate-500 mb-2">Maximum unopened boxes a setter can hold</p>
          <Input
            type="number"
            value={formData.inventory_cap}
            onChange={(e) => handleChange('inventory_cap', parseInt(e.target.value))}
            className="bg-slate-700 border-slate-600"
          />
        </div>

        <div>
          <Label className="text-slate-300">Inventory Yellow Warning</Label>
          <p className="text-xs text-slate-500 mb-2">Box count that triggers yellow warning badge</p>
          <Input
            type="number"
            value={formData.inventory_yellow_warning}
            onChange={(e) => handleChange('inventory_yellow_warning', parseInt(e.target.value))}
            className="bg-slate-700 border-slate-600"
          />
        </div>

        <div>
          <Label className="text-slate-300">Eligibility STL Threshold (minutes)</Label>
          <p className="text-xs text-slate-500 mb-2">Setter's average speed-to-lead must be below this to be eligible</p>
          <Input
            type="number"
            value={formData.eligibility_stl_threshold_minutes}
            onChange={(e) => handleChange('eligibility_stl_threshold_minutes', parseFloat(e.target.value))}
            className="bg-slate-700 border-slate-600"
          />
        </div>
      </div>

      {/* Rarity Weights */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-4">
        <h3 className="font-bold text-white mb-4">Rarity Weights</h3>
        <p className="text-xs text-slate-500 mb-4">Relative probability of each rarity. Higher number = more likely</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Common</Label>
            <Input
              type="number"
              value={formData.rarity_weight_common}
              onChange={(e) => handleChange('rarity_weight_common', parseInt(e.target.value))}
              className="bg-slate-700 border-slate-600 mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-300">Rare</Label>
            <Input
              type="number"
              value={formData.rarity_weight_rare}
              onChange={(e) => handleChange('rarity_weight_rare', parseInt(e.target.value))}
              className="bg-slate-700 border-slate-600 mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-300">Epic</Label>
            <Input
              type="number"
              value={formData.rarity_weight_epic}
              onChange={(e) => handleChange('rarity_weight_epic', parseInt(e.target.value))}
              className="bg-slate-700 border-slate-600 mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-300">Legendary</Label>
            <Input
              type="number"
              value={formData.rarity_weight_legendary}
              onChange={(e) => handleChange('rarity_weight_legendary', parseInt(e.target.value))}
              className="bg-slate-700 border-slate-600 mt-1"
            />
          </div>
        </div>
      </div>

      {/* Test Mode */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-4">
        <h3 className="font-bold text-white mb-4">Test Mode</h3>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-slate-300">Test Mode Enabled</Label>
            <p className="text-xs text-slate-500">When ON, drop calculations are bypassed and admin can force outcomes</p>
          </div>
          <Switch
            checked={formData.test_mode_enabled}
            onCheckedChange={(checked) => handleChange('test_mode_enabled', checked)}
          />
        </div>

        {formData.test_mode_enabled && (
          <>
            <div>
              <Label className="text-slate-300">Test Target Setter ID</Label>
              <p className="text-xs text-slate-500 mb-2">Setter account to use when test mode is active</p>
              <Input
                type="text"
                value={formData.test_target_setter_id}
                onChange={(e) => handleChange('test_target_setter_id', e.target.value)}
                placeholder="Setter user ID"
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div>
              <Label className="text-slate-300">Force Rarity Override</Label>
              <p className="text-xs text-slate-500 mb-2">Rarity to force when test mode is active</p>
              <select
                value={formData.test_rarity_override}
                onChange={(e) => handleChange('test_rarity_override', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-[#D6FF03] text-black hover:bg-[#C4E603]"
        >
          <Save className="w-4 h-4 mr-2" /> Save Settings
        </Button>
      </div>
    </div>
  );
}