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
import SetterBonusSummaryTab from '../components/loot/SetterBonusSummaryTab';

export default function LootAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('bonus');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardRarity, setAwardRarity] = useState('common');
  const [awardSetterId, setAwardSetterId] = useState('');
  const [awarding, setAwarding] = useState(false);

  const handleAwardBox = async () => {
    if (!awardSetterId.trim()) {
      toast({ title: 'Error', description: 'Setter ID is required', variant: 'destructive' });
      return;
    }
    setAwarding(true);
    try {
      await base44.entities.LootBox.create({
        setter_id: awardSetterId.trim(),
        rarity: awardRarity,
        status: 'unopened',
        awarded_date: new Date().toISOString().split('T')[0],
        source: 'manual_award',
      });
      toast({ title: 'Reward awarded!' });
      setShowAwardModal(false);
      setAwardSetterId('');
      setAwardRarity('common');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setAwarding(false);
  };

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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">Loot Box Admin</h1>
            <p className="text-sm text-slate-400 mt-1">Configure prizes, drop rates, and fulfill pending wins</p>
          </div>
          <div className="relative">
            <Button onClick={() => setShowAwardModal(!showAwardModal)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
              Award Test Loot Box
            </Button>
            {showAwardModal && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-4 space-y-3">
                <h4 className="text-sm font-bold text-white">Award Manual Loot Box</h4>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase mb-1 block">Rarity</label>
                  <select value={awardRarity} onChange={e => setAwardRarity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase mb-1 block">Setter ID</label>
                  <Input value={awardSetterId} onChange={e => setAwardSetterId(e.target.value)} placeholder="Enter setter user ID"
                    className="bg-slate-900 border-slate-700 text-white text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAwardBox} disabled={awarding} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs">
                    {awarding ? 'Awarding...' : 'Award Reward'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAwardModal(false)} className="text-xs text-slate-400">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="table">Rewards Table</TabsTrigger>
            <TabsTrigger value="settings">Reward Settings</TabsTrigger>
            <TabsTrigger value="fulfillment">Fulfillment Queue</TabsTrigger>
            <TabsTrigger value="bonus">Bonus Summary</TabsTrigger>
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
              users={lootData?.users || []}
              prizes={prizes}
            />
          </TabsContent>

          <TabsContent value="bonus" className="space-y-4">
            <SetterBonusSummaryTab />
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

      <AdminMobileNav currentPage="LootAdmin" clients={clients} user={user} />
    </div>
    </PageErrorBoundary>
  );
}