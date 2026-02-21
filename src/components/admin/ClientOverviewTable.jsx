import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trash2, Pencil } from 'lucide-react';
import AnimatedTable from '../shared/AnimatedTable';
import DeleteClientDialog from './DeleteClientDialog';
import EditClientModal from '../onboard/EditClientModal';

const BILLING_LABELS = {
  pay_per_show: 'Per Show',
  pay_per_set: 'Per Set',
  retainer: 'Retainer',
  hybrid: 'Hybrid',
};

const BILLING_COLORS = {
  pay_per_show: 'bg-blue-500/20 text-blue-400',
  pay_per_set: 'bg-purple-500/20 text-purple-400',
  retainer: 'bg-amber-500/20 text-amber-400',
  hybrid: 'bg-teal-500/20 text-teal-400',
};

function getBillingRate(client) {
  const t = client.billing_type || 'pay_per_show';
  if (t === 'retainer') return client.retainer_amount ? `$${client.retainer_amount}/mo` : '—';
  const pricing = client.industry_pricing || [];
  if (pricing.length > 0) {
    const field = t === 'pay_per_set' ? 'price_per_set' : 'price_per_show';
    return pricing.map(p => `$${p[field] || 0}`).join(' / ');
  }
  if (t === 'pay_per_set') return client.price_per_set_appointment ? `$${client.price_per_set_appointment}` : '—';
  return client.price_per_shown_appointment ? `$${client.price_per_shown_appointment}` : '—';
}

