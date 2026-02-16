import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, User, Mail, Phone, Calendar, DollarSign, FileText } from 'lucide-react';

export default function LeadDetails() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('leadId');
  const returnTo = urlParams.get('returnTo') || 'ClientPortal';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'client' && currentUser.role !== 'admin') {
          navigate(createPageUrl('SetterDashboard'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ id: leadId });
      return leads[0];
    },
    enabled: !!leadId,
  });

  if (!user || !lead) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Lead Details</h1>
            </div>
            <div className="flex items-center gap-4">
              {user.role === 'admin' && (
                <button
                  onClick={() => navigate(createPageUrl('AdminDashboard'))}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to={createPageUrl(returnTo)}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {returnTo === 'AppointmentHistory' ? 'History' : 'My Appointments'}
        </Link>

        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900">{lead.name}</h2>
            <div className="flex gap-2 mt-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                lead.disposition === 'showed' ? 'bg-green-100 text-green-800' :
                lead.disposition === 'cancelled' ? 'bg-red-100 text-red-800' :
                lead.disposition === 'rescheduled' ? 'bg-purple-100 text-purple-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {lead.disposition || 'scheduled'}
              </span>
              {lead.outcome && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  lead.outcome === 'sold' ? 'bg-green-100 text-green-800' :
                  lead.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {lead.outcome}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{lead.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{lead.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {lead.appointment_date && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Appointment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Appointment Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(lead.appointment_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {lead.date_appointment_set && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Date Booked</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(lead.date_appointment_set).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(lead.project_type || lead.project_size || lead.budget_range || lead.timeline) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.project_type && (
                    <div>
                      <p className="text-xs text-gray-500">Project Type</p>
                      <p className="text-sm font-medium text-gray-900">{lead.project_type}</p>
                    </div>
                  )}
                  {lead.project_size && (
                    <div>
                      <p className="text-xs text-gray-500">Project Size</p>
                      <p className="text-sm font-medium text-gray-900">{lead.project_size}</p>
                    </div>
                  )}
                  {lead.budget_range && (
                    <div>
                      <p className="text-xs text-gray-500">Budget Range</p>
                      <p className="text-sm font-medium text-gray-900">{lead.budget_range}</p>
                    </div>
                  )}
                  {lead.timeline && (
                    <div>
                      <p className="text-xs text-gray-500">Timeline</p>
                      <p className="text-sm font-medium text-gray-900">{lead.timeline}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(lead.sale_amount || lead.date_sold) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Sale Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.sale_amount && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Sale Amount</p>
                        <p className="text-lg font-bold text-green-700">
                          ${lead.sale_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {lead.date_sold && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Date Sold</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(lead.date_sold).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {lead.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Notes</h3>
                <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}