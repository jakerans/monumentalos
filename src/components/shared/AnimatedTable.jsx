import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

function SortIcon({ direction }) {
  if (direction === 'asc') return <ChevronUp className="w-3 h-3" />;
  if (direction === 'desc') return <ChevronDown className="w-3 h-3" />;
  return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
}

function getValue(row, accessor) {
  if (typeof accessor === 'function') return accessor(row);
  return row[accessor];
}

export default function AnimatedTable({
  columns,       // [{ key, label, accessor, align?, sortable?, render? }]
  data,          // array of row objects (must have .id or unique key)
  rowKey = 'id', // field to use as unique key
  title,
  titleRight,
  emptyMessage = 'No data',
  onRowClick,
  rowClassName,
  initialSort,   // { key, direction }
}) {
  const [sort, setSort] = useState(initialSort || { key: null, direction: null });

  const handleSort = (col) => {
    if (!col.sortable) return;
    setSort(prev => {
      if (prev.key === col.key) {
        if (prev.direction === 'asc') return { key: col.key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
        return { key: col.key, direction: 'asc' };
      }
      return { key: col.key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data;
    const col = columns.find(c => c.key === sort.key);
    if (!col) return data;
    const accessor = col.accessor || col.key;
    return [...data].sort((a, b) => {
      let va = getValue(a, accessor);
      let vb = getValue(b, accessor);
      // Handle strings with $ prefix
      if (typeof va === 'string' && va.startsWith('$')) va = parseFloat(va.replace(/[$,]/g, '')) || 0;
      if (typeof vb === 'string' && vb.startsWith('$')) vb = parseFloat(vb.replace(/[$,]/g, '')) || 0;
      // Null handling
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      // Compare
      if (typeof va === 'number' && typeof vb === 'number') {
        return sort.direction === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sort.direction === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data, sort, columns]);

  const alignClass = (align) => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
    >
      {(title || titleRight) && (
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          {title && <h2 className="text-sm font-bold text-white">{title}</h2>}
          {titleRight}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 text-xs text-slate-400 uppercase">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 ${alignClass(col.align)} ${col.sortable ? 'cursor-pointer select-none group hover:text-slate-200 transition-colors' : ''}`}
                  onClick={() => handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <motion.span
                        animate={{
                          scale: sort.key === col.key ? 1.2 : 1,
                          color: sort.key === col.key ? '#D6FF03' : '#64748b',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <SortIcon direction={sort.key === col.key ? sort.direction : null} />
                      </motion.span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            <AnimatePresence mode="popLayout">
              {sortedData.length === 0 ? (
                <motion.tr
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                    {emptyMessage}
                  </td>
                </motion.tr>
              ) : (
                sortedData.map((row, idx) => {
                  const key = row[rowKey] || idx;
                  return (
                    <motion.tr
                      key={key}
                      layout
                      layoutId={`row-${key}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 350, damping: 30 },
                        opacity: { duration: 0.2 },
                        x: { duration: 0.2 },
                      }}
                      className={`hover:bg-slate-700/20 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${typeof rowClassName === 'function' ? rowClassName(row, idx) : (rowClassName || '')}`}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={`px-3 py-2.5 ${alignClass(col.align)}`}>
                          {col.render ? col.render(row, idx) : getValue(row, col.accessor || col.key)}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}