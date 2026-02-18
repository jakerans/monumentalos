import React from 'react';
import SpiffCard from './SpiffCard';

export default function SpiffTracker({ spiffs, leads, user }) {
  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const getProgress = (spiff) => {
    if (spiff.qualifier === 'appointments') {
      if (spiff.scope === 'team_company') {
        return leads.filter(l => l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
      }
      const setterId = spiff.scope === 'individual' ? spiff.assigned_setter_id : user?.id;
      return leads.filter(l => l.booked_by_setter_id === setterId && l.date_appointment_set && new Date(l.date_appointment_set) >= mtdStart).length;
    }
    if (spiff.qualifier === 'stl') {
      if (spiff.scope === 'team_company') {
        const stlLeads = leads.filter(l => l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
        return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
      }
      const setterId = spiff.scope === 'individual' ? spiff.assigned_setter_id : user?.id;
      const stlLeads = leads.filter(l => l.setter_id === setterId && l.speed_to_lead_minutes != null && new Date(l.created_date) >= mtdStart);
      return stlLeads.length > 0 ? Math.round(stlLeads.reduce((s, l) => s + l.speed_to_lead_minutes, 0) / stlLeads.length) : null;
    }
    return 0;
  };

  const mySpiffs = spiffs.filter(sp => {
    if (sp.status !== 'active') return false;
    if (sp.scope === 'individual') return sp.assigned_setter_id === user?.id;
    return true;
  });

  if (mySpiffs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 h-full">
      {mySpiffs.map(sp => {
        const progress = getProgress(sp);
        const isSTL = sp.qualifier === 'stl';
        const pct = isSTL
          ? (progress != null && sp.goal_value > 0 ? Math.min((sp.goal_value / Math.max(progress, 1)) * 100, 100) : 0)
          : (sp.goal_value > 0 ? Math.min((progress / sp.goal_value) * 100, 100) : 0);
        const met = isSTL ? (progress != null && progress <= sp.goal_value) : (progress >= sp.goal_value);
        return (
          <SpiffCard
            key={sp.id}
            spiff={sp}
            progress={progress}
            pct={pct}
            met={met}
            isSTL={isSTL}
          />
        );
      })}
    </div>
  );
}