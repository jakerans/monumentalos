import React, { useState, forwardRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Check, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const BILLING_LABELS = { pay_per_show: 'Per Show', pay_per_set: 'Per Set', retainer: 'Retainer', hybrid: 'Hybrid' };
const BILLING_COLORS = { pay_per_show: 'bg-blue-500/15 text-blue-400', pay_per_set: 'bg-purple-500/15 text-purple-400', retainer: 'bg-amber-500/15 text-amber-400', hybrid: 'bg-teal-500/15 text-teal-400' };
const INDUSTRIES = ['painting', 'epoxy', 'kitchen_bath', 'reno'];
const IND_LABELS = { painting: 'Painting', epoxy: 'Epoxy', kitchen_bath: 'Kitchen/Bath', reno: 'Reno' };

function getPricingDisplay(client) {
  if (client.billing_type === 'hybrid') {
    const base = `$${client.hybrid_base_retainer || 0}/mo`;
    const perfType = client.hybrid_performance_type || 'pay_per_set';
    const perfLabel = perfType === 'pay_per_show' ? 'show' : 'set';
    const perfPricing = client.hybrid_performance_pricing || [];
    if (perfPricing.length > 0) {
      const rates = perfPricing.map(p => {
        const rate = perfType === 'pay_per_show' ? (p.price_per_show || 0) : (p.price_per_set || 0);
        return `${IND_LABELS[p.industry] || p.industry}: $${rate}/${perfLabel}`;
      }).join(', ');
      return [{ industry: null, rate: `${base} + ${rates}` }];
    }
    return [{ industry: null, rate: `${base} + per ${perfLabel}` }];
  }
  const pricing = client.industry_pricing || [];
  if (pricing.length > 0) {
    return pricing.map(p => {
      const rate = client.billing_type === 'pay_per_set' ? p.price_per_set : p.price_per_show;
      return { industry: p.industry, rate: rate || 0 };
    }).filter(p => p.rate > 0);
  }
  const legacy = client.billing_type === 'pay_per_set'
    ? client.price_per_set_appointment
    : client.price_per_shown_appointment;
  if (legacy) return [{ industry: null, rate: legacy }];
  if (client.billing_type === 'retainer') return [{ industry: null, rate: client.retainer_amount || 0 }];
  return [];
}

function SortHeader({ label, field, sortField, sortDir, onSort, align }) {
  const active = sortField === field;
  return (
    <th
      className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'} cursor-pointer hover:text-slate-200 select-none`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
      </span>
    </th>
  );
}

function InlineEditRow({ client, clientSummary, onSaved }) {
  const bt = client.billing_type || 'pay_per_show';
  const [billingType, setBillingType] = useState(bt);
  const [retainerAmount, setRetainerAmount] = useState(client.retainer_amount || '');
  const [legacyShow, setLegacyShow] = useState(client.price_per_shown_appointment || '');
  const [legacySet, setLegacySet] = useState(client.price_per_set_appointment || '');
  const [industryPricing, setIndustryPricing] = useState(
    (client.industry_pricing || []).length > 0
      ? client.industry_pricing
      : (client.industries || []).map(ind => ({
          industry: ind,
          price_per_show: client.price_per_shown_appointment || 0,
          price_per_set: client.price_per_set_appointment || 0,
        }))
  );
  const [saving, setSaving] = useState(false);

  const updateIndPrice = (idx, field, val) => {
    setIndustryPricing(prev => prev.map((p, i) => i === idx ? { ...p, [field]: Number(val) || 0 } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    const update = { billing_type: billingType };
    if (billingType === 'retainer') {
      update.retainer_amount = Number(retainerAmount) || 0;
    } else {
      update.price_per_shown_appointment = Number(legacyShow) || 0;
      update.price_per_set_appointment = Number(legacySet) || 0;
      update.industry_pricing = industryPricing;
    }
    await base44.entities.Client.update(client.id, update);
    toast({ title: 'Client billing updated' });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-600/50 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-[10px] text-slate-400 font-semibold uppercase">Billing Type</label>
        <select
          value={billingType}
          onChange={e => setBillingType(e.target.value)}
          className="bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600"
        >
          <option value="pay_per_show">Pay Per Show</option>
          <option value="pay_per_set">Pay Per Set</option>
          <option value="retainer">Retainer</option>
          <option value="hybrid">Hybrid (Retainer + Performance)</option>
        </select>
      </div>

      {billingType === 'retainer' ? (
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-slate-400">Monthly Retainer $</label>
          <input
            type="number"
            value={retainerAmount}
            onChange={e => setRetainerAmount(e.target.value)}
            className="bg-slate-700 text-white text-xs rounded px-2 py-1 w-24 border border-slate-600"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Legacy pricing - read only, only show if values exist */}
          {(Number(legacyShow) > 0 || Number(legacySet) > 0) && (
            <div className="flex items-center gap-4 flex-wrap">
              {Number(legacyShow) > 0 && (
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-slate-500">Default $/Show</label>
                  <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">${legacyShow}</span>
                </div>
              )}
              {Number(legacySet) > 0 && (
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-slate-500">Default $/Set</label>
                  <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">${legacySet}</span>
                </div>
              )}
            </div>
          )}
          {/* Industry pricing */}
          {industryPricing.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Per-Industry Pricing</p>
              {industryPricing.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-slate-300 w-16">{IND_LABELS[p.industry] || p.industry}</span>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-slate-500">$/Show</label>
                    <input type="number" value={p.price_per_show || ''} onChange={e => updateIndPrice(idx, 'price_per_show', e.target.value)}
                      className="bg-slate-700 text-white text-xs rounded px-1.5 py-0.5 w-16 border border-slate-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-slate-500">$/Set</label>
                    <input type="number" value={p.price_per_set || ''} onChange={e => updateIndPrice(idx, 'price_per_set', e.target.value)}
                      className="bg-slate-700 text-white text-xs rounded px-1.5 py-0.5 w-16 border border-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={saving}
          className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
          <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function RevenueClientTable({ clients, clientSummary = [], onRefresh }) {
  const [sortField, setSortField] = useState('ltv');
  const [sortDir, setSortDir] = useState('desc');
  const [editingId, setEditingId] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const rows = [...clientSummary].sort((a, b) => {
    const av = a[sortField] ?? 0;
    const bv = b[sortField] ?? 0;
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const totals = rows.reduce((acc, r) => ({ ltv: acc.ltv + r.ltv, outstanding: acc.outstanding + r.outstanding }), { ltv: 0, outstanding: 0 });

  const getClient = (id) => clients.find(c => c.id === id);

  const handleSaved = () => {
    setEditingId(null);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h2 className="text-sm font-bold text-white">Client Revenue & Pricing</h2>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden divide-y divide-slate-700/30">
        {rows.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-slate-500">No client data</div>
        ) : rows.map(r => {
          const client = getClient(r.id);
          const pricing = client ? getPricingDisplay(client) : [];
          return (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <Link to={createPageUrl('ClientView') + `?clientId=${r.id}`} className="font-medium text-blue-400 text-sm">{r.name}</Link>
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billing_type] || 'bg-slate-700 text-slate-400'}`}>
                    {BILLING_LABELS[r.billing_type] || r.billing_type}
                  </span>
                  <button onClick={() => setEditingId(editingId === r.id ? null : r.id)} className="text-slate-500 hover:text-slate-300">
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">LTV: <span className="text-emerald-400 font-medium">${r.ltv.toLocaleString()}</span></span>
                <span className="text-slate-500">Outstanding: <span className={r.outstanding > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>{r.outstanding > 0 ? `$${r.outstanding.toLocaleString()}` : '—'}</span></span>
              </div>
              {pricing.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {pricing.map((p, i) => (
                    <span key={i} className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                      {p.industry ? `${IND_LABELS[p.industry] || p.industry}: ` : ''}${p.rate}
                    </span>
                  ))}
                </div>
              )}
              {editingId === r.id && client && (
                <InlineEditRow client={client} clientSummary={r} onSaved={handleSaved} />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 text-xs text-slate-400 uppercase">
            <tr>
              <SortHeader label="Client" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2 text-left">Billing</th>
              <th className="px-3 py-2 text-left">Pricing</th>
              <SortHeader label="LTV" field="ltv" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
              <SortHeader label="Outstanding" field="outstanding" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {rows.map(r => {
              const client = getClient(r.id);
              const pricing = client ? getPricingDisplay(client) : [];
              return (
                <React.Fragment key={r.id}>
                  <tr className="hover:bg-slate-700/20">
                    <td className="px-4 py-2.5">
                      <Link to={createPageUrl('ClientView') + `?clientId=${r.id}`} className="font-medium text-blue-400 hover:text-blue-300">{r.name}</Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billing_type] || 'bg-slate-700 text-slate-400'}`}>
                        {BILLING_LABELS[r.billing_type] || r.billing_type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {pricing.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic">Not set</span>
                        ) : pricing.map((p, i) => (
                          <span key={i} className="text-[10px] font-medium text-slate-300 bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-600/50">
                            {p.industry ? `${IND_LABELS[p.industry] || p.industry}: ` : ''}<span className="text-white">${p.rate}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-400">${r.ltv.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right">
                      {r.outstanding > 0 ? (
                        <span className="font-bold text-red-400" style={{ textShadow: '0 0 8px rgba(248, 113, 113, 0.5), 0 0 16px rgba(248, 113, 113, 0.25)' }}>
                          ${r.outstanding.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setEditingId(editingId === r.id ? null : r.id)}
                        className={`p-1 rounded hover:bg-slate-600/50 ${editingId === r.id ? 'text-[#D6FF03]' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {editingId === r.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                  {editingId === r.id && client && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <InlineEditRow client={client} clientSummary={r} onSaved={handleSaved} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-900/50 font-bold text-xs text-slate-300">
            <tr>
              <td className="px-4 py-2">TOTALS</td>
              <td></td>
              <td></td>
              <td className="px-3 py-2 text-right text-emerald-400">${totals.ltv.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">
                {totals.outstanding > 0 ? (
                  <span className="text-red-400 font-bold" style={{ textShadow: '0 0 8px rgba(248, 113, 113, 0.5)' }}>
                    ${totals.outstanding.toLocaleString()}
                  </span>
                ) : '—'}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}