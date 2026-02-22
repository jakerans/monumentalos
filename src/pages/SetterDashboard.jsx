import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Filter, Plus, Ban } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import SetterNav from '../components/setter/SetterNav';
import SetterStats from '../components/setter/SetterStats';
import DailyAIMessage from '../components/setter/DailyAIMessage';
import SpiffTracker from '../components/setter/SpiffTracker';
import PipelineColumn from '../components/setter/PipelineColumn';
import LeadDetailPanel from '../components/setter/LeadDetailPanel';
import BookAppointmentModal from '../components/setter/BookAppointmentModal';
import AddLeadModal from '../components/setter/AddLeadModal';
import FirstCallModal from '../components/setter/FirstCallModal';
import DisqualifyModal from '../components/setter/DisqualifyModal';
import LeaderboardWidget from '../components/setter/LeaderboardWidget';
import CelebrationOverlay from '../components/setter/CelebrationOverlay';
import DailySpiffBanner from '../components/setter/DailySpiffBanner';
import InventoryModal from '../components/setter/InventoryModal';
import LootBoxOpenModal from '../components/setter/LootBoxOpenModal';
import ClockWidget from '../components/setter/ClockWidget';
import MyScheduleTab from '../components/setter/MyScheduleTab';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function SetterDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchInput, setSearchInput] = useState('');
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
  const [celebration, setCelebration] = useState(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [isOpeningBox, setIsOpeningBox] = useState(false);
  const [droppedBox, setDroppedBox] = useState(null);
  const [dashTab, setDashTab] = useState('pipeline');
  const prevRankRef = useRef(null);
  const [animateRef] = useAutoAnimate({ duration: 350, easing: 'ease-out' });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  // Single backend call for all dashboard data
  const { data: dashData, refetch, isLoading: dashLoading } = useQuery({
    queryKey: ['setter-dashboard-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSetterDashboardData');
      return res.data;
    },
    staleTime: 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  // Workspace data (clock, schedule, hours)
  const { data: workspaceData, refetch: refetchWorkspace } = useQuery({
    queryKey: ['setter-workspace-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSetterWorkspaceData');
      return res.data;
    },
    staleTime: 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  // Users still fetched separately (for name lookups in detail panels)
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('listTeamUsers');
      return res.data?.users || [];
    },
    initialData: [],
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  // Inventory data
  const { data: invData } = useQuery({
    queryKey: ['setter-inventory', user?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSetterInventoryData', { setter_id: user.id });
      return res.data;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    retry: 2,
  });

  const unopenedBoxes = invData?.unopenedBoxes || [];
  const inventoryCap = invData?.inventoryCap ?? 10;
  const yellowWarning = invData?.yellowWarning ?? 8;
  const eligibility = invData?.eligibility || {};
  const lifetimeStats = invData?.lifetimeStats || {};
  const recentWins = invData?.recentWins || [];

  const pipelineData = dashData?.pipeline || { newLeads: [], inProgressLeads: [], bookedLeads: [], dqLeads: [] };
  const preStats = dashData?.stats || {};
  const spiffs = dashData?.spiffs || [];
  const clients = dashData?.clients || [];
  const clientMap = dashData?.clientMap || {};
  const leaderboardData = dashData?.leaderboard || { profiles: [], myRank: null };
  const aiContext = dashData?.aiContext || {};

  // All pipeline leads combined (for mutation lookups)
  const allPipelineLeads = useMemo(() => [
    ...pipelineData.newLeads,
    ...pipelineData.inProgressLeads,
    ...pipelineData.bookedLeads,
    ...pipelineData.dqLeads,
  ], [pipelineData]);

  const getUserName = (userId) => {
    if (!userId) return null;
    const u = users.find(u => u.id === userId);
    return u?.full_name || null;
  };

  const getClientName = (clientId) => {
    return clientMap[clientId] || 'Unknown';
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
    const lead = allPipelineLeads.find(l => l.id === leadId);
    await base44.entities.Lead.update(leadId, {
      status: 'disqualified',
      dq_reason: dqReason,
      disqualified_by_setter_id: user.id,
      disqualified_date: new Date().toISOString(),
    });
    refetch();
    toast({ title: 'Lead Disqualified', description: `${lead?.name || 'Lead'} marked as DQ.`, variant: 'warning' });
  };

  const handleFirstCallResult = async (leadId, result, dqReason) => {
    const speedMinutes = (() => {
      const lead = allPipelineLeads.find(l => l.id === leadId);
      if (!lead) return null;
      const received = lead.lead_received_date || lead.created_date;
      if (lead.first_call_made_date) return undefined;
      return Math.floor((new Date() - new Date(received)) / 60000);
    })();

    const baseUpdates = {
      first_call_made_date: new Date().toISOString(),
      setter_id: user.id,
      ...(speedMinutes != null && speedMinutes !== undefined ? { speed_to_lead_minutes: speedMinutes } : {}),
    };

    const leadName = allPipelineLeads.find(l => l.id === leadId)?.name || 'Lead';
    if (result === 'scheduled') {
      await base44.entities.Lead.update(leadId, {
        ...baseUpdates,
        status: 'first_call_made',
      });
      refetch();
      toast({ title: 'Call Logged', description: `${leadName} — ready to book.`, variant: 'success' });
      const updatedLead = allPipelineLeads.find(l => l.id === leadId);
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
        disqualified_by_setter_id: user.id,
        disqualified_date: new Date().toISOString(),
      });
      refetch();
      toast({ title: 'Lead Disqualified', description: `${leadName} marked as DQ.`, variant: 'warning' });
    }
  };

  const handleBookAppointment = async (leadId, appointmentDate) => {
    const lead = allPipelineLeads.find(l => l.id === leadId);
    await base44.entities.Lead.update(leadId, {
      status: 'appointment_booked',
      appointment_date: appointmentDate,
      date_appointment_set: new Date().toISOString(),
      disposition: 'scheduled',
      booked_by_setter_id: user.id,
    });
    refetch();
    toast({ title: '🗓️ Appointment Booked!', description: `${lead?.name || 'Lead'} is scheduled.`, variant: 'success', duration: 5000 });

    // Fire the drop engine — non-blocking
    try {
      const dropRes = await base44.functions.invoke('processLootBoxDrop', {
        setter_id: user.id,
        lead_id: leadId,
      });
      const drop = dropRes?.data;
      if (drop?.dropped && drop?.loot_box_id) {
        setDroppedBox({ id: drop.loot_box_id, rarity: drop.rarity, status: 'unopened' });
        setCelebration({ type: 'loot_drop', rarity: drop.rarity });
      } else {
        setCelebration({ type: 'booking' });
      }
    } catch {
      setCelebration({ type: 'booking' });
    }
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

  // Track rank changes for #1 celebration
  const myCurrentRank = leaderboardData.myRank;
  useEffect(() => {
    if (!myCurrentRank || !prevRankRef.current) {
      prevRankRef.current = myCurrentRank;
      return;
    }
    if (prevRankRef.current > 1 && myCurrentRank === 1) {
      setCelebration({ type: 'rank_up' });
    }
    prevRankRef.current = myCurrentRank;
  }, [myCurrentRank]);

  // Memoized pipeline filtering
  const filterFn = React.useCallback((leads) => leads.filter(l => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchClient = clientFilter === 'all' || l.client_id === clientFilter;
    return matchSearch && matchClient;
  }), [search, clientFilter]);

  const newLeads = useMemo(() => filterFn(pipelineData.newLeads), [filterFn, pipelineData.newLeads]);
  const inProgressLeads = useMemo(() => filterFn(pipelineData.inProgressLeads), [filterFn, pipelineData.inProgressLeads]);
  const bookedLeads = useMemo(() => filterFn(pipelineData.bookedLeads), [filterFn, pipelineData.bookedLeads]);
  const dqLeads = useMemo(() => filterFn(pipelineData.dqLeads), [filterFn, pipelineData.dqLeads]);

  if (!user) return null;
  if (dashLoading) return <PageLoader message="Loading pipeline..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col">
      <SetterNav user={user} unopenedCount={unopenedBoxes.length} yellowWarning={yellowWarning} inventoryCap={inventoryCap} onOpenInventory={() => setInventoryOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:pl-24 lg:pr-8 py-4 sm:py-6">
        {/* Clock Widget */}
        <div className="mb-4">
          <ClockWidget
            workspaceData={workspaceData}
            onClockAction={() => refetchWorkspace()}
            userId={user?.id}
          />
        </div>

        {/* Tab bar: Pipeline / My Schedule */}
        <div className="flex items-center gap-1 mb-4 border-b border-slate-700/50 pb-0">
          <button
            onClick={() => setDashTab('pipeline')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              dashTab === 'pipeline' ? 'border-[#D6FF03] text-[#D6FF03]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setDashTab('schedule')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              dashTab === 'schedule' ? 'border-[#D6FF03] text-[#D6FF03]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            My Schedule
          </button>
        </div>

        {dashTab === 'schedule' ? (
          <MyScheduleTab workspaceData={workspaceData} userId={user?.id} unopenedBoxes={unopenedBoxes} />
        ) : (
        <>
        {/* Hero row: Welcome + AI message on left, Spiff cards on right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-3 flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Welcome back, <span style={{ color: '#D6FF03' }}>{user?.full_name?.split(' ')[0] || 'Champ'}</span>
                </h1>
                <DailySpiffBanner spiffs={spiffs} leads={allPipelineLeads} user={user} />
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </motion.div>
            <DailyAIMessage
              user={user}
              spiffSummaries={aiContext.spiffSummaries || []}
              leaderboard={leaderboardData.profiles}
              myRank={myCurrentRank}
            />
          </div>
          <div className="lg:col-span-2">
            <SpiffTracker spiffs={spiffs} leads={allPipelineLeads} user={user} />
          </div>
        </div>
        <SetterStats preStats={preStats} />

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads by name, phone, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white max-w-[120px] sm:max-w-none"
              >
                <option value="all">All Clients</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowDQ(!showDQ)}
              className={`px-2 sm:px-3 py-2 text-xs sm:text-sm border rounded-lg font-medium transition-colors ${
                showDQ ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Ban className="w-3.5 h-3.5 inline mr-1" />DQ
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-black rounded-lg font-bold transition-colors hover:opacity-90" style={{backgroundColor:'#D6FF03'}}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />Add
            </button>
          </div>
        </div>

        {/* Pipeline Columns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          ref={animateRef}
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
        </>
        )}
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
        spiffs={spiffs}
        leads={allPipelineLeads}
        leaderboardProfiles={leaderboardData.profiles}
      />

      {celebration && !isOpeningBox && (
        <CelebrationOverlay
          type={celebration.type}
          rarity={celebration.rarity}
          onDone={() => setCelebration(null)}
        />
      )}

      <InventoryModal
        open={inventoryOpen}
        onClose={() => { setInventoryOpen(false); setIsOpeningBox(false); }}
        unopenedBoxes={unopenedBoxes}
        inventoryCap={inventoryCap}
        yellowWarning={yellowWarning}
        eligibility={eligibility}
        lifetimeStats={lifetimeStats}
        recentWins={recentWins}
        setterId={user?.id}
        lootSettings={invData?.lootSettings || null}
        onOpeningStateChange={setIsOpeningBox}
        onOpenBox={(win) => {
          queryClient.invalidateQueries({ queryKey: ['setter-inventory', user?.id] });
        }}
      />

      <LootBoxOpenModal
        box={droppedBox}
        open={!!droppedBox && !celebration}
        onClose={() => {
          setDroppedBox(null);
          queryClient.invalidateQueries({ queryKey: ['setter-inventory', user?.id] });
        }}
        onOpened={() => {
          queryClient.invalidateQueries({ queryKey: ['setter-inventory', user?.id] });
        }}
        setterId={user?.id}
        lootSettings={invData?.lootSettings || null}
      />
    </div>
    </PageErrorBoundary>
  );
}