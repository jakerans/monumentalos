import React, { useState } from 'react';
import { Copy, Check, UserPlus, Search } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function ClientList({ clients, onInviteUser }) {
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-gray-400">{filtered.length} clients</span>
      </div>
      <div className="overflow-auto max-h-[calc(100vh-240px)]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client ID (Zapier)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Billing</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody ref={useAutoAnimate({ duration: 250, easing: 'ease-out' })[0]} className="divide-y divide-gray-100">
            {filtered.map(client => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{client.name}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 select-all">
                      {client.id}
                    </code>
                    <button
                      onClick={() => handleCopy(client.id)}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Copy ID"
                    >
                      {copiedId === client.id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {client.status || 'active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {client.billing_type === 'pay_per_show' ? 'Per Show' :
                   client.billing_type === 'pay_per_set' ? 'Per Set' :
                   client.billing_type === 'retainer' ? 'Retainer' : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onInviteUser(client)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    <UserPlus className="w-3 h-3" /> Invite User
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
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