export default function ClientOverviewTable({ clients, leads, spend, payments, onRefresh }) {
  const [deleteClient, setDeleteClient] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = useMemo(() => clients.filter(c => c.status === 'active').map(client => {
    const cLeads = leads.filter(l => l.client_id === client.id);
    const mtdLeads = cLeads.filter(l => new Date(l.created_date) >= thisMonthStart).length;
    const mtdBooked = cLeads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= thisMonthStart).length;
    const mtdShowed = cLeads.filter(l => l.disposition === 'showed' && l.appointment_date && new Date(l.appointment_date) >= thisMonthStart).length;
    const mtdSpend = spend.filter(s => s.client_id === client.id && new Date(s.date) >= thisMonthStart).reduce((s, r) => s + (r.amount || 0), 0);

    const billingType = client.billing_type || 'pay_per_show';
    const pricing = client.industry_pricing || [];
    function getLeadPrice(lead, field) {
      const ind = (lead.industries && lead.industries[0]) || null;
      const match = ind ? pricing.find(p => p.industry === ind) : null;
      if (match) return match[field] || 0;
      return field === 'price_per_show' ? (client.price_per_shown_appointment || 0) : (client.price_per_set_appointment || 0);
    }
    let mtdBilled = 0;
    if (billingType === 'pay_per_show') {
      cLeads.filter(l => l.disposition === 'showed' && l.appointment_date && new Date(l.appointment_date) >= thisMonthStart).forEach(l => { mtdBilled += getLeadPrice(l, 'price_per_show'); });
    } else if (billingType === 'pay_per_set') {
      cLeads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= thisMonthStart).forEach(l => { mtdBilled += getLeadPrice(l, 'price_per_set'); });
    } else if (billingType === 'retainer') {
      mtdBilled = client.retainer_amount || 0;
    }

    const mtdPaid = payments.filter(p => p.client_id === client.id && new Date(p.date) >= thisMonthStart).reduce((s, p) => s + (p.amount || 0), 0);

    return { ...client, mtdLeads, mtdBooked, mtdShowed, mtdSpend, mtdBilled, mtdPaid, billingType };
  }), [clients, leads, spend, payments]);

  const columns = [
    {
      key: 'name', label: 'Client', align: 'left', sortable: true,
      render: (r) => (
        <Link to={createPageUrl('ClientView') + `?clientId=${r.id}`} className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
          {r.name}
        </Link>
      ),
    },
    {
      key: 'billingType', label: 'Billing', align: 'left', sortable: true,
      render: (r) => (
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billingType] || 'bg-slate-700 text-slate-300'}`}>
          {BILLING_LABELS[r.billingType] || r.billingType}
        </span>
      ),
    },
    {
      key: 'rate', label: 'Rate', align: 'right', sortable: false,
      render: (r) => <span className="text-slate-300">{getBillingRate(r)}</span>,
    },
    { key: 'mtdLeads', label: 'Leads', align: 'right', sortable: true, render: (r) => <span className="text-slate-300">{r.mtdLeads}</span> },
    { key: 'mtdBooked', label: 'Booked', align: 'right', sortable: true, render: (r) => <span className="text-slate-300">{r.mtdBooked}</span> },
    { key: 'mtdShowed', label: 'Showed', align: 'right', sortable: true, render: (r) => <span className="text-slate-300">{r.mtdShowed}</span> },
    { key: 'mtdSpend', label: 'Ad Spend', align: 'right', sortable: true, render: (r) => <span className="text-slate-300">${r.mtdSpend.toLocaleString()}</span> },
    { key: 'mtdBilled', label: 'To Be Billed', align: 'right', sortable: true, render: (r) => <span className="font-medium text-green-400">${r.mtdBilled.toLocaleString()}</span> },
    { key: 'mtdPaid', label: 'Collected', align: 'right', sortable: true, render: (r) => <span className="font-medium text-emerald-400">${r.mtdPaid.toLocaleString()}</span> },
    {
      key: 'actions', label: '', align: 'center', sortable: false,
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditClient(r); }}
            className="p-1 rounded hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 transition-colors"
            title="Edit client"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteClient(r); }}
            className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
            title="Delete client"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const mobileCard = (r) => (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <Link to={createPageUrl('ClientView') + `?clientId=${r.id}`} className="font-medium text-blue-400 text-sm">{r.name}</Link>
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${BILLING_COLORS[r.billingType] || 'bg-slate-700 text-slate-300'}`}>
            {BILLING_LABELS[r.billingType] || r.billingType}
          </span>
          <button onClick={(e) => { e.stopPropagation(); setEditClient(r); }} className="p-1 rounded hover:bg-blue-500/20 text-slate-500 hover:text-blue-400" title="Edit client">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteClient(r); }} className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400" title="Delete client">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div><span className="text-slate-500">Leads</span><p className="text-slate-300 font-medium">{r.mtdLeads}</p></div>
        <div><span className="text-slate-500">Booked</span><p className="text-slate-300 font-medium">{r.mtdBooked}</p></div>
        <div><span className="text-slate-500">Showed</span><p className="text-slate-300 font-medium">{r.mtdShowed}</p></div>
        <div><span className="text-slate-500">Ad Spend</span><p className="text-slate-300 font-medium">${r.mtdSpend.toLocaleString()}</p></div>
        <div><span className="text-slate-500">Billed</span><p className="text-green-400 font-medium">${r.mtdBilled.toLocaleString()}</p></div>
        <div><span className="text-slate-500">Collected</span><p className="text-emerald-400 font-medium">${r.mtdPaid.toLocaleString()}</p></div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatedTable
        columns={columns}
        data={rows}
        title="Client Overview (MTD)"
        titleRight={
          <Link to={createPageUrl('ClientManagement')} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">
            + Add Client
          </Link>
        }
        emptyMessage="No active clients"
        initialSort={{ key: 'mtdBilled', direction: 'desc' }}
        mobileCardRender={mobileCard}
      />
      <DeleteClientDialog
        client={deleteClient}
        open={!!deleteClient}
        onOpenChange={(open) => { if (!open) setDeleteClient(null); }}
        onDeleted={onRefresh}
      />
      {editClient && (
        <EditClientModal
          client={editClient}
          open={!!editClient}
          onOpenChange={(open) => { if (!open) setEditClient(null); }}
          onSaved={() => { setEditClient(null); onRefresh?.(); }}
        />
      )}
    </>
  );
}