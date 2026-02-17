import React from 'react';

const INDUSTRY_OPTIONS = [
  { value: 'painting', label: 'Painting' },
  { value: 'epoxy', label: 'Epoxy' },
  { value: 'kitchen_bath', label: 'Kitchen/Bath' },
  { value: 'reno', label: 'Reno' },
];

export const INDUSTRY_LABELS = {
  painting: 'Painting',
  epoxy: 'Epoxy',
  kitchen_bath: 'Kitchen/Bath',
  reno: 'Reno',
};

export const INDUSTRY_COLORS = {
  painting: 'bg-blue-500/15 text-blue-400',
  epoxy: 'bg-purple-500/15 text-purple-400',
  kitchen_bath: 'bg-amber-500/15 text-amber-400',
  reno: 'bg-green-500/15 text-green-400',
};

export default function IndustryPicker({ selected = [], onChange, dark = false }) {
  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {INDUSTRY_OPTIONS.map(opt => {
        const isActive = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all ${
              isActive
                ? dark
                  ? 'text-black border-[#D6FF03]'
                  : 'bg-indigo-600 text-white border-indigo-600'
                : dark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            style={isActive && dark ? { backgroundColor: '#D6FF03' } : {}}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}