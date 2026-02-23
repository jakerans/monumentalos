import React from 'react';
import AdminNav from '../components/admin/AdminNav';
import LeadManagerComponent from '../components/admin/LeadManager';

export default function LeadManager() {
  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <LeadManagerComponent />
      </main>
    </div>
  );
}