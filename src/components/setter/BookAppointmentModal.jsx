import React, { useState } from 'react';
import { Calendar, Check, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function BookAppointmentModal({ lead, bookingLink, open, onOpenChange, onBook }) {
  const [step, setStep] = useState('booking'); // 'booking' | 'details'
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setStep('booking');
    setDate('');
    setTime('');
    onOpenChange(false);
  };

  const handleApptBooked = () => {
    setStep('details');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) return;
    setLoading(true);
    const appointmentDate = new Date(`${date}T${time}`).toISOString();
    await onBook(lead.id, appointmentDate);
    setLoading(false);
    handleClose();
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === 'booking' && bookingLink ? 'sm:max-w-3xl' : 'sm:max-w-md'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            {step === 'booking' ? 'Book Appointment' : 'Confirm Appointment Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-gray-900">{lead.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{lead.phone} • {lead.email}</p>
        </div>

        {step === 'booking' && (
          <div className="space-y-4">
            {bookingLink ? (
              <>
                <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '450px' }}>
                  <iframe
                    src={bookingLink}
                    className="w-full h-full border-0"
                    title="Booking Calendar"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApptBooked}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Appt Booked
                  </button>
                  <a
                    href={bookingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-4">No booking link configured for this client. Enter appointment details manually.</p>
                <button
                  onClick={handleApptBooked}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
                >
                  Enter Appointment Details
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-gray-500">Enter the appointment details for the CRM.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500">Date Appointment Set: <span className="font-medium text-gray-700">{new Date().toLocaleString()}</span></p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Confirm & Save'}
              </button>
              <button
                type="button"
                onClick={() => setStep('booking')}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}