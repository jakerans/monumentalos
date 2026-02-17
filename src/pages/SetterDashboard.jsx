import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Filter, Plus, Ban } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import SetterNav from '../components/setter/SetterNav';
import SetterStats from '../components/setter/SetterStats';
import PipelineColumn from '../components/setter/PipelineColumn';
import LeadDetailPanel from '../components/setter/LeadDetailPanel';
import BookAppointmentModal from '../components/setter/BookAppointmentModal';
import AddLeadModal from '../components/setter/AddLeadModal';
import FirstCallModal from '../components/setter/FirstCallModal';
import DisqualifyModal from '../components/setter/DisqualifyModal';
import LeaderboardWidget from '../components/setter/LeaderboardWidget';
import CelebrationOverlay from '../components/setter/CelebrationOverlay';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import { motion } from 'framer-motion';

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
  const [celebration, setCelebration] = useState(null); // { type: 'rank_up' | 'booking' }
  const prevRankRef = useRef(null);

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

  const { data: leads = [], refetch, isLoading: l1 } = useQuery({
    queryKey: ['setter-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 5000),
    staleTime: 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const { data: clients = [], isLoading: l2 } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const { data: spiffs = [] } = useQuery({
    queryKey: ['setter-spiffs'],
    queryFn: () => base44.entities.Spiff.filter({ status: 'active' }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
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
    const lead = leads.find(l => l.id === leadId);
    await base44.entities.Lead.update(leadId, {
      status: 'disqualified',
      dq_reason: dqReason,
    });
    refetch();
    toast({ title: 'Lead Disqualified', description: `${lead?.name || 'Lead'} marked as DQ.`, variant: 'warning' });
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

    const leadName = leads.find(l => l.id === leadId)?.name || 'Lead';
    if (result === 'scheduled') {
      await base44.entities.Lead.update(leadId, {
        ...baseUpdates,
        status: 'first_call_made',
      });
      refetch();
      toast({ title: 'Call Logged', description: `${leadName} — ready to book.`, variant: 'success' });
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
      toast({ title: 'Call Logged', description: `${leadName} — not connected, moved to In Progress.`, variant: 'info' });
    } else if (result === 'disqualified') {
      await base44.entities.Lead.update(leadId, {
        ...baseUpdates,
        status: 'disqualified',
        dq_reason: dqReason,
      });
      refetch();
      toast({ title: 'Lead Disqualified', description: `${leadName} marked as DQ.`, variant: 'warning' });
    }
  };

  const handleBookAppointment = async (leadId, appointmentDate) => {
    const lead = leads.find(l => l.id === leadId);
    await base44.entities.Lead.update(leadId, {
      status: 'appointment_booked',
      appointment_date: appointmentDate,
      date_appointment_set: new Date().toISOString(),
      disposition: 'scheduled',
      booked_by_setter_id: user.id,
    });
    refetch();
    setCelebration({ type: 'booking' });
    toast({ title: '🗓️ Appointment Booked!', description: `${lead?.name || 'Lead'} is scheduled.`, variant: 'success', duration: 5000 });
  };

  const handleAddLead = async (leadData) => {
    await base44.entities.Lead.create(leadData);
    refetch();
    toast({ title: 'Lead Added', description: `${leadData.name} added to the pipeline.`, variant: 'success' });
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  // Build leaderboard data
  const now2 = new Date();
  const mtdStart = new Date(now2.getFullYear(), now2.getMonth(), 1);
  const lastMtdStart = new Date(now2.getFullYear(), now2.getMonth() - 1, 1);
  const lastMtdEnd = new Date(now2.getFullYear(), now2.getMonth(), 0, 23, 59, 59);

  const setters = users.filter(u => u.app_role === 'setter');

  const buildBoard = (start, end) => {
    return setters.map(s => {
      const booked = leads.filter(l =>
        l.booked_by_setter_id === s.id && l.date_appointment_set &&
        new Date(l.date_appointment_set) >= start &&
        (!end || new Date(l.date_appointment_set) <= end)
      ).length;
      const stlLeads = leads.filter(l =>
        l.setter_id === s.id && l.speed_to_lead_minutes != null &&
        new Date(l.created_date) >= start &&
        (!end || new Date(l.created_date) <= end)
      );
      const avgSTL = stlLeads.length > 0 ? Math.round(stlLeads.reduce((sum, l) => sum + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
      return { id: s.id, name: s.full_name, booked, avgSTL };
    }).sort((a, b) => b.booked - a.booked);
  };

  const leaderboard = buildBoard(mtdStart, null);
  const lastMonthBoard = buildBoard(lastMtdStart, lastMtdEnd);

  // Track rank changes for #1 celebration
  const myCurrentRank = leaderboard.findIndex(s => s.id === user?.id) + 1 || null;
  useEffect(() => {
    if (!myCurrentRank || !prevRankRef.current) {
      prevRankRef.current = myCurrentRank;
      return;
    }
    // Went from 2nd/3rd (or lower) to 1st
    if (prevRankRef.current > 1 && myCurrentRank === 1) {
      setCelebration({ type: 'rank_up' });
    }
    prevRankRef.current = myCurrentRank;
  }, [myCurrentRank]);

  if (!user) return null;
  if (l1 || l2) return <PageLoader message="Loading pipeline..." />;

  // Filter leads — hide leads with a final outcome (sold/lost) or completed status
  const filtered = leads.filter(l => {
    if (l.outcome === 'sold' || l.outcome === 'lost' || l.status === 'completed') return false;
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
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white"
            >
              <option value="all">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowDQ(!showDQ)}
              className={`px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${
                showDQ ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Ban className="w-3.5 h-3.5 inline mr-1" />DQ
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="px-3 py-2 text-sm text-black rounded-lg font-bold transition-colors hover:opacity-90" style={{backgroundColor:'#D6FF03'}}
            >
              <Plus className="w-4 h-4 inline mr-1" />Add Lead
            </button>
          </div>
        </div>

        {/* Pipeline Columns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`grid grid-cols-1 gap-4 sm:gap-6 ${showDQ ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
        >
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
        </motion.div>
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
        userId={user?.id}
      />

      <LeaderboardWidget
        user={user}
        leaderboard={leaderboard}
        lastMonthBoard={lastMonthBoard}
        spiffs={spiffs}
        leads={leads}
      />

      {celebration && (
        <CelebrationOverlay
          type={celebration.type}
          onDone={() => setCelebration(null)}
        />
      )}
    </div>
    </PageErrorBoundary>
  );
}