import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import LeaderboardRankPreview from './LeaderboardRankPreview';

const RANK_PRESETS = [
  { label: '#3', rank: 3, emoji: '🥉' },
  { label: '#2', rank: 2, emoji: '🥈' },
  { label: '#1', rank: 1, emoji: '🥇' },
  { label: 'Reset', rank: null, emoji: null },
];

export default function RankPreviewTester() {
  const [rank, setRank] = useState(null);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Leaderboard Rank Tester</h3>
        </div>
        <div className="p-3">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Select Rank</p>
          <div className="flex flex-wrap gap-1.5">
            {RANK_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setRank(p.rank)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  rank === p.rank
                    ? p.rank === 1
                      ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                      : p.rank === null
                      ? 'bg-slate-600 text-slate-200'
                      : 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                    : p.rank === null
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : p.rank === 1
                    ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25'
                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25'
                }`}
              >
                {p.emoji && <span className="mr-0.5">{p.emoji}</span>}{p.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Preview */}
      <LeaderboardRankPreview rank={rank} />
    </div>
  );
}