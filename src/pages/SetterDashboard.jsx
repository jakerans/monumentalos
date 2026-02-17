import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Filter, Plus, Ban } from 'lucide-react';
import SetterNav from '../components/setter/SetterNav';
import SetterStats from '../components/setter/SetterStats';
import PipelineColumn from '../components/setter/PipelineColumn';
import LeadDetailPanel from '../components/setter/LeadDetailPanel';
import BookAppointmentModal from '../components/setter/BookAppointmentModal';
import AddLeadModal from '../components/setter/AddLeadModal';
import FirstCallModal from '../components/setter/FirstCallModal';
import DisqualifyModal from '../components/setter/DisqualifyModal';

export default function SetterDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bookingLead, setBookingLead] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [firstCallLead, setFirstCallLead] = useState(null);
  const [firstCallOpen, setFirstCallOpen] = useState(false);
  const [dqLead, setDqLead] = useState(null);
  const [dqOpen, setDqOpen] = useState(false);
  const [showDQ, setShowDQ] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const appRole = currentUser.app_role;
        if (!appRole) { navigate(createPageUrl('AccountPending')); return; }
        if (appRole !== 'setter' && appRole !== 'admin') {
          if (appRole === 'client') navigate(createPageUrl('ClientPortal'));
          else if (appRole === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else if (appRole === 'onboard_admin') navigate(createPageUrl('OnboardDashboard'));
          else navigate(createPageUrl('AdminDashboard'));
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

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const getUserName = (userId) => {
    if (!userId) return null;
    const u = users.find(u => u.id === userId);
    return u?.full_name || null;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  const handleAction = (action, lead) => {
    if (action === 'first_call') {
      setFirstCallLead(lead);
      setFirstCallOpen(true);
    } else if (action === 'book') {
      setBookingLead(lead);
      setBookingOpen(true);
    } else if (action === 'disqualify') {
      setDqLead(lead);
      setDqOpen(true);
    }
  };

  const handleDisqualify = async (leadId, dqReason) => {
    await base44.entities.Lead.update(leadId, {
      status: 'disqualified',
      dq_reason: dqReason,
    });
    refetch();
  };

  const handleFirstCallResult = async (leadId, result, dqReason) => {
    const speedMinutes = (() => {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return null;
      const received = lead.lead_received_date || lead.created_date;
      // Only calc STL if this is the very first call (no first_call_made_date yet)
      if (lead.first_call_made_date) return undefined;
      return Math.floor((new Date() - new Date(received)) / 60000);
    })();

    const baseUpdates = {
      first_call_made_date: new Date().toISOString(),
      setter_id: user.id,
      ...(speedMinutes != null && speedMinutes !== undefined ? { speed_to_lead_minutes: speedMinutes } : {}),
    };

    if (result === 'scheduled') {
      // Connected & wants to schedule — open booking modal next
      await base44.entities.Lead.update(leadId, {
        ...baseUpdates,
        status: 'first_call_made',
      });
      refetch();
      const updatedLead = leads.find(l => l.id === leadId);
      if (updatedLead) {
        setBookingLead({ ...updatedLead, status: 'first_call_made' });
        setBookingOpen(true);
      }
    } else if (result === 'not_connected') {
      await base44.entities.Lead.update(leadId, {
        ...baseUpdates,
        status: 'first_call_made',
      });
      refetch();
    } else if (result === 'disqualified') {
      await base44.entities.Lead.update(leadId, {
        ...baseUpdates,
        status: 'disqualified',
        dq_reason: dqReason,
      });
      refetch();
    }
  };

  const handleBookAppointment = async (leadId, appointmentDate) => {
    await base44.entities.Lead.update(leadId, {
      status: 'appointment_booked',
      appointment_date: appointmentDate,
      date_appointment_set: new Date().toISOString(),
      disposition: 'scheduled',
      booked_by_setter_id: user.id,
    });
    refetch();
  };

  const handleAddLead = async (leadData) => {
    await base44.entities.Lead.create(leadData);
    refetch();
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  if (!user) return null;

  // Filter leads
  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchClient = clientFilter === 'all' || l.client_id === clientFilter;
    return matchSearch && matchClient;
  });

  const newLeads = filtered.filter(l => l.status === 'new');
  const inProgressLeads = filtered.filter(l => l.status === 'first_call_made' || l.status === 'contacted');
  const bookedLeads = filtered.filter(l => l.status === 'appointment_booked');
  const dqLeads = filtered.filter(l => l.status === 'disqualified');

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
            <button
              onClick={() => setShowDQ(!showDQ)}
              className={`px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${
                showDQ ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Ban className="w-3.5 h-3.5 inline mr-1" />DQ
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" />Add Lead
            </button>
          </div>
        </div>

        {/* Pipeline Columns */}
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${showDQ ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
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
          {showDQ && (
            <PipelineColumn
              title="Disqualified"
              count={dqLeads.length}
              color="bg-red-500"
              leads={dqLeads}
              clients={clients}
              onAction={handleAction}
              onSelect={handleSelectLead}
            />
          )}
        </div>
      </main>

      <LeadDetailPanel
        lead={selectedLead}
        clientName={selectedLead ? getClientName(selectedLead.client_id) : ''}
        setterName={selectedLead ? getUserName(selectedLead.setter_id) : null}
        bookedByName={selectedLead ? getUserName(selectedLead.booked_by_setter_id) : null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAction={handleAction}
      />

      <FirstCallModal
        lead={firstCallLead}
        open={firstCallOpen}
        onOpenChange={setFirstCallOpen}
        onResult={handleFirstCallResult}
      />

      <BookAppointmentModal
        lead={bookingLead}
        bookingLink={bookingLead ? clients.find(c => c.id === bookingLead.client_id)?.booking_link : null}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onBook={handleBookAppointment}
      />

      <DisqualifyModal
        lead={dqLead}
        open={dqOpen}
        onOpenChange={setDqOpen}
        onDisqualify={handleDisqualify}
      />

      <AddLeadModal
        open={addOpen}
        onOpenChange={setAddOpen}
        clients={clients}
        onAdd={handleAddLead}
      />
    </div>
  );
}