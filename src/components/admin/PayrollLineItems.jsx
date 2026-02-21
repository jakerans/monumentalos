import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'cogs', label: 'COGS' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'distribution', label: 'Distribution' },
];

const CATEGORY_OPTIONS = [
  { value: 'payroll', label: 'Payroll' },
  { value: 'other', label: 'Other' },
  { value: 'processing_fee', label: 'Processing Fee' },
  { value: 'software', label: 'Software' },
  { value: 'office', label: 'Office' },
  { value: 'contractor', label: 'Contractor' },
];

function TypeBadge({ type }) {
  const colors = {
    cogs: 'bg-orange-500/15 text-orange-400',
    overhead: 'bg-blue-500/15 text-blue-400',
    distribution: 'bg-purple-500/15 text-purple-400',
  };
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${colors[type] || colors.overhead}`}>
      {type}
    </span>
  );
}

function LineItemRow({ item, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const startEdit = () => {
    setDraft({ description: item.description, amount: item.amount, expense_type: item.expense_type, category: item.category });
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate(item.id, {
      description: draft.description,
      amount: parseFloat(draft.amount) || 0,
      expense_type: draft.expense_type,
      category: draft.category,
    });
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  if (editing) {
    return (
      <div className="bg-slate-800 rounded-lg p-3 border border-[#D6FF03]/30 space-y-2">
        <input
          value={draft.description}
          onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
          className="w-full text-sm px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
          placeholder="Description"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              value={draft.amount}
              onChange={(e) => setDraft(d => ({ ...d, amount: e.target.value }))}
              className="w-full text-sm pl-6 pr-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-[#D6FF03]/50"
            />
          </div>
          <select
            value={draft.expense_type}
            onChange={(e) => setDraft(d => ({ ...d, expense_type: e.target.value }))}
            className="text-xs px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none"
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={draft.category}
            onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
            className="text-xs px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none"
          >
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-1.5">
          <button onClick={cancelEdit} className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded border border-slate-600 hover:bg-slate-700">
            <X className="w-3 h-3" />
          </button>
          <button onClick={saveEdit} className="px-2.5 py-1 text-xs font-bold text-black rounded hover:opacity-90" style={{ backgroundColor: '#D6FF03' }}>
            <Check className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return null; // Only used inside expanded breakdown via editing
}

const fmt = (n) => parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PersonCard({ name, items, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  const salaryItems = items.filter(i => i.type === 'base_pay');
  const bonusItems = items.filter(i => i.type === 'perf_pay' || i.type === 'setter_bonus' || i.type === 'loot_prizes');

  const salaryTotal = salaryItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const bonusTotal = bonusItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const grandTotal = salaryTotal + bonusTotal;

  return (
    <div className="bg-slate-800/70 rounded-lg border border-slate-700/50 group">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-white">{name}</span>
        <span className="text-sm font-bold text-white">${fmt(grandTotal)}</span>
      </div>

      {/* Sub-rows */}
      <div className="px-3 pb-2 space-y-1">
        {/* Base Pay row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">💼 Base Pay</span>
            <span className="text-[10px] text-slate-500 italic">→ Salary in Gusto</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white font-medium">${fmt(salaryTotal)}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {salaryItems.map(si => (
                <React.Fragment key={si.id}>
                  <button onClick={() => setEditingItemId(editingItemId === si.id ? null : si.id)} className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => onDelete(si.id)} className="p-0.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Inline edit for salary items */}
        {salaryItems.map(si => editingItemId === si.id && (
          <LineItemRow key={`edit_${si.id}`} item={si} onUpdate={(id, u) => { onUpdate(id, u); setEditingItemId(null); }} onDelete={onDelete} />
        ))}

        {/* Bonus row */}
        {bonusTotal > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">🎁 Bonuses</span>
              <span className="text-[10px] text-slate-500 italic">→ Bonus in Gusto</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: '#D6FF03' }}>${fmt(bonusTotal)}</span>
            </div>
          </div>
        )}

        {/* Toggle breakdown */}
        {bonusItems.length > 0 && (
          <div
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer pt-0.5 select-none"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'hide breakdown' : 'see breakdown'}
          </div>
        )}

        {/* Expanded breakdown */}
        {expanded && (
          <div className="pl-2 pt-1 space-y-1.5 border-l border-slate-700/50 ml-1">
            {bonusItems.map(bi => (
              <div key={bi.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TypeBadge type={bi.expense_type} />
                    <span className="text-[11px] text-slate-300 truncate">{bi.description}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-white font-medium">${fmt(bi.amount)}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingItemId(editingItemId === bi.id ? null : bi.id)} className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDelete(bi.id)} className="p-0.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline edit */}
                {editingItemId === bi.id && (
                  <LineItemRow item={bi} onUpdate={(id, u) => { onUpdate(id, u); setEditingItemId(null); }} onDelete={onDelete} />
                )}

                {/* Sub-breakdown */}
                {bi.breakdown && bi.breakdown.length > 0 && (
                  <div className="pl-4 pt-0.5 space-y-0.5">
                    {bi.breakdown.map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">{b.label}</span>
                        <span className="text-[10px] text-slate-500">${fmt(b.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GustoSummaryBox({ grouped }) {
  const people = grouped
    .map(g => {
      const bonusTotal = g.items
        .filter(i => i.type === 'perf_pay' || i.type === 'setter_bonus' || i.type === 'loot_prizes')
        .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      const salaryTotal = g.items
        .filter(i => i.type === 'base_pay')
        .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      return { name: g.name, salaryTotal, bonusTotal };
    })
    .filter(p => p.bonusTotal > 0);

  if (people.length === 0) return null;

  return (
    <div data-tour="gusto-summary-box" className="border-l-2 border-[#D6FF03] bg-slate-800/60 rounded-lg px-4 py-3 mb-4">
      <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">Gusto Entry Summary</p>
      <div className="space-y-0.5">
        {people.map(p => (
          <p key={p.name} className="text-xs text-slate-300">
            {p.name} — Salary: ${fmt(p.salaryTotal)} | Bonus: ${fmt(p.bonusTotal)}
          </p>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 italic mt-2">Enter salary and bonus as separate fields in Gusto.</p>
    </div>
  );
}

export default function PayrollLineItems({ lineItems, setLineItems }) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ description: '', amount: '', expense_type: 'overhead', category: 'payroll', vendor: '' });

  const handleUpdate = (id, updates) => {
    setLineItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const handleDelete = (id) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  const handleAddItem = () => {
    if (!newItem.description || !newItem.amount) return;
    const item = {
      id: `custom_${Date.now()}`,
      type: 'custom',
      employee_name: newItem.vendor || '',
      vendor: newItem.vendor || '',
      description: newItem.description,
      amount: parseFloat(newItem.amount) || 0,
      expense_type: newItem.expense_type,
      category: newItem.category,
      editable: true,
    };
    setLineItems(prev => [...prev, item]);
    setNewItem({ description: '', amount: '', expense_type: 'overhead', category: 'payroll', vendor: '' });
    setAdding(false);
  };

  const { grouped, ungrouped } = useMemo(() => {
    const byName = {};
    const noName = [];
    for (const item of lineItems) {
      if (item.employee_name && item.type !== 'custom') {
        if (!byName[item.employee_name]) byName[item.employee_name] = [];
        byName[item.employee_name].push(item);
      } else {
        noName.push(item);
      }
    }
    const grouped = Object.entries(byName).map(([name, items]) => ({ name, items }));
    grouped.sort((a, b) => a.name.localeCompare(b.name));
    return { grouped, ungrouped: noName };
  }, [lineItems]);

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{lineItems.length} line item{lineItems.length !== 1 ? 's' : ''} — hover to edit or remove</p>
        <button
          onClick={() => setAdding(!adding)}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
      </div>

      {adding && (
        <div className="bg-slate-800/80 rounded-lg p-3 border border-emerald-500/30 space-y-2">
          <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">New Custom Item</p>
          <input
            value={newItem.description}
            onChange={(e) => setNewItem(d => ({ ...d, description: e.target.value }))}
            className="w-full text-sm px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            placeholder="Description (e.g. Employer Tax - Federal)"
          />
          <input
            value={newItem.vendor}
            onChange={(e) => setNewItem(d => ({ ...d, vendor: e.target.value }))}
            className="w-full text-sm px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            placeholder="Vendor (optional)"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={newItem.amount}
                onChange={(e) => setNewItem(d => ({ ...d, amount: e.target.value }))}
                className="w-full text-sm pl-6 pr-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                placeholder="0.00"
              />
            </div>
            <select
              value={newItem.expense_type}
              onChange={(e) => setNewItem(d => ({ ...d, expense_type: e.target.value }))}
              className="text-xs px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none"
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem(d => ({ ...d, category: e.target.value }))}
              className="text-xs px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none"
            >
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-1.5">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded border border-slate-600 hover:bg-slate-700">Cancel</button>
            <button
              onClick={handleAddItem}
              disabled={!newItem.description || !newItem.amount}
              className="px-3 py-1.5 text-xs font-bold text-black rounded hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#D6FF03' }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      <GustoSummaryBox grouped={grouped} />

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {grouped.map((g, idx) => (
          <div key={g.name} {...(idx === 0 ? { 'data-tour': 'person-card' } : {})}>
            <PersonCard name={g.name} items={g.items} onUpdate={handleUpdate} onDelete={handleDelete} />
          </div>
        ))}

        {/* Ungrouped / custom items */}
        {ungrouped.map(item => (
          <div key={item.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2.5 group hover:bg-slate-750">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-xs text-slate-300 truncate">{item.description}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Custom Item</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <TypeBadge type={item.expense_type} />
              <span className="text-sm font-medium text-white min-w-[70px] text-right">${fmt(item.amount)}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {lineItems.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500">
            No line items. Add custom items using the button above.
          </div>
        )}
      </div>
    </div>
  );
}