import React, { useState } from 'react';
import { Phone, Calendar, XCircle, Ban } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DQ_REASONS = [
  { value: 'looking_for_work', label: 'Looking For Work' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'wrong_invalid_number', label: 'Wrong/Invalid Number' },
  { value: 'project_size', label: 'Project Size' },
  { value: 'oosa', label: 'OOSA (Out of Service Area)' },
  { value: 'client_availability', label: 'Client Availability' },
];

export default function FirstCallModal({ lead, open, onOpenChange, onResult }) {
  const [step, setStep] = useState('choose'); // choose | dq
  const [dqReason, setDqReason] = useState('');

  const handleClose = () => {
    setStep('choose');
    setDqReason('');
    onOpenChange(false);
  };

  const handleNotConnected = () => {
    onResult(lead.id, 'not_connected');
    handleClose();
  };

  const handleScheduled = () => {
    onResult(lead.id, 'scheduled');
    handleClose();
  };

  const handleDQ = () => {
    if (!dqReason) return;
    onResult(lead.id, 'disqualified', dqReason);
    handleClose();
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600" />
            First Call — {lead.name}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 rounded-lg p-3 mb-2">
          <p className="text-xs text-gray-500">Phone: <span className="font-medium text-gray-700">{lead.phone || '—'}</span></p>
        </div>

        {step === 'choose' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">What was the outcome?</p>

            <button
              onClick={handleScheduled}
              className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <Calendar className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">Scheduled</p>
                <p className="text-[11px] text-green-600">Connected — ready to book appointment</p>
              </div>
            </button>

            <button
              onClick={handleNotConnected}
              className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-left"
            >
              <XCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Not Connected</p>
                <p className="text-[11px] text-amber-600">No answer — move to In Progress</p>
              </div>
            </button>

            <button
              onClick={() => setStep('dq')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
            >
              <Ban className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">Disqualified</p>
                <p className="text-[11px] text-red-600">Lead does not qualify</p>
              </div>
            </button>
          </div>
        )}

        {step === 'dq' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Select DQ Reason:</p>
            <div className="space-y-2">
              {DQ_REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setDqReason(r.value)}
                  className={`w-full px-3 py-2.5 text-sm text-left rounded-lg border transition-all ${
                    dqReason === r.value
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleDQ}
                disabled={!dqReason}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50 transition-colors"
              >
                Confirm DQ
              </button>
              <button
                onClick={() => { setStep('choose'); setDqReason(''); }}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}