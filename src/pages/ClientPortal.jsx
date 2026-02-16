import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

export default function ClientPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [editData, setEditData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'client' && currentUser.role !== 'admin') {
          if (currentUser.role === 'setter') window.location.href = '/SetterDashboard';
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, []);

  const getClientId = () => {
    if (user?.role === 'admin') {
      return localStorage.getItem('admin_view_client_id');
    }
    return user?.client_id;
  };

  const clientId = getClientId();

  const { data: leads = [], refetch } = useQuery({
    queryKey: ['client-leads', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const allLeads = await base44.entities.Lead.filter({ client_id: clientId });
      return allLeads.filter(lead => lead.appointment_date);
    },
    enabled: !!clientId,
  });

  const { data: clientInfo } = useQuery({
    queryKey: ['client-info', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0] || null;
    },
    enabled: !!clientId,
  });

  const handleDisposition = async (leadId, disposition) => {
    await base44.entities.Lead.update(leadId, { disposition });
    refetch();
  };

  const handleOutcome = async (leadId, outcome, saleAmount = null) => {
    const updates = { outcome };
    if (outcome === 'sold' && saleAmount) {
      updates.sale_amount = parseFloat(saleAmount);
    }
    await base44.entities.Lead.update(leadId, updates);
    refetch();
  };

  const startEditing = (lead, type) => {
    setEditingLead({ id: lead.id, type });
    setEditData({
      disposition: lead.disposition || 'scheduled',
      outcome: lead.outcome || 'pending',
      sale_amount: lead.sale_amount || '',
      appointment_date: lead.appointment_date || '',
      date_sold: '',
      estimate_value: lead.sale_amount || ''
    });
  };

  const saveEdit = async () => {
    const updates = {};
    setValidationErrors({});
    
    if (editingLead.type === 'disposition') {
      updates.disposition = editData.disposition;
      if (editData.disposition === 'rescheduled') {
        if (editData.appointment_date) {
          const dateValue = editData.appointment_date.includes('T') && editData.appointment_date.length <= 16 
            ? editData.appointment_date + ':00' 
            : editData.appointment_date;
          updates.appointment_date = new Date(dateValue).toISOString();
        }
      }
    } else if (editingLead.type === 'outcome') {
      const errors = {};
      if (editData.outcome === 'sold') {
        if (!editData.date_sold) {
          errors.date_sold = true;
          toast.error('Please enter the date sold');
        }
        if (!editData.estimate_value) {
          errors.estimate_value = true;
          toast.error('Please enter the estimate value');
        }
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return;
        }
      }
      if (editData.outcome === 'lost' && !editData.estimate_value) {
        errors.estimate_value = true;
        toast.error('Please enter the estimate value');
        setValidationErrors(errors);
        return;
      }
      
      updates.outcome = editData.outcome;
      if ((editData.outcome === 'sold' || editData.outcome === 'lost') && editData.estimate_value) {
        updates.sale_amount = parseFloat(editData.estimate_value);
      }
      if (editData.outcome === 'sold' && editData.date_sold) {
        updates.date_sold = editData.date_sold;
      }
    }

    await base44.entities.Lead.update(editingLead.id, updates);
    
    // Celebration animation for sold leads
    if (editingLead.type === 'outcome' && editData.outcome === 'sold') {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#059669', '#FFD700', '#FFA500']
      });
      
      toast.success('🎉 Sale recorded! Great job!', { duration: 4000 });
    }
    
    setEditingLead(null);
    setEditData({});
    setValidationErrors({});
    refetch();
  };

  const cancelEdit = () => {
    setEditingLead(null);
    setEditData({});
    setValidationErrors({});
  };

  if (!user) return null;

  const scheduledLeads = leads.filter(l => l.disposition === 'scheduled');
  const showedLeads = leads.filter(l => l.disposition === 'showed');
  const soldLeads = leads.filter(l => l.outcome === 'sold');
  const totalSoldAmount = soldLeads.reduce((sum, lead) => sum + (lead.sale_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Client Portal</h1>
              <div className="flex gap-4">
                <Link
                  to={createPageUrl('ClientPortal')}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700"
                >
                  My Appointments
                </Link>
                <Link
                  to={createPageUrl('AppointmentHistory')}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  History
                </Link>
              </div>
              {user.role === 'admin' && clientInfo && (
                <span className="text-sm text-gray-500">
                  (Viewing as: {clientInfo.name})
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    localStorage.removeItem('admin_view_client_id');
                    navigate(createPageUrl('AdminDashboard'));
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Back to Admin
                </button>
              )}
              <span className="text-sm text-gray-600">{user.full_name}</span>
              <button
                onClick={() => base44.auth.logout()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{scheduledLeads.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-600">Showed</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{showedLeads.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-600">Sold</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{soldLeads.length}</p>
            <p className="text-sm text-green-600 font-semibold mt-1">${totalSoldAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appointment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disposition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
              {leads
                .filter(lead => 
                  (lead.disposition === 'scheduled' || lead.disposition === 'rescheduled') && 
                  (!lead.outcome || lead.outcome === 'pending')
                )
                .map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{lead.email}</div>
                      <div>{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(lead.appointment_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {editingLead?.id === lead.id && editingLead?.type === 'disposition' ? (
                        <div className="space-y-2">
                          <select
                            value={editData.disposition}
                            onChange={(e) => setEditData({...editData, disposition: e.target.value})}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rescheduled">Rescheduled</option>
                          </select>
                          {editData.disposition === 'rescheduled' && (
                            <input
                              type="datetime-local"
                              value={editData.appointment_date ? new Date(editData.appointment_date).toISOString().slice(0, 16) : ''}
                              onChange={(e) => setEditData({...editData, appointment_date: e.target.value})}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                              placeholder="New appointment date"
                            />
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(lead, 'disposition')}
                          className="text-left w-full"
                        >
                          <span className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${
                            lead.disposition === 'showed' ? 'bg-green-100 text-green-800' :
                            lead.disposition === 'cancelled' ? 'bg-red-100 text-red-800' :
                            lead.disposition === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {lead.disposition || 'scheduled'}
                          </span>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingLead?.id === lead.id && editingLead?.type === 'outcome' ? (
                        <div className="space-y-2">
                          <select
                            value={editData.outcome}
                            onChange={(e) => setEditData({...editData, outcome: e.target.value})}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          >
                            <option value="pending">Pending</option>
                            <option value="sold">Sold</option>
                            <option value="lost">Lost</option>
                          </select>
                          {(editData.outcome === 'sold' || editData.outcome === 'lost') && (
                            <div className="bg-gray-50 rounded-md p-3 space-y-3 border border-gray-200">
                              {editData.outcome === 'sold' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Date Sold*</label>
                                  <input
                                    type="date"
                                    value={editData.date_sold}
                                    onChange={(e) => {
                                      setEditData({...editData, date_sold: e.target.value});
                                      setValidationErrors({...validationErrors, date_sold: false});
                                    }}
                                    className={`text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white ${
                                      validationErrors.date_sold ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                  />
                                  {validationErrors.date_sold && (
                                    <p className="text-xs text-red-600 mt-1">Date sold is required</p>
                                  )}
                                </div>
                              )}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Sale Amount*</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-700">$</span>
                                  <input
                                    type="number"
                                    value={editData.estimate_value}
                                    onChange={(e) => {
                                      setEditData({...editData, estimate_value: e.target.value});
                                      setValidationErrors({...validationErrors, estimate_value: false});
                                    }}
                                    className={`text-sm px-3 py-2 pl-7 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white font-medium ${
                                      validationErrors.estimate_value ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0.00"
                                  />
                                </div>
                                {validationErrors.estimate_value && (
                                  <p className="text-xs text-red-600 mt-1">Sale amount is required</p>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(lead, 'outcome')}
                          className="text-left w-full"
                        >
                          <div className="inline-flex flex-col gap-1.5">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${
                              lead.outcome === 'sold' ? 'bg-green-100 text-green-800' :
                              lead.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {lead.outcome || 'pending'}
                            </span>
                            {lead.sale_amount && (
                              <div className="bg-green-50 border border-green-200 rounded-md px-2 py-1">
                                <span className="text-sm font-semibold text-green-700">
                                  ${lead.sale_amount.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}