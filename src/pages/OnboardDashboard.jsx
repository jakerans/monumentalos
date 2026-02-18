import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Building2, UserPlus, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import OnboardNav from '../components/onboard/OnboardNav';
import OnboardKPIs from '../components/onboard/OnboardKPIs';
import ProjectCard from '../components/onboard/ProjectCard';
import ProjectDetail from '../components/onboard/ProjectDetail';
import NewProjectModal from '../components/onboard/NewProjectModal';
import CreateClientModal from '../components/onboard/CreateClientModal';
import ClientContactsPanel from '../components/onboard/ClientContactsPanel';
import TemplateManager from '../components/onboard/TemplateManager';
import ClientList from '../components/onboard/ClientList';
import InviteClientUserModal from '../components/onboard/InviteClientUserModal';
import EditClientModal from '../components/onboard/EditClientModal';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import OnboardDashboardSkeleton from '../components/onboard/OnboardDashboardSkeleton';

export default function OnboardDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('projects');
  const [showNew, setShowNew] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('in_progress');
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [contactsClient, setContactsClient] = useState(null);
  const [inviteClient, setInviteClient] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const appRole = currentUser.app_role;
        if (!appRole) { navigate(createPageUrl('AccountPending')); return; }
        if (appRole !== 'onboard_admin' && appRole !== 'admin') {
          navigate(createPageUrl('AdminDashboard'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  // Single backend call for all dashboard data
  const { data: dashData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['onboard-dashboard-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getOnboardDashboardData');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  const projects = dashData?.projects || [];
  const tasks = dashData?.tasks || [];
  const templates = dashData?.templates || [];
  const clients = dashData?.clients || [];
  const users = dashData?.users || [];

  const refetchProjects = refetchDash;
  const refetchTasks = refetchDash;
  const refetchTemplates = refetchDash;
  const refetchClients = refetchDash;

  const mmUsers = users.filter(u => u.app_role === 'marketing_manager' || u.app_role === 'admin');
  const [projectGridRef] = useAutoAnimate({ duration: 300, easing: 'ease-out' });

  const handleCreateProject = async (projectData, template) => {
    const project = await base44.entities.OnboardProject.create(projectData);
    // Generate tasks from template
    if (template?.tasks?.length > 0) {
      const taskRecords = template.tasks
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((t, i) => ({
          project_id: project.id,
          title: t.title,
          description: t.description || '',
          assigned_to: t.assigned_to || 'onboard_admin',
          status: 'pending',
          order: i,
        }));
      await base44.entities.OnboardTask.bulkCreate(taskRecords);
    }
    refetchProjects();
    refetchTasks();
  };

  const handleRefresh = () => {
    refetchProjects();
    refetchTasks();
  };

  if (!user) return null;
  if (l1 || l2) return <PageLoader message="Loading onboarding..." />;

  const filteredProjects = statusFilter === 'all'
    ? projects
    : projects.filter(p => p.status === statusFilter);

  // Update selectedProject from fresh data
  const freshSelectedProject = selectedProject ? projects.find(p => p.id === selectedProject.id) : null;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col">
      <OnboardNav user={user} activeTab={tab} onTabChange={setTab} />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-5 py-4 space-y-4">
        {tab === 'projects' ? (
          <>
            <OnboardKPIs projects={projects} tasks={tasks} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {['in_progress', 'on_hold', 'completed', 'all'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === s ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {s === 'in_progress' ? 'Active' : s === 'on_hold' ? 'On Hold' : s === 'completed' ? 'Completed' : 'All'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      const res = await base44.functions.invoke('syncClientsSheet');
                      const d = res.data;
                      toast({ title: 'Sheet Synced', description: `Sheet: +${d.sheetCreated} new, ${d.sheetUpdated} updated · DB: +${d.dbCreated} new, ${d.dbUpdated} updated`, variant: 'success' });
                    } catch (e) {
                      toast({ title: 'Sync Failed', description: e.message, variant: 'destructive' });
                    }
                    setSyncing(false);
                  }}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-600 text-slate-300 rounded-md hover:bg-slate-800 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Sheet'}
                </button>
                <button
                  onClick={() => setShowCreateClient(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-600 text-slate-300 rounded-md hover:bg-slate-800"
                >
                  <Building2 className="w-3.5 h-3.5" /> Create Client
                </button>
                <button
                  onClick={() => setShowNew(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black rounded-md hover:opacity-90" style={{backgroundColor:'#D6FF03'}}
                >
                  <Plus className="w-3.5 h-3.5" /> New Client Onboard
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-8 text-center text-xs text-slate-500">
                {statusFilter === 'in_progress' ? 'No active onboarding projects.' : 'No projects found.'}
              </div>
            ) : (
              <div ref={projectGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProjects.map(p => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    tasks={tasks}
                    mmUsers={mmUsers}
                    onClick={() => setSelectedProject(p)}
                  />
                ))}
              </div>
            )}

            <NewProjectModal
              open={showNew}
              onOpenChange={setShowNew}
              clients={clients}
              templates={templates}
              mmUsers={mmUsers}
              onCreate={handleCreateProject}
            />

            <CreateClientModal
              open={showCreateClient}
              onOpenChange={setShowCreateClient}
              onCreated={(newClient) => {
                refetchClients();
                // Auto-open contacts panel for the new client
                setContactsClient(newClient);
              }}
            />

            {contactsClient && (
              <ClientContactsPanel
                open={true}
                onOpenChange={(v) => { if (!v) setContactsClient(null); }}
                client={contactsClient}
                onUpdated={refetchClients}
              />
            )}

            {freshSelectedProject && (
              <ProjectDetail
                project={freshSelectedProject}
                tasks={tasks}
                mmUsers={mmUsers}
                clients={clients}
                onClose={() => setSelectedProject(null)}
                onRefresh={handleRefresh}
                onManageContacts={(client) => { setSelectedProject(null); setContactsClient(client); }}
              />
            )}
          </>
        ) : tab === 'clients' ? (
          <>
            <ClientList
              clients={clients}
              onInviteUser={(client) => setInviteClient(client)}
              onEditClient={(client) => setEditClient(client)}
            />
            <InviteClientUserModal
              open={!!inviteClient}
              onOpenChange={(v) => { if (!v) setInviteClient(null); }}
              client={inviteClient}
            />
            <EditClientModal
              open={!!editClient}
              onOpenChange={(v) => { if (!v) setEditClient(null); }}
              client={editClient}
              onSaved={refetchClients}
            />
          </>
        ) : (
          <TemplateManager templates={templates} onRefresh={refetchTemplates} />
        )}
      </main>
    </div>
    </PageErrorBoundary>
  );
}