'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function TaxPage() {
  const [income,  setIncome]  = useState(1500000);
  const [sec80c,  setSec80c]  = useState(150000);
  const [hra,     setHra]     = useState(120000);
  const [sec80d,  setSec80d]  = useState(25000);
  const [nps,     setNps]     = useState(50000);
  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const analyze = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('annual_income', String(income));
      fd.append('sec80c',        String(sec80c));
      fd.append('hra',           String(hra));
      fd.append('sec80d',        String(sec80d));
      fd.append('nps',           String(nps));
      const res  = await fetch('http://127.0.0.1:8000/api/tax', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.status === 'success') setResult(json.data);
      else setError(json.message ?? 'Error from backend');
    } catch {
      setError('Cannot reach backend. Run uvicorn from ETMoneyMentor folder.');
    }
    setLoading(false);
  };

  const fmt    = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  const fmtSlider = (n: number, max: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

  const FIELDS = [
    { label: 'Annual Income (CTC)',         value: income,  set: setIncome,  min: 300000,  max: 10000000, step: 50000  },
    { label: 'Section 80C (ELSS/PPF/LIC)', value: sec80c,  set: setSec80c,  min: 0,       max: 150000,   step: 5000   },
    { label: 'HRA Exemption Claimed',       value: hra,     set: setHra,     min: 0,       max: 600000,   step: 5000   },
    { label: 'Section 80D (Health Ins.)',   value: sec80d,  set: setSec80d,  min: 0,       max: 50000,    step: 1000   },
    { label: 'NPS 80CCD(1B) Contribution', value: nps,     set: setNps,     min: 0,       max: 50000,    step: 1000   },
  ];

  const totalDeductions = 50000 + sec80c + hra + sec80d + nps;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="h-6 w-6 text-blue-400" /> Tax Optimizer
        </h1>
        <p className="text-gray-400 text-sm">FY 2024-25 — Old Regime vs New Regime Comparison</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        <p className="text-xs text-gray-500 border-b border-white/8 pb-3">
          Total deductions in Old Regime: <span className="text-white font-semibold">{fmt(totalDeductions)}</span>
          &nbsp;(₹50k standard + your inputs)
        </p>
        {FIELDS.map(f => (
          <div key={f.label}>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm text-gray-300">{f.label}</label>
              <span className="text-blue-400 font-mono text-sm">{fmtSlider(f.value, f.max)}</span>
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step}
              value={f.value} onChange={e => f.set(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5 rounded-full" />
            <div className="flex justify-between text-xs text-gray-600 mt-0.5">
              <span>₹0</span>
              <span>{fmtSlider(f.max, f.max)}</span>
            </div>
          </div>
        ))}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={analyze} disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20">
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Calculating...</>
            : <><Wallet className="h-4 w-4" />Compare Regimes</>}
        </motion.button>
        {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-3">{error}</p>}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Winner banner */}
            <div className={`flex items-center gap-3 rounded-2xl p-4 border ${
              result.better_regime === 'New Regime'
                ? 'bg-blue-500/10 border-blue-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">✅ {result.better_regime} is better for you</p>
                <p className="text-emerald-400 text-sm">Save <strong>{fmt(result.savings)}</strong>/year = {fmt(result.savings / 12)}/month extra take-home</p>
              </div>
            </div>

            {/* Side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-2xl p-5 border ${result.better_regime === 'Old Regime' ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-white/8 bg-white/4'}`}>
                <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  Old Regime {result.better_regime === 'Old Regime' && <span className="text-emerald-400">✓ Winner</span>}
                </p>
                <p className="text-2xl font-bold text-white">{fmt(result.old_regime_tax)}</p>
                <p className="text-gray-500 text-xs mt-2">Deductions used: {fmt(result.deductions_used)}</p>
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <p>✓ 80C: up to ₹1.5L</p>
                  <p>✓ HRA exemption</p>
                  <p>✓ 80D + NPS deductions</p>
                </div>
              </div>
              <div className={`rounded-2xl p-5 border ${result.better_regime === 'New Regime' ? 'border-blue-500/30 bg-blue-500/8' : 'border-white/8 bg-white/4'}`}>
                <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  New Regime {result.better_regime === 'New Regime' && <span className="text-blue-400">✓ Winner</span>}
                </p>
                <p className="text-2xl font-bold text-white">{fmt(result.new_regime_tax)}</p>
                <p className="text-gray-500 text-xs mt-2">Standard deduction: ₹75,000</p>
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <p>✓ Lower slab rates</p>
                  <p>✓ No investment lock-in</p>
                  <p>✗ No 80C/HRA deductions</p>
                </div>
              </div>
            </div>

            <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
              <p className="text-gray-300 text-sm flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                {result.better_regime === 'New Regime'
                  ? `Switch to New Regime — simpler filing, lower rates. Invest the ₹${Math.round(result.savings / 12).toLocaleString('en-IN')}/month saved into Nifty index funds instead.`
                  : `Stick with Old Regime — maximize all deductions. Ensure ₹1.5L in ELSS/PPF (80C), ₹25k health insurance (80D), and ₹50k NPS (80CCD).`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}