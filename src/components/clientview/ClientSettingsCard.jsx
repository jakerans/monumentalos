import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { MapPin, DollarSign, Link as LinkIcon, Tag, Pencil, Save, X, Power } from 'lucide-react';
import { INDUSTRY_LABELS, INDUSTRY_COLORS } from '../shared/IndustryPicker';
import IndustryPicker from '../shared/IndustryPicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const EDITABLE_ROLES = ['admin', 'marketing_manager', 'onboard_admin'];

export default function ClientSettingsCard({ client, userRole, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const canEdit = EDITABLE_ROLES.includes(userRole);

  const startEdit = () => {
    setForm({
      service_radius: client.service_radius || '',
      target_zip_codes: client.target_zip_codes || '',
      negative_zip_codes: client.negative_zip_codes || '',
      booking_link: client.booking_link || '',
      industries: client.industries || [],
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Client.update(client.id, form);
    setSaving(false);
    setEditing(false);
    toast({ title: 'Settings Saved', description: `${client.name} updated.`, variant: 'success' });
    if (onUpdated) onUpdated();
  };

  const handleDeactivate = async () => {
    const isActive = client.status === 'active';
    const updates = {
      status: isActive ? 'inactive' : 'active',
    };
    if (isActive) {
      updates.deactivated_date = new Date().toISOString().split('T')[0];
    } else {
      updates.deactivated_date = null;
    }
    await base44.entities.Client.update(client.id, updates);
    setConfirmDeactivate(false);
    toast({
      title: isActive ? 'Client Deactivated' : 'Client Reactivated',
      description: `${client.name} is now ${isActive ? 'inactive' : 'active'}.`,
      variant: isActive ? 'warning' : 'success',
    });
    if (onUpdated) onUpdated();
  };

  if (!client) return null;

  const isActive = client.status === 'active';

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">Client Settings</h3>
        {canEdit && !editing && (
          <button onClick={startEdit} className="p-1 rounded hover:bg-slate-700 transition-colors">
            <Pencil className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      <div className="space-y-2.5 text-xs">
        {/* Industry */}
        <div className="flex items-start gap-2">
          <Tag className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-500">Industry</p>
            {editing ? (
              <div className="mt-1">
                <IndustryPicker selected={form.industries} onChange={(v) => setForm(f => ({ ...f, industries: v }))} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(client.industries && client.industries.length > 0) ? client.industries.map(ind => (
                  <span key={ind} className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${INDUSTRY_COLORS[ind] || 'bg-slate-700 text-slate-400'}`}>
                    {INDUSTRY_LABELS[ind] || ind}
                  </span>
                )) : <span className="text-slate-500 italic">—</span>}
              </div>
            )}
          </div>
        </div>

        {/* Billing (read-only here, edited via billing editor) */}
        <div className="flex items-start gap-2">
          <DollarSign className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-slate-500">Billing</p>
            <p className="font-semibold text-white">
              {client.billing_type === 'pay_per_set' ? `$${client.price_per_set_appointment || 0} / appt set` :
               client.billing_type === 'retainer' ? `$${client.retainer_amount || 0}/mo retainer` :
               `$${client.price_per_shown_appointment || 0} / shown appt`}
            </p>
          </div>
        </div>

        {/* Service Radius */}
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-500">Service Radius</p>
            {editing ? (
              <input value={form.service_radius} onChange={e => setForm(f => ({ ...f, service_radius: e.target.value }))} className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white" placeholder="e.g. 25 miles" />
            ) : (
              <p className="font-semibold text-white">{client.service_radius || <span className="text-slate-500 italic">—</span>}</p>
            )}
          </div>
        </div>

        {/* Target Zips */}
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-500">Target Zips</p>
            {editing ? (
              <input value={form.target_zip_codes} onChange={e => setForm(f => ({ ...f, target_zip_codes: e.target.value }))} className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white" placeholder="Comma-separated" />
            ) : (
              <p className="font-semibold text-white break-all">{client.target_zip_codes || <span className="text-slate-500 italic">—</span>}</p>
            )}
          </div>
        </div>

        {/* Negative Zips */}
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-500">Negative Zips</p>
            {editing ? (
              <input value={form.negative_zip_codes} onChange={e => setForm(f => ({ ...f, negative_zip_codes: e.target.value }))} className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white" placeholder="Comma-separated" />
            ) : (
              <p className="font-semibold text-white break-all">{client.negative_zip_codes || <span className="text-slate-500 italic">—</span>}</p>
            )}
          </div>
        </div>

        {/* Booking Link */}
        <div className="flex items-start gap-2">
          <LinkIcon className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-500">Booking Link</p>
            {editing ? (
              <input value={form.booking_link} onChange={e => setForm(f => ({ ...f, booking_link: e.target.value }))} className="w-full mt-0.5 px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white" placeholder="https://..." />
            ) : (
              client.booking_link ? (
                <a href={client.booking_link} target="_blank" rel="noreferrer" className="font-semibold text-blue-400 hover:underline truncate block max-w-[200px]">
                  {client.booking_link}
                </a>
              ) : <p className="text-slate-500 italic">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit action buttons */}
      {editing && (
        <div className="flex gap-2 mt-3">
          <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600">
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      )}

      {/* Deactivate / Reactivate button */}
      {canEdit && !editing && (
        <button
          onClick={() => setConfirmDeactivate(true)}
          className={`w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isActive
              ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
              : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
          }`}
        >
          <Power className="w-3 h-3" />
          {isActive ? 'Deactivate Client' : 'Reactivate Client'}
        </button>
      )}

      <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isActive ? 'Deactivate' : 'Reactivate'} {client.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? 'This will mark the client as inactive. They will no longer appear in active client lists and will count toward churn metrics.'
                : 'This will reactivate the client and restore them to active status.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>
              {isActive ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}