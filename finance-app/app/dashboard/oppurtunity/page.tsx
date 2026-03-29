'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, TrendingUp } from 'lucide-react';

const HABITS = [
  { label: 'Swiggy / Zomato',      emoji: '🍕', default: 4000  },
  { label: 'OTT Subscriptions',    emoji: '📺', default: 800   },
  { label: 'Impulse Shopping',     emoji: '🛍️', default: 3000 },
  { label: 'Eating Out & Cafes',   emoji: '☕', default: 2500  },
  { label: 'Weekend Parties',      emoji: '🎉', default: 3000  },
  { label: 'Subscriptions / Apps', emoji: '📱', default: 500   },
];

function fv(monthly: number, years: number, cagr = 0.12) {
  if (monthly === 0) return 0;
  const r = cagr / 12, n = years * 12;
  return monthly * (((1 + r) ** n - 1) / r) * (1 + r);
}

function fmt(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export default function OpportunityPage() {
  const [spends, setSpends] = useState(HABITS.map(h => h.default));
  const [years,  setYears]  = useState(20);
  const [cagr,   setCagr]   = useState(12);

  const total  = spends.reduce((a, b) => a + b, 0);
  const corpus = fv(total, years, cagr / 100);
  const gains  = corpus - total * years * 12;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LineChart className="h-6 w-6 text-orange-400" />
          Opportunity Cost Calculator
        </h1>
        <p className="text-gray-400 text-sm">
          See what your daily habits cost you at Nifty's {cagr}% CAGR
        </p>
      </div>

      {/* Big number */}
      <motion.div
        key={`${corpus}-${years}`}
        initial={{ scale: 0.97, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-orange-500/15 to-red-600/8 border border-orange-500/20 rounded-3xl p-8 text-center"
      >
        <p className="text-gray-400 text-sm mb-2">
          If you invested your habits instead of spending
        </p>
        <p className="text-5xl font-black text-white mb-1">{fmt(corpus)}</p>
        <p className="text-orange-400 text-sm">in {years} years at {cagr}% CAGR</p>
        <div className="flex justify-center gap-8 mt-5">
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-1">Monthly habits</p>
            <p className="text-white font-bold">₹{total.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-1">Total invested</p>
            <p className="text-white font-bold">₹{(total * years * 12 / 1e5).toFixed(1)}L</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-1">Pure gains</p>
            <p className="text-emerald-400 font-bold">{fmt(gains)}</p>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-300">⏱️ Time horizon</label>
              <span className="text-emerald-400 font-mono text-sm">{years} yrs</span>
            </div>
            <input type="range" min={3} max={35} step={1} value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full accent-emerald-500" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-300">📈 Expected CAGR</label>
              <span className="text-purple-400 font-mono text-sm">{cagr}%</span>
            </div>
            <input type="range" min={6} max={18} step={0.5} value={cagr}
              onChange={e => setCagr(Number(e.target.value))}
              className="w-full accent-purple-500" />
          </div>
        </div>

        <div className="border-t border-white/8 pt-5 space-y-4">
          {HABITS.map((h, i) => (
            <div key={h.label}>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-white">{h.emoji} {h.label}</label>
                <div className="text-right">
                  <span className="text-orange-400 font-mono text-sm">
                    ₹{spends[i].toLocaleString()}/mo
                  </span>
                  <span className="text-gray-600 text-xs ml-2">
                    = {fmt(fv(spends[i], years, cagr / 100))} in {years}y
                  </span>
                </div>
              </div>
              <input type="range" min={0} max={15000} step={100} value={spends[i]}
                onChange={e => {
                  const s = [...spends];
                  s[i] = Number(e.target.value);
                  setSpends(s);
                }}
                className="w-full accent-orange-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-orange-400" />
            Biggest opportunity
          </p>
          {(() => {
            const max = Math.max(...spends);
            const idx = spends.indexOf(max);
            return (
              <>
                <p className="text-white font-bold">{HABITS[idx].emoji} {HABITS[idx].label}</p>
                <p className="text-orange-400 text-sm">
                  {fmt(fv(max, years, cagr / 100))} if invested over {years}y
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Cutting 50% adds {fmt(fv(max * 0.5, years, cagr / 100))} to your corpus
                </p>
              </>
            );
          })()}
        </div>
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-4">
          <p className="text-gray-400 text-xs mb-2">🔥 FIRE date impact</p>
          <p className="text-white font-bold">Retire ~2 years earlier</p>
          <p className="text-emerald-400 text-sm">
            By investing ₹{total.toLocaleString()}/mo instead of spending
          </p>
          <p className="text-gray-500 text-xs mt-1">
            That's {fmt(fv(total, 2, cagr / 100))} extra in just 2 years
          </p>
        </div>
      </div>
    </div>
  );
}