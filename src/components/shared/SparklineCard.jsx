import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function useAnimatedNumber(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) { setDisplay(target); return; }
    const start = typeof display === 'number' ? display : 0;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    let raf;
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * ease);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return display;
}

export default function SparklineCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-400',
  iconBg = 'bg-blue-500/10',
  sparkData = [],
  sparkColor = '#60a5fa',
  trend = null,       // { value: number, direction: 'up'|'down', label?: string }
  comparison = null,   // { prior: string|number, change: number, invertColor?: boolean }
  index = 0,
  className = '',
}) {
  const hasSparkline = sparkData.length >= 2;

  // Animate comparison change number
  const animatedChange = useAnimatedNumber(
    comparison ? comparison.change : 0, 500
  );

  const getChangeColor = () => {
    if (!comparison) return '';
    const ch = comparison.change;
    if (ch === 0) return 'text-slate-500';
    const positive = comparison.invertColor ? ch < 0 : ch > 0;
    return positive ? 'text-emerald-400' : 'text-red-400';
  };

  const getChangeBg = () => {
    if (!comparison) return '';
    const ch = comparison.change;
    if (ch === 0) return 'bg-slate-500/10';
    const positive = comparison.invertColor ? ch < 0 : ch > 0;
    return positive ? 'bg-emerald-500/10' : 'bg-red-500/10';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.04 * index, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.03, y: -2 }}
      className={`bg-slate-800/50 rounded-lg border border-slate-700/50 p-3 hover:border-slate-600/50 hover:bg-slate-800/70 transition-colors duration-200 relative overflow-hidden ${className}`}
    >
      {/* Sparkline background */}
      {hasSparkline && (
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
          {Icon && (
            <div className={`p-1 rounded-md ${iconBg}`}>
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
            </div>
          )}
        </div>
        <p className="text-xl font-bold text-white leading-tight">{value}</p>

        {/* Period-over-period comparison row */}
        {comparison && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * index + 0.25, duration: 0.3 }}
            className="flex items-center gap-1.5 mt-1 min-h-[16px]"
          >
            <span className="text-[10px] text-slate-500">
              {comparison.label || 'Prior'}: <span className="font-medium text-slate-400">{comparison.prior}</span>
            </span>
            {comparison.change != null && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.04 * index + 0.4, type: 'spring', stiffness: 300, damping: 20 }}
                className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getChangeBg()} ${getChangeColor()}`}
              >
                {comparison.change > 0 ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : comparison.change < 0 ? (
                  <TrendingDown className="w-2.5 h-2.5" />
                ) : (
                  <Minus className="w-2.5 h-2.5" />
                )}
                {comparison.change > 0 ? '+' : ''}{Math.round(animatedChange)}%
              </motion.span>
            )}
          </motion.div>
        )}

        {/* Legacy trend row */}
        {!comparison && (
          <div className="flex items-center gap-1.5 mt-0.5 min-h-[14px]">
            {trend && (
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                trend.direction === 'up' ? 'text-emerald-400' : trend.direction === 'down' ? 'text-red-400' : 'text-slate-500'
              }`}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : trend.direction === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                {trend.value != null && `${trend.value}%`}
                {trend.label && <span className="text-slate-500 font-normal ml-0.5">{trend.label}</span>}
              </span>
            )}
            {!trend && subtitle && (
              <p className="text-[10px] text-slate-500">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}