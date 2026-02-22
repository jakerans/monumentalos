import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Copy, Check, UserPlus, Search, Pencil, FileText } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function ClientList({ clients, onInviteUser, onEditClient, sopMap }) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-700 rounded-md bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D6FF03]"
          />
        </div>
        <span className="text-xs text-slate-500">{filtered.length} clients</span>
      </div>
      {/* Mobile card view */}
      <div className="sm:hidden divide-y divide-slate-700/30 overflow-auto max-h-[calc(100vh-240px)]">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            {search ? 'No clients match your search' : 'No clients found'}
          </div>
        ) : filtered.map(client => (
          <div key={client.id} className="px-3 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-200 text-sm">{client.name}</span>
                <Link
                  to={createPageUrl('ClientView') + `?clientId=${client.id}&tab=sop`}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    sopMap?.[client.id]
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'
                  }`}
                  title={sopMap?.[client.id] ? 'SOP exists — click to edit' : 'No SOP — click to create'}
                >
                  <FileText className="w-2.5 h-2.5" />
                  SOP
                </Link>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                client.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-400'
              }`}>{client.status || 'active'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {client.billing_type === 'pay_per_show' ? 'Per Show' :
                 client.billing_type === 'pay_per_set' ? 'Per Set' :
                 client.billing_type === 'retainer' ? 'Retainer' : '—'}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCopy(client.id)} className="p-1 rounded hover:bg-slate-700 transition-colors" title="Copy ID">
                  {copiedId === client.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => onEditClient(client)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium border rounded-md text-slate-300 border-slate-600 hover:bg-slate-700">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => onInviteUser(client)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium border rounded-md text-[#D6FF03] border-[#D6FF03]/30 hover:bg-[#D6FF03]/10">
                <UserPlus className="w-3 h-3" /> Invite
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-auto max-h-[calc(100vh-240px)]">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Client Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Client ID (Zapier)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Billing</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody ref={useAutoAnimate({ duration: 250, easing: 'ease-out' })[0]} className="divide-y divide-slate-700/30">
            {filtered.map(client => (
              <tr key={client.id} className="hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">{client.name}</span>
                    <Link
                      to={createPageUrl('ClientView') + `?clientId=${client.id}&tab=sop`}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        sopMap?.[client.id]
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'
                      }`}
                      title={sopMap?.[client.id] ? 'SOP exists — click to edit' : 'No SOP — click to create'}
                    >
                      <FileText className="w-2.5 h-2.5" />
                      SOP
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs bg-slate-900 px-2 py-1 rounded font-mono text-slate-400 select-all">
                      {client.id}
                    </code>
                    <button
                      onClick={() => handleCopy(client.id)}
                      className="p-1 rounded hover:bg-slate-700 transition-colors"
                      title="Copy ID"
                    >
                      {copiedId === client.id ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    client.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {client.status || 'active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {client.billing_type === 'pay_per_show' ? 'Per Show' :
                   client.billing_type === 'pay_per_set' ? 'Per Set' :
                   client.billing_type === 'retainer' ? 'Retainer' : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEditClient(client)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-md transition-colors text-slate-300 border-slate-600 hover:bg-slate-700"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => onInviteUser(client)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-md transition-colors text-[#D6FF03] border-[#D6FF03]/30 hover:bg-[#D6FF03]/10"
                    >
                      <UserPlus className="w-3 h-3" /> Invite User
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  {search ? 'No clients match your search' : 'No clients found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}