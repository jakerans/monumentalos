import React, { useState } from 'react';
import { Ban } from 'lucide-react';
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

export default function DisqualifyModal({ lead, open, onOpenChange, onDisqualify }) {
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!reason) return;
    onDisqualify(lead.id, reason);
    handleClose();
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-600" />
            Disqualify — {lead.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Select DQ Reason:</p>
          <div className="space-y-2">
            {DQ_REASONS.map(r => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`w-full px-3 py-2.5 text-sm text-left rounded-lg border transition-all ${
                  reason === r.value
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
              onClick={handleConfirm}
              disabled={!reason}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50 transition-colors"
            >
              Confirm DQ
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}