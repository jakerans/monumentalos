import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'setter_daily_ai_msg';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getCached() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.date === getTodayKey()) return parsed.message;
    return null;
  } catch { return null; }
}

function setCache(message) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), message }));
}

export default function DailyAIMessage({ user, spiffSummaries, leaderboard, myRank }) {
  const [message, setMessage] = useState(() => getCached());
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (message || loading || !user) return;
    const generate = async () => {
      setLoading(true);
      const firstName = user.full_name?.split(' ')[0] || 'champ';
      const spiffCtx = spiffSummaries.length > 0
        ? spiffSummaries.map(s => `"${s.title}": ${s.progress}/${s.goal} ${s.qualifier}${s.met ? ' (COMPLETED!)' : ''}`).join('; ')
        : 'No active spiffs';
      const rankCtx = myRank ? `Currently ranked #${myRank} out of ${leaderboard.length} setters this month.` : '';
      const topSetter = leaderboard[0];
      const teamCtx = topSetter ? `Team leader has ${topSetter.booked} bookings this month.` : '';

      const prompt = `You are an energetic, motivational coach for a sales setter named ${firstName}. 
Give them a brief, punchy morning message (2-3 sentences max). Include:
1. A personalized greeting
2. One specific, actionable tip for today based on their data
3. An encouraging push

Context:
- ${rankCtx}
- ${teamCtx}
- Active spiffs: ${spiffCtx}
- Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

Keep it conversational, use 1-2 emojis max, and focus on what they can DO today. No generic fluff.`;

      try {
        const res = await base44.integrations.Core.InvokeLLM({ prompt });
        const text = typeof res === 'string' ? res : res?.toString() || '';
        setMessage(text);
        setCache(text);
      } catch {
        setMessage(`Good morning ${firstName}! Let's crush it today — every call gets you closer to the top. 💪`);
      }
      setLoading(false);
    };
    generate();
  }, [user, spiffSummaries, leaderboard, myRank, message, loading]);

  if (!message && !loading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 rounded-xl border border-slate-700/50 p-4 overflow-hidden"
      >
        {/* Subtle animated gradient accent */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #D6FF03, #8b5cf6, transparent)' }}
          animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {loading ? (
              <Loader2 className="w-5 h-5 text-[#D6FF03] animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#D6FF03]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-48 bg-slate-700 rounded shimmer" />
              </div>
            ) : (
              <p className="text-sm text-slate-200 leading-relaxed">{message}</p>
            )}
          </div>
          {/* No dismiss button — always visible */}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}