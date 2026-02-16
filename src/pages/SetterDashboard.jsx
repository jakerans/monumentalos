import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Phone, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function SetterDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'setter') {
          if (currentUser.role === 'admin') navigate(createPageUrl('AdminDashboard'));
          else if (currentUser.role === 'client') navigate(createPageUrl('ClientPortal'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: leads = [], refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const handleMarkFirstCall = async (leadId) => {
    await base44.entities.Lead.update(leadId, {
      status: 'first_call_made',
      first_call_made_date: new Date().toISOString()
    });
    refetch();
  };

  const handleBookAppointment = async (leadId, appointmentDate) => {
    await base44.entities.Lead.update(leadId, {
      status: 'appointment_booked',
      appointment_date: appointmentDate,
      disposition: 'scheduled'
    });
    refetch();
  };

  if (!user) return null;

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  const newLeads = leads.filter(l => l.status === 'new');
  const contactedLeads = leads.filter(l => l.status === 'first_call_made' || l.status === 'contacted');
  const bookedLeads = leads.filter(l => l.status === 'appointment_booked');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Setter Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
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
          <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">New Leads</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{newLeads.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-900">In Progress</p>
            </div>
            <p className="text-3xl font-bold text-yellow-900">{contactedLeads.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">Booked</p>
            </div>
            <p className="text-3xl font-bold text-green-900">{bookedLeads.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Leads</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appointment</th>
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
                      {getClientName(lead.client_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{lead.email}</div>
                      <div>{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'appointment_booked' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.appointment_date ? new Date(lead.appointment_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {lead.status === 'new' && (
                          <button
                            onClick={() => handleMarkFirstCall(lead.id)}
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Mark First Call
                          </button>
                        )}
                        {(lead.status === 'first_call_made' || lead.status === 'contacted') && !lead.appointment_date && (
                          <button
                            onClick={() => {
                              const date = prompt('Enter appointment date (YYYY-MM-DD HH:MM)');
                              if (date) handleBookAppointment(lead.id, new Date(date).toISOString());
                            }}
                            className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Book Appointment
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