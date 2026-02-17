import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Building2, UserPlus } from 'lucide-react';
import OnboardNav from '../components/onboard/OnboardNav';
import OnboardKPIs from '../components/onboard/OnboardKPIs';
import ProjectCard from '../components/onboard/ProjectCard';
import ProjectDetail from '../components/onboard/ProjectDetail';
import NewProjectModal from '../components/onboard/NewProjectModal';
import CreateClientModal from '../components/onboard/CreateClientModal';
import ClientContactsPanel from '../components/onboard/ClientContactsPanel';
import TemplateManager from '../components/onboard/TemplateManager';

export default function OnboardDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('projects');
  const [showNew, setShowNew] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('in_progress');
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [contactsClient, setContactsClient] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'onboard_admin' && currentUser.role !== 'admin') {
          navigate(createPageUrl('AdminDashboard'));
        }
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: ['onboard-projects'],
    queryFn: () => base44.entities.OnboardProject.list('-created_date', 200),
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['onboard-tasks'],
    queryFn: () => base44.entities.OnboardTask.list('-created_date', 1000),
  });

  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['onboard-templates'],
    queryFn: () => base44.entities.OnboardTemplate.filter({ status: 'active' }),
  });

  const { data: clients = [], refetch: refetchClients } = useQuery({
    queryKey: ['all-clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-onboard'],
    queryFn: () => base44.entities.User.list(),
  });

  const mmUsers = users.filter(u => u.role === 'marketing_manager' || u.role === 'admin');

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

  const filteredProjects = statusFilter === 'all'
    ? projects
    : projects.filter(p => p.status === statusFilter);

  // Update selectedProject from fresh data
  const freshSelectedProject = selectedProject ? projects.find(p => p.id === selectedProject.id) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                      statusFilter === s ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {s === 'in_progress' ? 'Active' : s === 'on_hold' ? 'On Hold' : s === 'completed' ? 'Completed' : 'All'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateClient(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50"
                >
                  <Building2 className="w-3.5 h-3.5" /> Create Client
                </button>
                <button
                  onClick={() => setShowNew(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" /> New Client Onboard
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-xs text-gray-400">
                {statusFilter === 'in_progress' ? 'No active onboarding projects.' : 'No projects found.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
        ) : (
          <TemplateManager templates={templates} onRefresh={refetchTemplates} />
        )}
      </main>
    </div>
  );
}