import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Save, Info } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const RARITY_DOT_COLORS = {
  common: '#94a3b8',
  rare: '#60a5fa',
  epic: '#a855f7',
  legendary: '#fbbf24',
};

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
    image_common: '',
    image_rare: '',
    image_epic: '',
    image_legendary: '',
    image_common_opened: '',
    image_rare_opened: '',
    image_epic_opened: '',
    image_legendary_opened: '',
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
        image_common: settings.image_common || '',
        image_rare: settings.image_rare || '',
        image_epic: settings.image_epic || '',
        image_legendary: settings.image_legendary || '',
        image_common_opened: settings.image_common_opened || '',
        image_rare_opened: settings.image_rare_opened || '',
        image_epic_opened: settings.image_epic_opened || '',
        image_legendary_opened: settings.image_legendary_opened || '',
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
      toast({ title: 'Settings saved', variant: 'default' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const inputClass = 'bg-slate-900 border-slate-600 text-white placeholder-slate-500';

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-2xl">
        {/* Drop Rate Settings */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-4">
          <h3 className="text-white font-bold mb-4">Drop Rate Settings</h3>

          <div>
            <Label className="text-slate-200">Base Drop Rate (%)</Label>
            <p className="text-xs text-slate-400 mb-2">Chance of a booking reward dropping on any single booking</p>
            <Input
              type="number"
              value={formData.base_drop_rate}
              onChange={(e) => handleChange('base_drop_rate', parseFloat(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <Label className="text-slate-200">Dry Spell Threshold</Label>
            <p className="text-xs text-slate-400 mb-2">Consecutive bookings with no drop before escalation starts</p>
            <Input
              type="number"
              value={formData.dry_spell_threshold}
              onChange={(e) => handleChange('dry_spell_threshold', parseInt(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <Label className="text-slate-200">Escalation Per Booking (%)</Label>
            <p className="text-xs text-slate-400 mb-2">Percentage points added per booking after dry spell threshold</p>
            <Input
              type="number"
              value={formData.escalation_per_booking}
              onChange={(e) => handleChange('escalation_per_booking', parseFloat(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-4">
          <h3 className="text-white font-bold mb-4">Inventory Settings</h3>

          <div>
            <Label className="text-slate-200">Inventory Cap</Label>
            <p className="text-xs text-slate-400 mb-2">Maximum unopened booking rewards a setter can hold</p>
            <Input
              type="number"
              value={formData.inventory_cap}
              onChange={(e) => handleChange('inventory_cap', parseInt(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <Label className="text-slate-200">Inventory Yellow Warning</Label>
            <p className="text-xs text-slate-400 mb-2">Booking reward count that triggers yellow warning badge</p>
            <Input
              type="number"
              value={formData.inventory_yellow_warning}
              onChange={(e) => handleChange('inventory_yellow_warning', parseInt(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <Label className="text-slate-200">Eligibility STL Threshold (minutes)</Label>
            <p className="text-xs text-slate-400 mb-2">Setter's average speed-to-lead must be below this to be eligible</p>
            <Input
              type="number"
              value={formData.eligibility_stl_threshold_minutes}
              onChange={(e) => handleChange('eligibility_stl_threshold_minutes', parseFloat(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Rarity Weights */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-4">
          <h3 className="text-white font-bold mb-4">Rarity Weights</h3>
          <p className="text-xs text-slate-400 mb-4">Relative probability of each rarity. Higher number = more likely</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-200">Common</Label>
              <Input
                type="number"
                value={formData.rarity_weight_common}
                onChange={(e) => handleChange('rarity_weight_common', parseInt(e.target.value))}
                className={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <Label className="text-slate-200">Rare</Label>
              <Input
                type="number"
                value={formData.rarity_weight_rare}
                onChange={(e) => handleChange('rarity_weight_rare', parseInt(e.target.value))}
                className={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <Label className="text-slate-200">Epic</Label>
              <Input
                type="number"
                value={formData.rarity_weight_epic}
                onChange={(e) => handleChange('rarity_weight_epic', parseInt(e.target.value))}
                className={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <Label className="text-slate-200">Legendary</Label>
              <Input
                type="number"
                value={formData.rarity_weight_legendary}
                onChange={(e) => handleChange('rarity_weight_legendary', parseInt(e.target.value))}
                className={`${inputClass} mt-1`}
              />
            </div>
          </div>
        </div>

        {/* Test Mode */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-4">
          <h3 className="text-white font-bold mb-4">Test Mode</h3>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-slate-200">Test Mode Enabled</Label>
              <p className="text-xs text-slate-400">When ON, drop calculations are bypassed and admin can force outcomes</p>
            </div>
            <Switch
              checked={formData.test_mode_enabled}
              onCheckedChange={(checked) => handleChange('test_mode_enabled', checked)}
            />
          </div>

          {formData.test_mode_enabled && (
            <>
              <div>
                <Label className="text-slate-200">Test Target Setter ID</Label>
                <p className="text-xs text-slate-400 mb-2">Setter account to use when test mode is active</p>
                <Input
                  type="text"
                  value={formData.test_target_setter_id}
                  onChange={(e) => handleChange('test_target_setter_id', e.target.value)}
                  placeholder="Setter user ID"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-slate-200">Force Rarity Override</Label>
                <p className="text-xs text-slate-400 mb-2">Rarity to force when test mode is active</p>
                <select
                  value={formData.test_rarity_override}
                  onChange={(e) => handleChange('test_rarity_override', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
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

        {/* Box Images */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6 space-y-4">
          <h3 className="text-white font-bold mb-4">Reward Images</h3>
          <p className="text-xs text-slate-400 mb-4">Custom images displayed on booking reward cards. Leave blank to use default icon.</p>

          {['common', 'rare', 'epic', 'legendary'].map(rarity => (
            <div key={rarity} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: RARITY_DOT_COLORS[rarity] }}
                />
                <Label className="text-slate-200 capitalize">{rarity} Reward Image</Label>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label className="text-slate-400 text-xs">Closed Image URL</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-xs">
                       Recommended: 400×400px PNG or WebP with transparent background. Max 2MB. Upload to any image host (Imgur, Cloudinary, etc.) and paste the direct image URL here. The image will be displayed on the reward card — use a square format for best results.
                     </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    value={formData[`image_${rarity}`]}
                    onChange={(e) => handleChange(`image_${rarity}`, e.target.value)}
                    placeholder="https://example.com/box-closed.png"
                    className={`${inputClass} flex-1`}
                  />
                  {formData[`image_${rarity}`] && (
                    <img
                      src={formData[`image_${rarity}`]}
                      alt={`${rarity} closed preview`}
                      className="w-[60px] h-[60px] object-contain rounded-lg border border-slate-600 bg-slate-900 shrink-0"
                    />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label className="text-slate-400 text-xs">Opened Image URL</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-xs">
                       Recommended: 400×400px PNG or WebP with transparent background. Max 2MB. This image is shown on the prize reveal card after a reward is opened. Leave blank to fall back to the closed image.
                     </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    value={formData[`image_${rarity}_opened`]}
                    onChange={(e) => handleChange(`image_${rarity}_opened`, e.target.value)}
                    placeholder="https://example.com/box-opened.png"
                    className={`${inputClass} flex-1`}
                  />
                  {formData[`image_${rarity}_opened`] && (
                    <img
                      src={formData[`image_${rarity}_opened`]}
                      alt={`${rarity} opened preview`}
                      className="w-[60px] h-[60px] object-contain rounded-lg border border-slate-600 bg-slate-900 shrink-0"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
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
    </TooltipProvider>
  );
}