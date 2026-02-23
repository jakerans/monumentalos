import React, { useState, useMemo } from 'react';
import { Calendar, Check, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DEFAULT_SIZES = ['Partial Project', 'Full Project'];
const DEFAULT_TYPES = {
  painting: ['Interior', 'Exterior', 'Cabinets'],
  epoxy: ['Garage Floor', 'Basement', 'Commercial'],
  kitchen_bath: ['Kitchen', 'Bath', 'Kitchen & Bath'],
  reno: ['Full Home', 'Addition', 'Basement', 'Room Remodel'],
};

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

export default function BookAppointmentModal({ lead, bookingLink, clientIndustries, open, onOpenChange, onBook }) {
  const { data: settingsData } = useQuery({
    queryKey: ['lead-field-options-global'],
    queryFn: async () => {
      const results = await base44.entities.CompanySettings.filter({ key: 'lead_options' });
      return results[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { typesByIndustry, sizes } = useMemo(() => {
    const typesByIndustry = settingsData?.project_types_by_industry && Object.keys(settingsData.project_types_by_industry).length
      ? { ...DEFAULT_TYPES, ...settingsData.project_types_by_industry }
      : DEFAULT_TYPES;
    const sizes = settingsData?.project_sizes?.length ? settingsData.project_sizes : DEFAULT_SIZES;
    return { typesByIndustry, sizes };
  }, [settingsData]);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [projectTypes, setProjectTypes] = useState([]);
  const [projectSize, setProjectSize] = useState('');
  const [loading, setLoading] = useState(false);

  const projectTypeOptions = useMemo(() => {
    return getProjectTypesForIndustries(clientIndustries);
  }, [clientIndustries]);

  const handleClose = () => {
    setDate('');
    setTime('');
    setProjectTypes([]);
    setProjectSize('');
    onOpenChange(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) return;
    setLoading(true);
    const appointmentDate = new Date(`${date}T${time}`).toISOString();
    await onBook(lead.id, appointmentDate, projectTypes.length > 0 ? projectTypes.join(', ') : undefined, projectSize || undefined);
    setLoading(false);
    handleClose();
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={bookingLink ? 'sm:max-w-4xl' : 'sm:max-w-md'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Book Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-gray-900">{lead.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{lead.phone} • {lead.email}</p>
        </div>

        {bookingLink ? (
          <form onSubmit={handleSubmit} className="flex gap-4" style={{ minHeight: '480px' }}>
            {/* Left: booking widget iframe */}
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src={bookingLink}
                className="w-full h-full border-0"
                title="Booking Calendar"
              />
            </div>

            {/* Right: appointment details form */}
            <div className="w-64 flex-shrink-0 flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Appointment Details</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type(s)</label>
                <div className="flex flex-wrap gap-1.5">
                  {projectTypeOptions.map(opt => {
                    const selected = projectTypes.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setProjectTypes(projectTypes.filter(v => v !== opt.value));
                          } else {
                            setProjectTypes([...projectTypes, opt.value]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Size</label>
                <select
                  value={projectSize}
                  onChange={(e) => setProjectSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select size...</option>
                  {sizes.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                <p className="text-[10px] text-gray-400">Date Set: <span className="text-gray-600">{new Date().toLocaleDateString()}</span></p>
              </div>

              <button
                type="submit"
                disabled={loading || !date || !time}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {loading ? 'Saving...' : 'Confirm Booking'}
              </button>

              <div className="flex gap-2">
                <a
                  href={bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs text-center transition-colors flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Pop Out
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs text-center transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500">No booking link configured. Enter appointment details manually.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time *</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Type(s)</label>
              <div className="flex flex-wrap gap-1.5">
                {projectTypeOptions.map(opt => {
                  const selected = projectTypes.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setProjectTypes(projectTypes.filter(v => v !== opt.value));
                        } else {
                          setProjectTypes([...projectTypes, opt.value]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Size</label>
              <select
                value={projectSize}
                onChange={(e) => setProjectSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select size...</option>
                {sizes.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={loading || !date || !time} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> {loading ? 'Saving...' : 'Confirm Booking'}
              </button>
              <button type="button" onClick={handleClose} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">Cancel</button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}