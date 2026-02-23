import React, { useState } from 'react';
import { Bug, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function BugReportWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [loading, setLoading] = useState(false);

  const pageUrl = typeof window !== 'undefined' ? window.location.pathname : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const bugReport = await base44.entities.BugReport.create({
        reporter_user_id: user?.id,
        reporter_name: user?.full_name || 'Unknown',
        reporter_role: user?.app_role || 'unknown',
        title: title.trim(),
        description: description.trim(),
        page_url: pageUrl,
        severity,
        status: 'new',
      });

      // Fire notification to admins
      base44.functions.invoke('sendAppNotification', {
        recipient_role: 'admin',
        type: 'bug_report',
        title: `🐛 Bug: ${title}`,
        message: `${user?.full_name || 'User'} (${user?.app_role}) reported: ${description.substring(0, 100)}... Severity: ${severity}`,
        source_user_id: user?.id,
        source_entity_id: bugReport?.id,
      });

      toast({ title: 'Bug report submitted — thank you!', variant: 'success' });
      setTitle('');
      setDescription('');
      setSeverity('medium');
      setOpen(false);
    } catch (error) {
      toast({ title: 'Failed to submit bug report', description: error?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors"
        title="Report a bug"
      >
        <Bug className="w-6 h-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Bug className="w-5 h-5 text-red-400" />
              Report a Bug
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the bug"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Steps to reproduce, what went wrong, etc."
                rows={4}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="bg-slate-800 rounded-lg p-2.5 border border-slate-700">
              <p className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">Page:</span> {pageUrl || 'unknown'}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Submitting...' : 'Submit Bug Report'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}