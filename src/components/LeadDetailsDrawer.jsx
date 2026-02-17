import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, Calendar, DollarSign, Clock, Briefcase, Ruler, FileText, X, Pencil, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

const DISPOSITION_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', bg: 'bg-blue-100 text-blue-800 border-blue-300', activeBg: 'bg-blue-600 text-white' },
  { value: 'showed', label: 'Showed', bg: 'bg-green-100 text-green-800 border-green-300', activeBg: 'bg-green-600 text-white' },
  { value: 'cancelled', label: 'Cancelled', bg: 'bg-red-100 text-red-800 border-red-300', activeBg: 'bg-red-600 text-white' },
  { value: 'rescheduled', label: 'Rescheduled', bg: 'bg-purple-100 text-purple-800 border-purple-300', activeBg: 'bg-purple-600 text-white' },
];

const OUTCOME_OPTIONS = [
  { value: 'pending', label: 'Pending', bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', activeBg: 'bg-yellow-500 text-white' },
  { value: 'sold', label: 'Sold', bg: 'bg-green-100 text-green-800 border-green-300', activeBg: 'bg-green-600 text-white' },
  { value: 'lost', label: 'Lost', bg: 'bg-red-100 text-red-800 border-red-300', activeBg: 'bg-red-600 text-white' },
];

function InfoRow({ icon: Icon, label, value, iconColor = 'text-gray-400', editing, editValue, onEditChange, type = 'text' }) {
  if (!editing && !value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className={`w-4 h-4 mt-0.5 ${iconColor}`} />
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        {editing ? (
          <input
            type={type}
            value={editValue || ''}
            onChange={(e) => onEditChange(e.target.value)}
            className="mt-0.5 w-full text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-sm font-medium text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function LeadDetailsDrawer({ leadId, open, onOpenChange, onLeadUpdated }) {
  const queryClient = useQueryClient();

  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ id: leadId });
      return leads[0];
    },
    enabled: !!leadId && open,
  });

  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [dateSold, setDateSold] = useState('');

  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (lead) {
      setEditData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        appointment_date: lead.appointment_date ? lead.appointment_date.slice(0, 16) : '',
        date_appointment_set: lead.date_appointment_set ? lead.date_appointment_set.slice(0, 16) : '',
        lead_received_date: lead.lead_received_date ? lead.lead_received_date.slice(0, 16) : '',
        project_type: lead.project_type || '',
        project_size: lead.project_size || '',
        budget_range: lead.budget_range || '',
        timeline: lead.timeline || '',
        sale_amount: lead.sale_amount || '',
        date_sold: lead.date_sold || '',
        notes: lead.notes || '',
      });
      setEditing(false);
    }
  }, [lead]);

  const handleSaveEdits = async () => {
    const updates = { ...editData };
    if (updates.appointment_date) updates.appointment_date = new Date(updates.appointment_date).toISOString();
    else delete updates.appointment_date;
    if (updates.date_appointment_set) updates.date_appointment_set = new Date(updates.date_appointment_set).toISOString();
    else delete updates.date_appointment_set;
    if (updates.lead_received_date) updates.lead_received_date = new Date(updates.lead_received_date).toISOString();
    else delete updates.lead_received_date;
    if (updates.sale_amount) updates.sale_amount = parseFloat(updates.sale_amount);
    else delete updates.sale_amount;
    if (!updates.date_sold) delete updates.date_sold;

    await base44.entities.Lead.update(lead.id, updates);
    toast.success('Lead updated');
    setEditing(false);
    setShowConfirm(false);
    queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    if (onLeadUpdated) onLeadUpdated();
  };

  const handleDispositionChange = async (newDisposition) => {
    if (!lead) return;
    await base44.entities.Lead.update(lead.id, { disposition: newDisposition });
    queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    if (onLeadUpdated) onLeadUpdated();
  };

  const handleOutcomeChange = async (newOutcome) => {
    if (!lead) return;
    if (newOutcome === 'sold' || newOutcome === 'lost') {
      setSaleAmount(lead.sale_amount || '');
      setDateSold('');
      setShowSaleForm(newOutcome);
      return;
    }
    await base44.entities.Lead.update(lead.id, { outcome: newOutcome });
    queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    if (onLeadUpdated) onLeadUpdated();
  };

  const handleSaveSaleForm = async () => {
    if (!saleAmount) {
      toast.error('Please enter the sale amount');
      return;
    }
    if (showSaleForm === 'sold' && !dateSold) {
      toast.error('Please enter the date sold');
      return;
    }
    const updates = { outcome: showSaleForm, sale_amount: parseFloat(saleAmount) };
    if (showSaleForm === 'sold' && dateSold) updates.date_sold = dateSold;
    await base44.entities.Lead.update(lead.id, updates);
    if (showSaleForm === 'sold') {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#22c55e', '#10b981', '#059669', '#FFD700', '#FFA500'] });
      toast.success('🎉 Sale recorded! Great job!', { duration: 4000 });
    }
    setShowSaleForm(false);
    setSaleAmount('');
    setDateSold('');
    queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    if (onLeadUpdated) onLeadUpdated();
  };

  const currentDisposition = lead?.disposition || 'scheduled';
  const currentOutcome = lead?.outcome || 'pending';

  // Speed to lead
  const speedToLead = lead?.speed_to_lead_minutes != null
    ? (lead.speed_to_lead_minutes < 60 ? `${lead.speed_to_lead_minutes} min` : `${(lead.speed_to_lead_minutes / 60).toFixed(1)} hrs`)
    : null;

  // Days since lead received
  const daysSinceReceived = lead?.lead_received_date
    ? Math.floor((new Date() - new Date(lead.lead_received_date)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {!lead ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b border-gray-200 bg-gray-50">
              <SheetTitle className="text-xl font-bold">{lead.name}</SheetTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  lead.disposition === 'showed' ? 'bg-green-100 text-green-800' :
                  lead.disposition === 'cancelled' ? 'bg-red-100 text-red-800' :
                  lead.disposition === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {currentDisposition}
                </span>
                {lead.outcome && lead.outcome !== 'pending' && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lead.outcome === 'sold' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {lead.outcome}
                  </span>
                )}
                {lead.sale_amount && (
                  <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                    ${lead.sale_amount.toLocaleString()}
                  </span>
                )}
              </div>
            </SheetHeader>

            <div className="p-6 space-y-6">
              {/* Disposition buttons */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Disposition</h3>
                <div className="grid grid-cols-2 gap-2">
                  {DISPOSITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleDispositionChange(opt.value)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                        currentDisposition === opt.value
                          ? opt.activeBg + ' border-transparent shadow-sm'
                          : opt.bg + ' hover:opacity-80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outcome buttons */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Outcome</h3>
                <div className="grid grid-cols-3 gap-2">
                  {OUTCOME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleOutcomeChange(opt.value)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                        currentOutcome === opt.value
                          ? opt.activeBg + ' border-transparent shadow-sm'
                          : opt.bg + ' hover:opacity-80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {showSaleForm && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                    {showSaleForm === 'sold' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date Sold*</label>
                        <input
                          type="date"
                          value={dateSold}
                          onChange={(e) => setDateSold(e.target.value)}
                          className="text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sale Amount*</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-700">$</span>
                        <input
                          type="number"
                          value={saleAmount}
                          onChange={(e) => setSaleAmount(e.target.value)}
                          className="text-sm px-3 py-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white font-medium"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveSaleForm} className="text-xs px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">Save</button>
                      <button onClick={() => setShowSaleForm(false)} className="text-xs px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium">Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contact</h3>
                <div className="space-y-3">
                  <InfoRow icon={Mail} label="Email" value={lead.email} editing={editing} editValue={editData.email} onEditChange={(v) => setEditData(d => ({...d, email: v}))} type="email" />
                  <InfoRow icon={Phone} label="Phone" value={lead.phone} editing={editing} editValue={editData.phone} onEditChange={(v) => setEditData(d => ({...d, phone: v}))} type="tel" />
                </div>
              </div>

              {/* Appointment */}
              <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Appointment</h3>
                  <div className="space-y-3">
                    <InfoRow icon={Calendar} label="Appointment Date" value={lead.appointment_date ? new Date(lead.appointment_date).toLocaleString() : null} editing={editing} editValue={editData.appointment_date} onEditChange={(v) => setEditData(d => ({...d, appointment_date: v}))} type="datetime-local" />
                    <InfoRow icon={Calendar} label="Date Appointment Set" value={lead.date_appointment_set ? new Date(lead.date_appointment_set).toLocaleString() : null} editing={editing} editValue={editData.date_appointment_set} onEditChange={(v) => setEditData(d => ({...d, date_appointment_set: v}))} type="datetime-local" />
                  </div>
                </div>

              {/* Lead Timing */}
              {(lead.lead_received_date || speedToLead || editing) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Lead Timing</h3>
                  <div className="space-y-3">
                    <InfoRow icon={Calendar} label="Lead Received" value={lead.lead_received_date ? new Date(lead.lead_received_date).toLocaleString() : null} editing={editing} editValue={editData.lead_received_date} onEditChange={(v) => setEditData(d => ({...d, lead_received_date: v}))} type="datetime-local" />
                    {!editing && <InfoRow icon={Clock} label="Speed to Lead" value={speedToLead} iconColor="text-orange-500" />}
                    {!editing && <InfoRow icon={Clock} label="Days Since Received" value={daysSinceReceived != null ? `${daysSinceReceived} days` : null} />}
                  </div>
                </div>
              )}

              {/* Project Details */}
              {(lead.project_type || lead.project_size || lead.budget_range || lead.timeline || editing) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Project Details</h3>
                  <div className="space-y-3">
                    <InfoRow icon={Briefcase} label="Project Type" value={lead.project_type} editing={editing} editValue={editData.project_type} onEditChange={(v) => setEditData(d => ({...d, project_type: v}))} />
                    <InfoRow icon={Ruler} label="Project Size" value={lead.project_size} editing={editing} editValue={editData.project_size} onEditChange={(v) => setEditData(d => ({...d, project_size: v}))} />
                    <InfoRow icon={DollarSign} label="Budget Range" value={lead.budget_range} iconColor="text-green-500" editing={editing} editValue={editData.budget_range} onEditChange={(v) => setEditData(d => ({...d, budget_range: v}))} />
                    <InfoRow icon={Clock} label="Timeline" value={lead.timeline} editing={editing} editValue={editData.timeline} onEditChange={(v) => setEditData(d => ({...d, timeline: v}))} />
                  </div>
                </div>
              )}

              {/* Sale Information */}
              {(lead.sale_amount || lead.date_sold || editing) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Sale Information</h3>
                  <div className="space-y-3">
                    <InfoRow icon={DollarSign} label="Sale Amount" value={lead.sale_amount ? `$${lead.sale_amount.toLocaleString()}` : null} iconColor="text-green-600" editing={editing} editValue={editData.sale_amount} onEditChange={(v) => setEditData(d => ({...d, sale_amount: v}))} type="number" />
                    <InfoRow icon={Calendar} label="Date Sold" value={lead.date_sold ? new Date(lead.date_sold).toLocaleDateString() : null} editing={editing} editValue={editData.date_sold} onEditChange={(v) => setEditData(d => ({...d, date_sold: v}))} type="date" />
                  </div>
                </div>
              )}

              {/* Notes */}
              {(lead.notes || editing) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Notes</h3>
                  {editing ? (
                    <textarea
                      value={editData.notes}
                      onChange={(e) => setEditData(d => ({...d, notes: e.target.value}))}
                      className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Edit / Save buttons at bottom */}
              <div className="pt-4 border-t border-gray-200">
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="w-full px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit Lead Details
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setShowConfirm(true)} className="flex-1 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                    <button onClick={() => { setEditing(false); setEditData({ name: lead.name || '', email: lead.email || '', phone: lead.phone || '', appointment_date: lead.appointment_date ? lead.appointment_date.slice(0, 16) : '', date_appointment_set: lead.date_appointment_set ? lead.date_appointment_set.slice(0, 16) : '', lead_received_date: lead.lead_received_date ? lead.lead_received_date.slice(0, 16) : '', project_type: lead.project_type || '', project_size: lead.project_size || '', budget_range: lead.budget_range || '', timeline: lead.timeline || '', sale_amount: lead.sale_amount || '', date_sold: lead.date_sold || '', notes: lead.notes || '' }); }} className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200">
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Created: {new Date(lead.created_date).toLocaleDateString()}</span>
                  {lead.updated_date && <span>Updated: {new Date(lead.updated_date).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update this lead's information. This action will overwrite the existing data. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdits}>Yes, Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}