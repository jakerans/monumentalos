import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save, Edit2, CheckCircle, DollarSign } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileNav from '../components/admin/AdminMobileNav';
import PageErrorBoundary from '../components/shared/PageErrorBoundary';
import PageLoader from '../components/shared/PageLoader';
import { toast } from '@/components/ui/use-toast';
import AddLootPrizeModal from '../components/loot/AddLootPrizeModal';
import LootTableTab from '../components/loot/LootTableTab';
import LootSettingsTab from '../components/loot/LootSettingsTab';
import LootFulfillmentTab from '../components/loot/LootFulfillmentTab';

export default function LootAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('fulfillment');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (!currentUser || currentUser.app_role !== 'admin') {
          navigate(createPageUrl('AdminDashboard'));
        }
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, [navigate]);

  const { data: lootData, isLoading, refetch } = useQuery({
    queryKey: ['loot-admin-data'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getLootAdminData', {});
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  const prizes = lootData?.prizes || [];
  const pendingWins = lootData?.pendingWins || [];
  const settings = lootData?.settings || null;
  const inventoryStats = lootData?.inventoryStats || {};
  const clients = [];

  if (!user) return null;
  if (isLoading) return <PageLoader message="Loading loot admin..." />;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen bg-[#0B0F1A] flex">
      <AdminSidebar user={user} currentPage="LootAdmin" clients={clients} />
      
      <main className="flex-1 min-w-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Loot System Admin</h1>
          <p className="text-sm text-slate-400 mt-1">Configure prizes, drop rates, and fulfill pending wins</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="table">Loot Table</TabsTrigger>
            <TabsTrigger value="settings">Drop Settings</TabsTrigger>
            <TabsTrigger value="fulfillment">Fulfillment Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#D6FF03] text-black hover:bg-[#C4E603]"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Prize
              </Button>
            </div>
            <LootTableTab
              prizes={prizes}
              onPrizeUpdated={refetch}
              onPrizeDeleted={refetch}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <LootSettingsTab
              settings={settings}
              onSettingsSaved={refetch}
            />
          </TabsContent>

          <TabsContent value="fulfillment" className="space-y-4">
            <LootFulfillmentTab
              pendingWins={pendingWins}
              onWinUpdated={refetch}
            />
          </TabsContent>
        </Tabs>
      </main>

      <AddLootPrizeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onPrizeAdded={() => {
          setShowAddModal(false);
          refetch();
          toast({ title: 'Prize added', variant: 'default' });
        }}
      />

      <AdminMobileNav currentPage="LootAdmin" clients={clients} />
    </div>
    </PageErrorBoundary>
  );
}