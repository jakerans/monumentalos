import React, { useState } from 'react';
import { Calendar, Check, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function BookAppointmentModal({ lead, bookingLink, open, onOpenChange, onBook }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setDate('');
    setTime('');
    setNotes('');
    onOpenChange(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) return;
    setLoading(true);
    const appointmentDate = new Date(`${date}T${time}`).toISOString();
    await onBook(lead.id, appointmentDate, notes.trim() || undefined);
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

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
                  placeholder="Project details, conversation notes..."
                />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400" placeholder="Project details, conversation notes..." />
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