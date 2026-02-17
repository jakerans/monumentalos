import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
  index = 0,
  className = '',
}) {
  const hasSparkline = sparkData.length >= 2;

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
      </div>
    </motion.div>
  );
}