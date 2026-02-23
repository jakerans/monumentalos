import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import IndustryPicker from '../shared/IndustryPicker';
import { ProjectSizeSelect } from '../shared/LeadFieldSelects';

const SOURCE_OPTIONS = [
  { value: 'form', label: 'Form' },
  { value: 'msg', label: 'MSG' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'inbound_call', label: 'Inbound Call' },
  { value: 'agency', label: 'Agency' },
];

const PROJECT_TYPES_BY_INDUSTRY = {
  painting: [
    { value: 'interior', label: 'Interior' },
    { value: 'exterior', label: 'Exterior' },
    { value: 'cabinets', label: 'Cabinets' },
    { value: 'garage_floor', label: 'Garage Floor' },
    { value: 'basement', label: 'Basement' },
    { value: 'commercial', label: 'Commercial' },
  ],
  epoxy: [
    { value: 'garage_floor', label: 'Garage Floor' },
    { value: 'basement', label: 'Basement' },
    { value: 'commercial', label: 'Commercial' },
  ],
  'kitchen_bath': [
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'bath', label: 'Bath' },
    { value: 'kitchen_bath', label: 'Kitchen & Bath' },
    { value: 'full_home', label: 'Full Home' },
  ],
  reno: [
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'bath', label: 'Bath' },
    { value: 'kitchen_bath', label: 'Kitchen & Bath' },
    { value: 'full_home', label: 'Full Home' },
    { value: 'addition', label: 'Addition' },
    { value: 'room_remodel', label: 'Room Remodel' },
  ],
};

function getProjectTypesForIndustries(industries) {
  if (!industries || industries.length === 0) {
    const all = Object.values(PROJECT_TYPES_BY_INDUSTRY).flat();
    const seen = new Set();
    return all.filter(t => { if (seen.has(t.value)) return false; seen.add(t.value); return true; });
  }
  const seen = new Set();
  const result = [];
  for (const ind of industries) {
    const key = ind.toLowerCase().replace(/[/ ]/g, '_');
    const types = PROJECT_TYPES_BY_INDUSTRY[key] || [];
    for (const t of types) {
      if (!seen.has(t.value)) { seen.add(t.value); result.push(t); }
    }
  }
  return result;
}

export default function AddLeadModal({ open, onOpenChange, clients, onAdd, userId }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    client_id: '',
    lead_source: '',
    industries: [],
    notes: '',
    project_types: [],
    project_size: '',
  });
  const [isBooked, setIsBooked] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [chatSTL, setChatSTL] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // NOTE: Leads created before this fix may have no status field.
    // To fix existing leads, update them in the database: status = 'new'
    if (!form.name || !form.client_id || !form.lead_source) return;
    setLoading(true);

    const leadData = {
      name: form.name,
      client_id: form.client_id,
      lead_source: form.lead_source,
      lead_received_date: new Date().toISOString(),
      created_date: new Date().toISOString(),
      status: 'new',
    };

    if (form.phone?.trim()) leadData.phone = form.phone.trim();
    if (form.email?.trim()) leadData.email = form.email.trim();
    if (form.notes?.trim()) leadData.notes = form.notes.trim();
    if (form.industries?.length > 0) leadData.industries = form.industries;

    if (isBooked && appointmentDate) {
      if (form.project_types.length > 0) leadData.project_type = form.project_types.join(', ');
      if (form.project_size) leadData.project_size = form.project_size;
      leadData.status = 'appointment_booked';
      leadData.appointment_date = new Date(appointmentDate).toISOString();
      leadData.date_appointment_set = new Date().toISOString();
      leadData.disposition = 'scheduled';
      if (userId) leadData.booked_by_setter_id = userId;
      if (form.lead_source === 'msg' && chatSTL) {
        leadData.speed_to_lead_minutes = parseFloat(chatSTL);
      }
    }

    try {
      await onAdd(leadData);
      setForm({ name: '', phone: '', email: '', client_id: '', lead_source: '', industries: [], notes: '', project_types: [], project_size: '' });
      setIsBooked(false);
      setAppointmentDate('');
      setChatSTL('');
      onOpenChange(false);
    } catch (err) {
      console.error('Lead create failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5" style={{color:'#D6FF03'}} />
            Add New Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white placeholder-slate-500"
              placeholder="Lead name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white placeholder-slate-500"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white placeholder-slate-500"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Client *</label>
            <select
              value={form.client_id}
              onChange={(e) => update('client_id', e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white"
            >
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Lead Source *</label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('lead_source', opt.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    form.lead_source === opt.value
                      ? 'text-black border-[#D6FF03]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  style={form.lead_source === opt.value ? {backgroundColor:'#D6FF03'} : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Industry</label>
            <IndustryPicker selected={form.industries} onChange={(v) => update('industries', v)} dark />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white placeholder-slate-500 h-16"
              placeholder="Any initial notes..."
            />
          </div>

          {/* Appointment Booked Toggle */}
          <div className="border border-slate-700 rounded-lg p-3 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsBooked(!isBooked)}
                className={`w-10 h-5 rounded-full relative transition-colors ${isBooked ? 'bg-[#D6FF03]' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isBooked ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm font-medium text-slate-300">Appointment Already Booked</span>
            </label>

            {isBooked && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Appointment Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required={isBooked}
                    className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Project Type(s)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {getProjectTypesForIndustries(form.industries).map(opt => {
                      const selected = form.project_types.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              update('project_types', form.project_types.filter(v => v !== opt.value));
                            } else {
                              update('project_types', [...form.project_types, opt.value]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                            selected
                              ? 'bg-[#D6FF03]/20 border-[#D6FF03]/50 text-[#D6FF03]'
                              : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Project Size</label>
                  <ProjectSizeSelect
                    value={form.project_size}
                    onChange={(v) => update('project_size', v)}
                  />
                </div>

                {form.lead_source === 'msg' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Chat Speed-to-Lead (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={chatSTL}
                      onChange={(e) => setChatSTL(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white placeholder-slate-500"
                      placeholder="How many minutes from first msg to booking?"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Time between lead's first message and appointment booking</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !form.name || !form.client_id || !form.lead_source || (isBooked && !appointmentDate)}
              className="flex-1 px-4 py-2.5 text-black rounded-lg font-bold text-sm disabled:opacity-50 transition-colors hover:opacity-90"
              style={{backgroundColor:'#D6FF03'}}
            >
              {loading ? 'Adding...' : isBooked ? 'Add Lead & Book' : 'Add Lead'}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium text-sm transition-colors border border-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}