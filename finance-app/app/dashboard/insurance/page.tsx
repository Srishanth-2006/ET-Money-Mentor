'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Umbrella, RefreshCw } from 'lucide-react';

export default function InsurancePage() {
  const [income,     setIncome]     = useState(1500000);
  const [age,        setAge]        = useState(30);
  const [loans,      setLoans]      = useState(2000000);
  const [dependents, setDependents] = useState(2);
  const [smoker,     setSmoker]     = useState(false);
  const [shown,      setShown]      = useState(false);

  const termCover    = Math.max(income * 15, loans + income * 10);
  const healthCover  = age < 35 ? 500000 : age < 45 ? 1000000 : 2000000;
  const ageMultiplier = smoker ? 1.5 : 1;
  const termPremium  = Math.round((termCover / 1000000) * (age < 35 ? 8000 : age < 45 ? 12000 : 18000) * ageMultiplier);
  const healthPremium = Math.round(healthCover * 0.005 * (dependents + 1) * (age > 40 ? 1.3 : 1));
  const totalPremium  = termPremium + healthPremium;

  const fmt = (n: number) => n >= 1e7 ? `₹${(n / 1e7).toFixed(1)} Cr` : `₹${(n / 1e5).toFixed(0)}L`;
  const fmtNum = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const SLIDERS = [
    { label: 'Annual Income',     value: income,     set: setIncome,     min: 300000,   max: 10000000, step: 100000, display: (v: number) => fmt(v)  },
    { label: 'Current Age',       value: age,        set: setAge,        min: 18,       max: 65,       step: 1,      display: (v: number) => `${v} yrs` },
    { label: 'Outstanding Loans', value: loans,      set: setLoans,      min: 0,        max: 10000000, step: 100000, display: (v: number) => fmt(v)  },
    { label: 'Dependents',        value: dependents, set: setDependents, min: 0,        max: 6,        step: 1,      display: (v: number) => `${v} people` },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Umbrella className="h-6 w-6 text-pink-400" /> Insurance Planner
        </h1>
        <p className="text-gray-400 text-sm">Calculate your ideal term insurance + health cover</p>
      </div>

      <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-5">
        {SLIDERS.map(s => (
          <div key={s.label}>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm text-gray-300">{s.label}</label>
              <span className="text-pink-400 font-mono text-sm">{s.display(s.value)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(Number(e.target.value))} className="w-full accent-pink-500" />
          </div>
        ))}

        <div className="flex items-center justify-between bg-white/4 rounded-xl px-4 py-3">
          <label className="text-sm text-gray-300">🚬 Smoker (affects premium)</label>
          <button onClick={() => setSmoker(!smoker)}
            className={`w-10 h-5 rounded-full transition-colors relative ${smoker ? 'bg-red-500' : 'bg-white/15'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${smoker ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShown(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20">
          <RefreshCw className="h-4 w-4" /> Calculate Coverage
        </motion.button>
      </div>

      {shown && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-5">
              <p className="text-pink-400 text-xs font-semibold mb-2">🛡️ Term Insurance Cover</p>
              <p className="text-3xl font-black text-white">{fmt(termCover)}</p>
              <p className="text-gray-400 text-sm mt-2">Est. annual premium</p>
              <p className="text-white font-bold text-lg">{fmtNum(termPremium)}/year</p>
              <p className="text-gray-500 text-xs mt-2">= {fmtNum(Math.round(termPremium / 12))}/month</p>
              <div className="mt-3 pt-3 border-t border-white/8 text-xs text-gray-500 space-y-1">
                <p>Formula: max(15× income, loans + 10× income)</p>
                {smoker && <p className="text-red-400">⚠️ 50% loading applied for smoker</p>}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
              <p className="text-blue-400 text-xs font-semibold mb-2">🏥 Health Insurance Cover</p>
              <p className="text-3xl font-black text-white">{fmt(healthCover)}</p>
              <p className="text-gray-400 text-sm mt-2">Est. annual premium</p>
              <p className="text-white font-bold text-lg">{fmtNum(healthPremium)}/year</p>
              <p className="text-gray-500 text-xs mt-2">For {dependents + 1} members (you + {dependents})</p>
              <div className="mt-3 pt-3 border-t border-white/8 text-xs text-gray-500 space-y-1">
                <p>Recommended: floater policy for family</p>
                {age > 40 && <p className="text-amber-400">⚠️ 30% loading for age {age}+</p>}
              </div>
            </div>
          </div>

          <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold">Total Insurance Cost</h3>
              <p className="text-2xl font-black text-white">{fmtNum(totalPremium)}/year</p>
            </div>
            <div className="bg-white/5 rounded-xl h-2 mb-2">
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 h-2 rounded-xl"
                style={{ width: `${Math.min(100, (totalPremium / income) * 100 * 10)}%` }} />
            </div>
            <p className="text-gray-400 text-sm">
              That's just <span className="text-white font-bold">{((totalPremium / income) * 100).toFixed(1)}%</span> of your income
              for complete financial protection. <span className="text-emerald-400">Highly recommended.</span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}