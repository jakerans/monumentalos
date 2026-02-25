import React, { useMemo } from 'react';
import { Grid3X3 } from 'lucide-react';

const SOURCE_ORDER = ['form', 'msg', 'quiz', 'inbound_call', 'agency'];
const SOURCE_LABELS = { form: 'Form', msg: 'MSG', quiz: 'Quiz', inbound_call: 'Inbound Call', agency: 'Agency' };
const INDUSTRY_ORDER = ['painting', 'epoxy', 'kitchen_bath', 'reno'];
const INDUSTRY_LABELS = { painting: 'Painting', epoxy: 'Epoxy', kitchen_bath: 'Kitchen & Bath', reno: 'Renovation' };

const bookColor = (v) => v == null ? 'text-slate-500' : v >= 40 ? 'text-green-400' : v >= 20 ? 'text-amber-400' : 'text-red-400';

function getCellBg(bookPct) {
  if (bookPct === null) return 'bg-slate-800/30';
  if (bookPct >= 40) return 'bg-emerald-500/30';
  if (bookPct >= 25) return 'bg-cyan-500/25';
  if (bookPct >= 15) return 'bg-blue-500/20';
  if (bookPct >= 5) return 'bg-slate-600/30';
  return 'bg-slate-800/30';
}

export default function SourceIndustryHeatmap({ leads, inRange }) {
  const { matrix, maxBookings, activeSources, activeIndustries } = useMemo(() => {
    const periodLeads = leads.filter(l =>
      (l.lead_received_date && inRange(l.lead_received_date)) ||
      (!l.lead_received_date && l.created_date && inRange(l.created_date))
    );

    // Build full matrix
    const m = {};
    let maxB = 0;
    SOURCE_ORDER.forEach(src => {
      m[src] = {};
      INDUSTRY_ORDER.forEach(ind => {
        m[src][ind] = { total: 0, booked: 0 };
      });
    });

    // Industry & source totals for filtering
    const indTotals = {};
    const srcTotals = {};
    INDUSTRY_ORDER.forEach(ind => { indTotals[ind] = 0; });
    SOURCE_ORDER.forEach(src => { srcTotals[src] = 0; });

    periodLeads.forEach(l => {
      const src = l.lead_source || 'unknown';
      if (!m[src]) return;
      const industries = l.industries && l.industries.length > 0 ? l.industries : [];
      const isBooked = l.status === 'appointment_booked' || l.status === 'completed' || !!l.date_appointment_set;
      industries.forEach(ind => {
        if (!m[src][ind]) return;
        m[src][ind].total++;
        indTotals[ind] = (indTotals[ind] || 0) + 1;
        srcTotals[src] = (srcTotals[src] || 0) + 1;
        if (isBooked) {
          m[src][ind].booked++;
          if (m[src][ind].booked > maxB) maxB = m[src][ind].booked;
        }
      });
    });

    const activeInd = INDUSTRY_ORDER.filter(ind => indTotals[ind] > 0);
    const activeSrc = SOURCE_ORDER.filter(src => srcTotals[src] > 0);

    return { matrix: m, maxBookings: maxB, activeSources: activeSrc, activeIndustries: activeInd };
  }, [leads, inRange]);

  const tooLittle = activeIndustries.length <= 1 && activeSources.length <= 1;

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
        <Grid3X3 className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Source × Industry Heatmap</h3>
        <span className="text-[10px] text-slate-500 ml-2">Bookings (Book %)</span>
      </div>

      {tooLittle ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Not enough cross-channel data for a heatmap — try a wider date range.
        </div>
      ) : (
        <div className="overflow-x-auto p-4">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-2 text-left">Source</th>
                {activeIndustries.map(ind => (
                  <th key={ind} className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-2 text-center">
                    {INDUSTRY_LABELS[ind]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeSources.map(src => (
                <tr key={src}>
                  <td className="px-3 py-2 text-sm font-medium text-white whitespace-nowrap">
                    {SOURCE_LABELS[src]}
                  </td>
                  {activeIndustries.map(ind => {
                    const cell = matrix[src]?.[ind] || { total: 0, booked: 0 };
                    const bookPct = cell.total > 0 ? parseFloat(((cell.booked / cell.total) * 100).toFixed(1)) : null;
                    const bgClass = getCellBg(bookPct);
                    const opacity = maxBookings > 0 && cell.booked > 0
                      ? 0.4 + (cell.booked / maxBookings) * 0.6
                      : 1;

                    return (
                      <td key={ind} className="px-2 py-2">
                        <div
                          className={`rounded-lg px-3 py-3 text-center ${bgClass} transition-all`}
                          style={{ opacity }}
                        >
                          <div className="text-lg font-bold text-slate-200">{cell.booked}</div>
                          <div className={`text-[10px] font-medium ${bookColor(bookPct)}`}>
                            {bookPct !== null ? `${bookPct}%` : '—'}
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            of {cell.total}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center gap-4 mt-4 px-2">
            <span className="text-[10px] text-slate-500">Book % intensity:</span>
            {[
              { label: '< 5%', cls: 'bg-slate-800/30' },
              { label: '5-15%', cls: 'bg-slate-600/30' },
              { label: '15-25%', cls: 'bg-blue-500/20' },
              { label: '25-40%', cls: 'bg-cyan-500/25' },
              { label: '40%+', cls: 'bg-emerald-500/30' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${l.cls}`} />
                <span className="text-[10px] text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}