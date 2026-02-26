import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Filter, Plus, Ban, DollarSign, Phone, ClipboardCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
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
import EarningsTab from '../components/setter/EarningsTab';
import DialWorkspace from '../components/setter/DialWorkspace';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import DailyChecklist from '../components/setter/DailyChecklist';
import BugReportWidget from '../components/shared/BugReportWidget';
import MessengerBookedPopup from '../components/setter/MessengerBookedPopup';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [checklistVisible, setChecklistVisible] = useState(false);
  const [reactivateLead, setReactivateLead] = useState(null);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [deleteRequestLead, setDeleteRequestLead] = useState(null);
  const [deleteRequestOpen, setDeleteRequestOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [messengerPopup, setMessengerPopup] = useState(null); // { client, appointmentDate }
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
        const appRole = currentUser.app_role;
        if (!appRole) { navigate(createPageUrl('AccountPending')); return; }
        if (appRole !== 'setter' && appRole !== 'admin') {
          if (appRole === 'client') navigate(createPageUrl('ClientPortal'));
          else if (appRole === 'marketing_manager') navigate(createPageUrl('MMDashboard'));
          else if (appRole === 'onboard_admin') navigate(createPageUrl('OnboardDashboard'));
          else navigate(createPageUrl('AdminDashboard'));
          return;
        }

        // Check if setter has linked Employee record — redirect to onboarding if not
        if (appRole === 'setter') {
          try {
            const linkCheck = await base44.functions.invoke('checkEmployeeLinked');
            if (linkCheck.data?.linked === false) {
              navigate(createPageUrl('EmployeeOnboarding'));
              return;
            }
          } catch (err) {
            // Don't block on check failure — let them through
            console.error('Employee record check failed:', err);
          }
        }

        setUser(currentUser);
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
  
  // Daily checklist data
  const { data: checklistData, refetch: refetchChecklist } = useQuery({
    queryKey: ['shift-checklist', user?.id],
    queryFn: async () => {
      const [templateRes, logRes] = await Promise.all([
        base44.functions.invoke('manageShiftChecklist', { action: 'get_active' }),
        user?.id ? base44.functions.invoke('manageShiftChecklist', { action: 'get_today_log', setter_id: user.id }) : Promise.resolve({ data: { log: null } })
      ]);
      return {
        checklist: templateRes.data?.checklist,
        log: logRes.data?.log
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Earnings data
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ['setter-earnings', user?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSetterEarningsData');
      return res.data;
    },
    enabled: !!user?.id && dashTab === 'earnings',
    staleTime: 2 * 60 * 1000,
  });

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

  const checklist = checklistData?.checklist;
  const checklistLog = checklistData?.log;
  const hasClocked = !!workspaceData?.clockStatus;

  const pipelineData = dashData?.pipeline || { newLeads: [], inProgressLeads: [], bookedLeads: [], dqLeads: [] };
  const preStats = dashData?.stats || {};
  const spiffs = dashData?.spiffs || [];
  const clients = dashData?.clients || [];
  const clientMap = dashData?.clientMap || {};
  const leaderboardData = dashData?.leaderboard || { profiles: [], myRank: null };
  const aiContext = dashData?.aiContext || {};

  // All pipeline leads combined (for mutation lookups and dial workspace)
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

  const optimisticLeadUpdate = (leadId, updates) => {
    queryClient.setQueryData(['setter-dashboard-data'], (old) => {
      if (!old) return old;
      const pipeline = old.pipeline;
      if (!pipeline) return old;

      let lead = null;
      let sourceColumn = null;
      for (const col of ['newLeads', 'inProgressLeads', 'bookedLeads', 'dqLeads']) {
        const found = pipeline[col]?.find(l => l.id === leadId);
        if (found) { lead = { ...found, ...updates }; sourceColumn = col; break; }
      }
      if (!lead || !sourceColumn) return old;

      const targetColumn =
        lead.status === 'new' ? 'newLeads' :
        lead.status === 'first_call_made' || lead.status === 'contacted' ? 'inProgressLeads' :
        lead.status === 'appointment_booked' ? 'bookedLeads' :
        lead.status === 'disqualified' ? 'dqLeads' :
        sourceColumn;

      const newPipeline = { ...pipeline };
      for (const col of ['newLeads', 'inProgressLeads', 'bookedLeads', 'dqLeads']) {
        newPipeline[col] = pipeline[col].filter(l => l.id !== leadId);
      }
      newPipeline[targetColumn] = [...newPipeline[targetColumn], lead];

      const newStats = { ...old.stats };
      newStats.newCount = newPipeline.newLeads.length;
      newStats.inProgressCount = newPipeline.inProgressLeads.length;
      newStats.bookedCount = newPipeline.bookedLeads.length;
      newStats.dqCount = newPipeline.dqLeads.length;

      if (targetColumn === 'bookedLeads' && sourceColumn !== 'bookedLeads') {
        newStats.mtdBooked = (old.stats.mtdBooked || 0) + 1;
      }
      if (sourceColumn === 'newLeads' && targetColumn !== 'newLeads') {
        newStats.mtdCalls = (old.stats.mtdCalls || 0) + 1;
      }

      return { ...old, pipeline: newPipeline, stats: newStats };
    });
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
    } else if (action === 'reactivate') {
      handleReactivate(lead);
    } else if (action === 'request_delete') {
      handleRequestDelete(lead);
    }
  };

  const handleRequestDelete = (lead) => {
    setDeleteRequestLead(lead);
    setDeleteReason('');
    setDeleteRequestOpen(true);
  };

  const handleSubmitDeleteRequest = async () => {
    if (!deleteRequestLead) return;
    try {
      await base44.entities.Lead.update(deleteRequestLead.id, {
        deletion_requested: true,
        deletion_reason: deleteReason.trim() || 'No reason provided',
        deletion_requested_by: user.id,
        deletion_requested_date: new Date().toISOString(),
      });
      toast({ title: 'Deletion Requested', description: `Admin will review your request for ${deleteRequestLead.name}.`, variant: 'success' });
      setDeleteRequestOpen(false);
      setDeleteRequestLead(null);
      setDeleteReason('');
      refetch();
    } catch (err) {
      toast({ title: 'Request failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const handleReactivate = (lead) => {
    // If lead had a booking, show confirmation dialog with options
    if (lead.appointment_date || lead.status === 'appointment_booked' || lead.disposition === 'scheduled') {
      setReactivateLead(lead);
      setReactivateOpen(true);
    } else {
      // No booking — just reactivate directly
      const targetStatus = lead.first_call_made_date ? 'first_call_made' : 'new';
      const updates = {
        status: targetStatus,
        dq_reason: '',
        disqualified_by_setter_id: '',
        disqualified_date: '',
      };
      optimisticLeadUpdate(lead.id, updates);
      toast({ title: 'Lead Reactivated', description: `${lead.name} moved back to ${targetStatus === 'new' ? 'New Leads' : 'In Progress'}.`, variant: 'success' });
      base44.entities.Lead.update(lead.id, updates)
        .then(() => refetch())
        .catch((err) => { console.error('Reactivate failed:', err); toast({ title: 'Sync error — refreshing...', variant: 'destructive' }); refetch(); });
    }
  };

  const handleReactivateChoice = (choice) => {
    const lead = reactivateLead;
    if (!lead) return;
    setReactivateOpen(false);
    setReactivateLead(null);

    if (choice === 'keep_booking') {
      const updates = {
        status: 'appointment_booked',
        disposition: 'scheduled',
        dq_reason: '',
        disqualified_by_setter_id: '',
        disqualified_date: '',
      };
      optimisticLeadUpdate(lead.id, updates);
      toast({ title: 'Lead Reactivated', description: `${lead.name} restored to Appointment Booked.`, variant: 'success' });
      base44.entities.Lead.update(lead.id, updates)
        .then(() => refetch())
        .catch((err) => { console.error('Reactivate failed:', err); toast({ title: 'Sync error — refreshing...', variant: 'destructive' }); refetch(); });
    } else {
      const updates = {
        status: 'first_call_made',
        appointment_date: '',
        date_appointment_set: '',
        disposition: '',
        booked_by_setter_id: '',
        dq_reason: '',
        disqualified_by_setter_id: '',
        disqualified_date: '',
      };
      optimisticLeadUpdate(lead.id, updates);
      toast({ title: 'Lead Reactivated', description: `${lead.name} moved to In Progress. Booking cleared.`, variant: 'warning' });
      base44.entities.Lead.update(lead.id, updates)
        .then(() => refetch())
        .catch((err) => { console.error('Reactivate failed:', err); toast({ title: 'Sync error — refreshing...', variant: 'destructive' }); refetch(); });
    }
  };

  const handleDisqualify = (leadId, dqReason) => {
    const lead = allPipelineLeads.find(l => l.id === leadId);
    const dqUpdates = {
      status: 'disqualified',
      dq_reason: dqReason,
      disqualified_by_setter_id: user.id,
      disqualified_date: new Date().toISOString(),
    };
    optimisticLeadUpdate(leadId, dqUpdates);
    toast({ title: 'Lead Disqualified', description: `${lead?.name || 'Lead'} marked as DQ.`, variant: 'warning' });
    base44.entities.Lead.update(leadId, dqUpdates)
      .then(() => refetch())
      .catch((err) => { console.error('DQ failed:', err); toast({ title: 'Sync error — refreshing...', variant: 'destructive' }); refetch(); });
  };

  const handleFirstCallResult = (leadId, result, dqReason) => {
    const lead = allPipelineLeads.find(l => l.id === leadId);
    const leadName = lead?.name || 'Lead';

    const speedMinutes = (() => {
      if (!lead) return null;
      const received = lead.lead_received_date || lead.created_date;
      if (lead.first_call_made_date) return undefined;
      // Skip STL for overnight leads
      if (lead.is_overnight) return undefined;
      return Math.floor((new Date() - new Date(received)) / 60000);
    })();

    const baseUpdates = {
      first_call_made_date: new Date().toISOString(),
      setter_id: user.id,
      ...(speedMinutes != null && speedMinutes !== undefined ? { speed_to_lead_minutes: speedMinutes } : {}),
    };

    if (result === 'scheduled') {
      optimisticLeadUpdate(leadId, { ...baseUpdates, status: 'first_call_made' });
      toast({ title: 'Call Logged', description: `${leadName} — ready to book.`, variant: 'success' });
      if (lead) { setBookingLead({ ...lead, ...baseUpdates, status: 'first_call_made' }); setBookingOpen(true); }
      base44.entities.Lead.update(leadId, { ...baseUpdates, status: 'first_call_made' })
        .then(() => refetch())
        .catch((err) => { console.error('Lead update failed:', err); toast({ title: 'Sync error — refreshing...', variant: 'destructive' }); refetch(); });

    } else if (result === 'not_connected') {
      optimisticLeadUpdate(leadId, { ...baseUpdates, status: 'first_call_made' });
      toast({ title: 'Call Logged', description: `${leadName} — not connected, moved to In Progress.`, variant: 'info' });
      base44.entities.Lead.update(leadId, { ...baseUpdates, status: 'first_call_made' })
        .then(() => refetch())
        .catch((err) => { console.error('Lead update failed:', err); toast({ title: 'Sync error — refreshing...', variant: 'destructive' }); refetch(); });

    } else if (result === 'disqualified') {
      const dqUpdates = { ...baseUpdates, status: 'disqualified', dq_reason: dqReason, disqualified_by_setter_id: user.id, disqualified_date: new Date().toISOString() };
      optimisticLeadUpdate(leadId, dqUpdates);
      toast({ title: 'Lead Disqualified', description: `${leadName} marked as DQ.`, variant: 'warning' });
      base44.entities.Lead.update(leadId, dqUpdates)
        .then(() => refetch())
        .catch((err) => { console.error('Lead update failed:', err); toast({ title: 'Sync error — refreshing...', variant: 'destructive' }); refetch(); });
    }
  };

  const fireBookingCelebration = async (leadId) => {
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

  const handleBookAppointment = async (leadId, appointmentDate, projectType, projectSize) => {
    const lead = allPipelineLeads.find(l => l.id === leadId);
    const bookUpdates = {
      status: 'appointment_booked',
      appointment_date: appointmentDate,
      date_appointment_set: new Date().toISOString(),
      disposition: 'scheduled',
      booked_by_setter_id: user.id,
      ...(projectType ? { project_type: projectType } : {}),
      ...(projectSize ? { project_size: projectSize } : {}),
    };
    optimisticLeadUpdate(leadId, bookUpdates);
    base44.entities.Lead.update(leadId, bookUpdates)
      .then(() => refetch())
      .catch((err) => { console.error('Booking failed:', err); toast({ title: 'Booking sync error — refreshing...', variant: 'destructive' }); refetch(); });

    // Check if this is a messenger lead — show copy popup before celebration
    if (lead?.lead_source === 'msg') {
      const client = clients.find(c => c.id === lead.client_id);
      setMessengerPopup({ client, appointmentDate, leadId });
    } else {
      toast({ title: '🗓️ Appointment Booked!', description: `${lead?.name || 'Lead'} is scheduled.`, variant: 'success', duration: 5000 });
      await fireBookingCelebration(leadId);
    }
  };

  const handleAddLead = async (leadData) => {
    try {
      const created = await base44.entities.Lead.create(leadData);
      
      if (leadData.status === 'appointment_booked') {
        refetch();

        // If messenger lead, show copy popup first
        if (leadData.lead_source === 'msg') {
          const client = clients.find(c => c.id === leadData.client_id);
          setMessengerPopup({ client, appointmentDate: leadData.appointment_date, leadId: created.id });
        } else {
          toast({ title: '🗓️ Appointment Booked!', description: `${leadData.name} is scheduled.`, variant: 'success', duration: 5000 });
          await fireBookingCelebration(created.id);
        }
      } else {
        toast({ title: 'Lead Added', description: `${leadData.name} added to the pipeline.`, variant: 'success' });
        refetch();
      }
    } catch (err) {
      toast({ title: 'Failed to add lead', description: err?.message || 'Unknown error', variant: 'destructive' });
      throw err;
    }
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleChecklistTaskComplete = async (taskData) => {
    await base44.functions.invoke('manageShiftChecklist', {
      action: 'complete_task',
      setter_id: user.id,
      checklist_id: checklist.id,
      ...taskData
    });
    refetchChecklist();
  };

  // Auto-show checklist logic
  useEffect(() => {
    if (checklist && hasClocked) {
      let tasksParsed = [];
      try { tasksParsed = typeof checklist.tasks === 'string' ? JSON.parse(checklist.tasks) : (Array.isArray(checklist.tasks) ? checklist.tasks : []); } catch { tasksParsed = []; }
      let logTasksParsed = [];
      try { logTasksParsed = checklistLog?.completed_tasks ? (typeof checklistLog.completed_tasks === 'string' ? JSON.parse(checklistLog.completed_tasks) : (Array.isArray(checklistLog.completed_tasks) ? checklistLog.completed_tasks : [])) : []; } catch { logTasksParsed = []; }
      const allDone = tasksParsed.length > 0 && logTasksParsed.length === tasksParsed.length;
      
      if (!allDone) {
        setChecklistVisible(true);
      }
    }
  }, [checklist, hasClocked, checklistLog?.all_complete]);

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
        <div className="mb-4" data-tour="clock-widget">
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
            data-tour="schedule-tab"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              dashTab === 'schedule' ? 'border-[#D6FF03] text-[#D6FF03]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            My Schedule
          </button>
          <button
            onClick={() => setDashTab('earnings')}
            data-tour="earnings-tab"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              dashTab === 'earnings' ? 'border-[#D6FF03] text-[#D6FF03]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            My Earnings
          </button>
        </div>

        {dashTab === 'earnings' ? (
          <EarningsTab data={earningsData} loading={earningsLoading} />
        ) : dashTab === 'schedule' ? (
          <MyScheduleTab workspaceData={workspaceData} userId={user?.id} unopenedBoxes={unopenedBoxes} onRefreshWorkspace={refetchWorkspace} />
        ) : (
        <>
        {/* Floating checklist button */}
        {!checklistVisible && checklist && !checklistLog?.all_complete && hasClocked && dashTab === 'pipeline' && !workspaceOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setChecklistVisible(true)}
            data-tour="checklist-button"
            className="fixed bottom-6 left-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-black shadow-lg hover:shadow-xl transition-shadow"
            style={{ backgroundColor: '#D6FF03' }}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-sm">{(() => { try { const parsed = typeof checklistLog?.completed_tasks === 'string' ? JSON.parse(checklistLog.completed_tasks) : (Array.isArray(checklistLog?.completed_tasks) ? checklistLog.completed_tasks : []); let taskList = []; try { taskList = typeof checklist?.tasks === 'string' ? JSON.parse(checklist.tasks) : (Array.isArray(checklist?.tasks) ? checklist.tasks : []); } catch {}; return `${parsed.length}/${taskList.length}`; } catch { return '0/0'; } })()}</span>
          </motion.button>
        )}

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
                <DailySpiffBanner spiffs={spiffs} user={user} />
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
            <SpiffTracker spiffs={spiffs} user={user} />
          </div>
        </div>
        <div data-tour="setter-stats">
          <SetterStats preStats={preStats} />
        </div>

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
            <button
              onClick={() => setWorkspaceOpen(true)}
              data-tour="dial-workspace-btn"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-black rounded-lg font-bold transition-colors hover:opacity-90"
              style={{ backgroundColor: '#D6FF03' }}
            >
              <Phone className="w-3.5 h-3.5" />Start Dialing
            </button>
          </div>
        </div>

        {/* Pipeline Columns */}
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2, duration: 0.4 }}
           ref={animateRef}
           data-tour="pipeline-columns"
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
        clientIndustries={bookingLead ? clients.find(c => c.id === bookingLead.client_id)?.industries || [] : []}
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
        existingLeads={allPipelineLeads}
      />

      <LeaderboardWidget
        user={user}
        spiffs={spiffs}
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

      <AnimatePresence>
        {workspaceOpen && (
          <DialWorkspace
            allLeads={dashData?.allLeads || []}
            clients={clients}
            user={user}
            onClose={() => setWorkspaceOpen(false)}
            onAddLead={handleAddLead}
            addLeadOpen={addOpen}
            setAddLeadOpen={setAddOpen}
            onAction={({ type, lead }) => {
              if (type === 'first_call') { setFirstCallLead(lead); setFirstCallOpen(true); }
              else if (type === 'book') { setBookingLead(lead); setBookingOpen(true); }
              else if (type === 'disqualify') { setDqLead(lead); setDqOpen(true); }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checklistVisible && checklist && (
          <DailyChecklist
            checklist={checklist}
            log={checklistLog}
            user={user}
            onTaskComplete={handleChecklistTaskComplete}
            onDismiss={() => setChecklistVisible(false)}
          />
        )}
      </AnimatePresence>

      <MessengerBookedPopup
        open={!!messengerPopup}
        onOpenChange={(v) => { if (!v) setMessengerPopup(null); }}
        client={messengerPopup?.client}
        appointmentDate={messengerPopup?.appointmentDate}
        onDone={async () => {
          const leadId = messengerPopup?.leadId;
          setMessengerPopup(null);
          toast({ title: '🗓️ Appointment Booked!', description: 'Lead is scheduled.', variant: 'success', duration: 5000 });
          if (leadId) await fireBookingCelebration(leadId);
        }}
      />

      <BugReportWidget user={user} />

      <AlertDialog open={reactivateOpen} onOpenChange={(open) => { if (!open) { setReactivateOpen(false); setReactivateLead(null); } }}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Reactivate Lead</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              <span className="font-semibold text-white">{reactivateLead?.name}</span> has an existing booking:
            </AlertDialogDescription>
          </AlertDialogHeader>

          {reactivateLead && (
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 my-2">
              <div className="text-xs text-slate-400 space-y-1">
                {reactivateLead.appointment_date && (
                  <p>📅 <span className="text-white">{new Date(reactivateLead.appointment_date).toLocaleString()}</span></p>
                )}
                {reactivateLead.date_appointment_set && (
                  <p>🕐 Booked on: <span className="text-slate-300">{new Date(reactivateLead.date_appointment_set).toLocaleDateString()}</span></p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => handleReactivateChoice('keep_booking')}
              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors text-left"
            >
              <span className="block font-semibold">Keep booking → Appointment Booked</span>
              <span className="block text-xs text-green-200 mt-0.5">Restore to Appointment Booked with existing date/time</span>
            </button>
            <button
              onClick={() => handleReactivateChoice('clear_booking')}
              className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm transition-colors text-left"
            >
              <span className="block font-semibold">Clear booking → In Progress</span>
              <span className="block text-xs text-amber-200 mt-0.5">Remove appointment and move to In Progress for re-booking</span>
            </button>
          </div>

          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteRequestOpen} onOpenChange={(open) => { if (!open) { setDeleteRequestOpen(false); setDeleteRequestLead(null); } }}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-base">Request Lead Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm">
              This sends a request to admin to delete <span className="text-white font-medium">{deleteRequestLead?.name}</span>. The lead will remain in the pipeline until approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2">
            <label className="block text-xs text-slate-400 mb-1">Reason (optional)</label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g. Test lead, duplicate, wrong client..."
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubmitDeleteRequest}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
            >
              Submit Request
            </button>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </PageErrorBoundary>
  );
}