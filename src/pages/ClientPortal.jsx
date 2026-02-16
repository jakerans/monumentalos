import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';

export default function ClientPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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

  if (!user) return null;

  const scheduledLeads = leads.filter(l => l.disposition === 'scheduled');
  const showedLeads = leads.filter(l => l.disposition === 'showed');
  const completedLeads = leads.filter(l => l.outcome === 'sold' || l.outcome === 'lost');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Client Portal
                {user.role === 'admin' && clientInfo && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Viewing as: {clientInfo.name})
                  </span>
                )}
              </h1>
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
              <Clock className="w-5 h-5 text-gray-600" />
              <p className="text-sm font-medium text-gray-600">Completed</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{completedLeads.length}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.map((lead) => (
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
                      {lead.disposition ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.disposition === 'showed' ? 'bg-green-100 text-green-800' :
                          lead.disposition === 'cancelled' ? 'bg-red-100 text-red-800' :
                          lead.disposition === 'no_show' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {lead.disposition}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.outcome ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.outcome === 'sold' ? 'bg-green-100 text-green-800' :
                          lead.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {lead.outcome}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {!lead.disposition ? (
                          <>
                            <button
                              onClick={() => handleDisposition(lead.id, 'showed')}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Showed
                            </button>
                            <button
                              onClick={() => handleDisposition(lead.id, 'no_show')}
                              className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              No Show
                            </button>
                            <button
                              onClick={() => handleDisposition(lead.id, 'cancelled')}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Cancelled
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              const newDisp = prompt('Change disposition to (showed/no_show/cancelled/rescheduled):', lead.disposition);
                              if (newDisp && ['showed', 'no_show', 'cancelled', 'rescheduled'].includes(newDisp)) {
                                handleDisposition(lead.id, newDisp);
                              }
                            }}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Disposition
                          </button>
                        )}
                        {lead.disposition === 'showed' && !lead.outcome && (
                          <>
                            <button
                              onClick={() => {
                                const amount = prompt('Enter sale amount:');
                                if (amount) handleOutcome(lead.id, 'sold', amount);
                              }}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Sold
                            </button>
                            <button
                              onClick={() => handleOutcome(lead.id, 'lost')}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Lost
                            </button>
                          </>
                        )}
                        {lead.outcome && (
                          <button
                            onClick={() => {
                              const newOutcome = prompt('Change outcome to (sold/lost/pending):', lead.outcome);
                              if (newOutcome && ['sold', 'lost', 'pending'].includes(newOutcome)) {
                                if (newOutcome === 'sold') {
                                  const amount = prompt('Enter sale amount:', lead.sale_amount || '');
                                  if (amount) handleOutcome(lead.id, newOutcome, amount);
                                } else {
                                  handleOutcome(lead.id, newOutcome);
                                }
                              }
                            }}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Outcome
                          </button>
                        )}
                      </div>
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