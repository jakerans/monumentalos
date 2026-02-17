import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Filter } from 'lucide-react';
import SetterNav from '../components/setter/SetterNav';
import SetterStats from '../components/setter/SetterStats';
import PipelineColumn from '../components/setter/PipelineColumn';
import LeadDetailPanel from '../components/setter/LeadDetailPanel';
import BookAppointmentModal from '../components/setter/BookAppointmentModal';

export default function SetterDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingLead, setBookingLead] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'setter' && currentUser.role !== 'admin') {
          if (currentUser.role === 'client') navigate(createPageUrl('ClientPortal'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: leads = [], refetch } = useQuery({
    queryKey: ['setter-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const handleAction = async (action, lead) => {
    if (action === 'first_call') {
      const speedMinutes = lead.lead_received_date
        ? Math.floor((new Date() - new Date(lead.lead_received_date)) / 60000)
        : null;
      await base44.entities.Lead.update(lead.id, {
        status: 'first_call_made',
        first_call_made_date: new Date().toISOString(),
        ...(speedMinutes != null ? { speed_to_lead_minutes: speedMinutes } : {}),
      });
      refetch();
    } else if (action === 'book') {
      setBookingLead(lead);
      setBookingOpen(true);
    }
  };

  const handleBookAppointment = async (leadId, appointmentDate) => {
    await base44.entities.Lead.update(leadId, {
      status: 'appointment_booked',
      appointment_date: appointmentDate,
      date_appointment_set: new Date().toISOString(),
      disposition: 'scheduled',
    });
    refetch();
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  if (!user) return null;

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  // Filter leads
  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchClient = clientFilter === 'all' || l.client_id === clientFilter;
    return matchSearch && matchClient;
  });

  const newLeads = filtered.filter(l => l.status === 'new');
  const inProgressLeads = filtered.filter(l => l.status === 'first_call_made' || l.status === 'contacted');
  const bookedLeads = filtered.filter(l => l.status === 'appointment_booked');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayAppts = leads.filter(l => l.appointment_date && l.appointment_date.startsWith(todayStr));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SetterNav user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <SetterStats
          newCount={newLeads.length}
          inProgressCount={inProgressLeads.length}
          bookedCount={bookedLeads.length}
          todayCount={todayAppts.length}
        />

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pipeline Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <PipelineColumn
            title="New Leads"
            count={newLeads.length}
            color="bg-blue-500"
            leads={newLeads}
            clients={clients}
            onAction={handleAction}
            onSelect={handleSelectLead}
          />
          <PipelineColumn
            title="In Progress"
            count={inProgressLeads.length}
            color="bg-amber-500"
            leads={inProgressLeads}
            clients={clients}
            onAction={handleAction}
            onSelect={handleSelectLead}
          />
          <PipelineColumn
            title="Appointment Booked"
            count={bookedLeads.length}
            color="bg-green-500"
            leads={bookedLeads}
            clients={clients}
            onAction={handleAction}
            onSelect={handleSelectLead}
          />
        </div>
      </main>

      <LeadDetailPanel
        lead={selectedLead}
        clientName={selectedLead ? getClientName(selectedLead.client_id) : ''}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAction={handleAction}
      />

      <BookAppointmentModal
        lead={bookingLead}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onBook={handleBookAppointment}
      />
    </div>
  );
}