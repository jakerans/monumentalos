import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Landmark, X, Check } from 'lucide-react';

const TYPE_LABELS = { operating: 'Operating', client_adspend: 'Client Ad Spend' };

const EMPTY_FORM = { name: '', account_id: '', account_type: 'operating', notes: '' };

export default function BankAccountsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => base44.entities.BankAccount.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BankAccount.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bank-accounts'] }); setDeleteConfirm(null); },
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.BankAccount.create(form);
    queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Bank accounts used for expense tracking and feed imports.</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black rounded-lg hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#D6FF03' }}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add Account'}
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Account Name</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Operating Account"
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Account ID</label>
              <input
                required
                value={form.account_id}
                onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                placeholder="e.g. last 4 digits"
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Account Type</label>
              <select
                value={form.account_type}
                onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
              >
                <option value="operating">Operating</option>
                <option value="client_adspend">Client Ad Spend</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wider">Notes <span className="text-slate-600 normal-case">(optional)</span></label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] placeholder-slate-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-black rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#D6FF03' }}>
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save Account'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500 text-xs">Loading…</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <Landmark className="w-7 h-7 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">No bank accounts added yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700/40">
              <tr>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Account ID</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Notes</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {accounts.map(acct => (
                <tr key={acct.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-white">{acct.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-300 font-mono">{acct.account_id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      acct.account_type === 'operating' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'
                    }`}>
                      {TYPE_LABELS[acct.account_type] || acct.account_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-500 hidden sm:table-cell">{acct.notes || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {deleteConfirm === acct.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] text-slate-400">Delete?</span>
                        <button onClick={() => deleteMutation.mutate(acct.id)} className="text-[10px] text-red-400 hover:text-red-300 font-semibold">Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-slate-400 hover:text-white">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(acct.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}