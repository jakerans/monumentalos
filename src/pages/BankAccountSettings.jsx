import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Landmark, X } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';

const TYPE_LABELS = {
  operating: 'Operating',
  client_adspend: 'Client Ad Spend',
};

function AddBankAccountModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', account_id: '', account_type: 'operating', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Add Bank Account</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Account Name</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Operating Account"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Account ID</label>
            <input
              required
              value={form.account_id}
              onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
              placeholder="e.g. last 4 digits or full ID"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Account Type</label>
            <select
              value={form.account_type}
              onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
            >
              <option value="operating">Operating</option>
              <option value="client_adspend">Client Ad Spend</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes <span className="text-slate-600">(optional)</span></label>
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] placeholder-slate-500"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-semibold text-black rounded-lg transition-colors disabled:opacity-50" style={{ backgroundColor: '#D6FF03' }}>
              {saving ? 'Saving…' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BankAccountSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role !== 'admin') navigate('/');
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => base44.entities.BankAccount.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BankAccount.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bank-accounts'] }); setShowModal(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BankAccount.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bank-accounts'] }); setDeleteConfirm(null); },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <AdminSidebar user={user} currentPage="BankAccountSettings" />

      <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Landmark className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Bank Accounts</h1>
                <p className="text-xs text-slate-400 mt-0.5">Manage accounts used for expense tracking</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-black rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: '#D6FF03' }}
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          </div>

          <div className="bg-slate-800/60 rounded-xl border border-slate-700/40 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
            ) : accounts.length === 0 ? (
              <div className="p-10 text-center">
                <Landmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No bank accounts yet</p>
                <p className="text-slate-600 text-xs mt-1">Add your first account to get started</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700/40">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Account ID</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Notes</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {accounts.map(acct => (
                    <tr key={acct.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-white">{acct.name}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-300 font-mono">{acct.account_id}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          acct.account_type === 'operating' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'
                        }`}>
                          {TYPE_LABELS[acct.account_type] || acct.account_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 hidden sm:table-cell">{acct.notes || '—'}</td>
                      <td className="px-5 py-3.5 text-right">
                        {deleteConfirm === acct.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-slate-400">Delete?</span>
                            <button onClick={() => deleteMutation.mutate(acct.id)} className="text-xs text-red-400 hover:text-red-300 font-semibold">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-xs text-slate-400 hover:text-white">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(acct.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-500/10">
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
      </main>

      {showModal && (
        <AddBankAccountModal
          onClose={() => setShowModal(false)}
          onSave={(data) => createMutation.mutateAsync(data)}
        />
      )}
    </div>
  );
}