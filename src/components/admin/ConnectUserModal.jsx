import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader } from 'lucide-react';

export default function ConnectUserModal({ open, onOpenChange, user, employees, clients, onConnected }) {
  const [connectType, setConnectType] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [linking, setLinking] = useState(false);

  const availableRecords = useMemo(() => {
    if (connectType === 'employee') {
      return employees.filter(e => !e.user_id);
    } else if (connectType === 'client') {
      return clients.filter(c => !c.user_id);
    }
    return [];
  }, [connectType, employees, clients]);

  const handleConnect = async () => {
    if (!selectedId || !user) return;
    
    setLinking(true);
    try {
      const payload = connectType === 'employee' 
        ? { user_id: user.id, employee_id: selectedId }
        : { user_id: user.id, client_id: selectedId };
      
      const res = await base44.functions.invoke('linkUserToEmployee', payload);
      
      if (res.data.success) {
        toast({ 
          title: 'Connected', 
          description: `User connected to ${connectType} successfully`,
          variant: 'success'
        });
        onOpenChange(false);
        setConnectType(null);
        setSelectedId('');
        if (onConnected) onConnected();
      }
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to connect',
        variant: 'destructive'
      });
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Connect {user?.full_name} to Employee or Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!connectType ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConnectType('employee')}
                className="px-4 py-3 rounded-lg border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 font-medium transition-colors"
              >
                Connect to Employee
              </button>
              <button
                onClick={() => setConnectType('client')}
                className="px-4 py-3 rounded-lg border border-green-500/50 text-green-400 hover:bg-green-500/10 font-medium transition-colors"
              >
                Connect to Client
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setConnectType(null); setSelectedId(''); }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  ← Back
                </button>
                <span className="text-sm font-medium">
                  {connectType === 'employee' ? 'Select Employee' : 'Select Client'}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-700 rounded-lg p-3">
                {availableRecords.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No available {connectType}s without user IDs
                  </p>
                ) : (
                  availableRecords.map(record => (
                    <button
                      key={record.id}
                      onClick={() => setSelectedId(record.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedId === record.id
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div>{record.full_name || record.name}</div>
                      <div className="text-xs text-slate-500">{record.email}</div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setConnectType(null); setSelectedId(''); }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={!selectedId || linking}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {linking && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  Connect
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}