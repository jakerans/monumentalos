import React from 'react';
import { CircleDot } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { getPayDisplay, getMonthlyBasePay } from './payUtils';

const DISC_COLORS = {
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
};

const ROLE_LABELS = {
  admin: 'Admin', marketing_manager: 'MM', setter: 'Setter',
  onboard_admin: 'Onboard', client: 'Client',
};

export default function EmployeeTable({ employees, payrollSettings, onSelect, lastMonthCollected = 0 }) {
  const totalMonthly = employees.reduce((sum, emp) => sum + getMonthlyBasePay(emp, payrollSettings), 0);
  const totalAnnual = totalMonthly * 12;
  const activeCount = employees.filter(e => e.status !== 'dismissed').length;
  const revenuePerFTE = activeCount > 0 ? Math.round(lastMonthCollected / activeCount) : 0;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 px-3 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase">Headcount</p>
          <p className="text-lg sm:text-xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 px-3 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase">Total Monthly</p>
          <p className="text-lg sm:text-xl font-bold text-white">${Math.round(totalMonthly).toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 px-3 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase">Total Annual</p>
          <p className="text-lg sm:text-xl font-bold text-white">${Math.round(totalAnnual).toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 px-3 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase">COGS / Overhead</p>
          <p className="text-sm sm:text-base font-bold text-white">
            <span className="text-orange-400">${Math.round(cogsMonthly).toLocaleString()}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-blue-400">${Math.round(overheadMonthly).toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-normal">/mo</span>
          </p>
        </div>
      </div>

    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      {/* Mobile card view */}
      <div className="sm:hidden divide-y divide-slate-700/30">
        {employees.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">No employees found</div>
        ) : employees.map(emp => {
          const pay = getPayDisplay(emp, payrollSettings);
          return (
            <div key={emp.id} onClick={() => onSelect(emp)} className="px-4 py-3 space-y-2 cursor-pointer active:bg-slate-700/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{emp.full_name}</p>
                  <p className="text-[10px] text-slate-500">{emp.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CircleDot className={`w-4 h-4 ${DISC_COLORS[emp.discipline_status] || 'text-slate-500'}`} />
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${emp.cost_type === 'cogs' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {emp.cost_type || 'overhead'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div><span className="text-slate-500">Role</span><p className="text-slate-300">{ROLE_LABELS[emp.app_role] || emp.app_role || '—'}</p></div>
                <div><span className="text-slate-500">Type</span><p className="text-slate-300 capitalize">{emp.classification}</p></div>
                <div><span className="text-slate-500">Monthly</span><p className="text-slate-200 font-medium">{pay.monthly}</p></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-slate-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-slate-400 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-slate-400 uppercase">Classification</th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-slate-400 uppercase">Per Cycle</th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-slate-400 uppercase">Monthly</th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-slate-400 uppercase">Annual</th>
              <th className="px-4 py-3 text-left text-[10px] font-medium text-slate-400 uppercase">Cost Type</th>
              <th className="px-4 py-3 text-center text-[10px] font-medium text-slate-400 uppercase">Discipline</th>
              <th className="px-4 py-3 text-center text-[10px] font-medium text-slate-400 uppercase">Perf Pay</th>
            </tr>
          </thead>
          <tbody ref={useAutoAnimate({ duration: 250, easing: 'ease-out' })[0]} className="divide-y divide-slate-700/30">
            {employees.length === 0 ? (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-sm text-slate-500">No employees found</td></tr>
            ) : employees.map(emp => {
              const pay = getPayDisplay(emp, payrollSettings);
              return (
                <tr key={emp.id} onClick={() => onSelect(emp)} className="hover:bg-slate-700/20 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{emp.full_name}</p>
                    {emp.email && <p className="text-[10px] text-slate-500">{emp.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{ROLE_LABELS[emp.app_role] || emp.app_role || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-300 capitalize">{emp.classification}</span>
                    {emp.classification === 'contractor' && emp.contractor_billing_type && (
                      <span className="text-[10px] text-slate-500 ml-1">({emp.contractor_billing_type})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-200">
                    {(emp.classification === 'salary' || (emp.classification === 'contractor' && emp.contractor_billing_type === 'per_cycle')) ? (pay.perCycle || '—') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-200">{pay.monthly}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{pay.annual}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${emp.cost_type === 'cogs' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue-500/15 text-blue-400'}`}>
                      {emp.cost_type || 'overhead'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CircleDot className={`w-4 h-4 inline ${DISC_COLORS[emp.discipline_status] || 'text-slate-500'}`} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {emp.has_performance_pay ? (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-full">YES</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}