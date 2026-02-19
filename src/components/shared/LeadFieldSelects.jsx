import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const DEFAULT_SIZES = ['Partial Project', 'Full Project'];
const DEFAULT_TYPES = {
  painting: ['Interior', 'Exterior', 'Cabinets'],
  epoxy: ['Garage Floor', 'Basement', 'Commercial'],
  kitchen_bath: ['Kitchen', 'Bath', 'Kitchen & Bath'],
  reno: ['Full Home', 'Addition', 'Basement', 'Room Remodel'],
};

export function useLeadFieldOptions() {
  const { data } = useQuery({
    queryKey: ['lead-field-options-global'],
    queryFn: async () => {
      const results = await base44.entities.CompanySettings.filter({ key: 'lead_options' });
      return results[0] || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const sizes = data?.project_sizes?.length ? data.project_sizes : DEFAULT_SIZES;
  const typesByIndustry = data?.project_types_by_industry && Object.keys(data.project_types_by_industry).length
    ? { ...DEFAULT_TYPES, ...data.project_types_by_industry }
    : DEFAULT_TYPES;

  return { sizes, typesByIndustry };
}

export function getTypesForIndustries(typesByIndustry, industries) {
  if (!industries || industries.length === 0) {
    return [...new Set(Object.values(typesByIndustry).flat())];
  }
  return [...new Set(industries.flatMap(ind => typesByIndustry[ind] || []))];
}

export function ProjectSizeSelect({ value, onChange, className = '' }) {
  const { sizes } = useLeadFieldOptions();
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white ${className}`}
    >
      <option value="">Select size...</option>
      {sizes.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

export function ProjectTypeSelect({ value, onChange, industries = [], className = '' }) {
  const { typesByIndustry } = useLeadFieldOptions();
  const options = getTypesForIndustries(typesByIndustry, industries);
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6FF03] bg-slate-800 text-white ${className}`}
    >
      <option value="">Select type...</option>
      {options.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}