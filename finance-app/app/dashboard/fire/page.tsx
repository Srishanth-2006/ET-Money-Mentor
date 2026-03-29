'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function FirePage() {
  const [form, setForm] = useState({ age: 30, retireAt: 50, income: 150000, expenses: 70000, savings: 500000, sip: 10000, risk: 'Moderate', discretionary: 6000 });
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const analyze = async () => {
    setLoading(true); setError('');
    const msg = `I am ${form.age} years old. I earn ₹${form.income}/month and spend ₹${form.expenses}/month. I have ₹${form.savings} in savings and invest ₹${form.sip}/month in SIP. I spend ₹${form.discretionary}/month on food delivery. I want to retire at ${form.retireAt}. Risk profile: ${form.risk}.`;
    try {
      const fd = new FormData(); fd.append('message', msg);
      const res = await fetch('http://127.0.0.1:8000/api/analyze', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.status === 'success') setPlan(json.data);
      else setError(json.message);
    } catch { setError('Backend offline. Run: uvicorn server:app --reload'); }
    finally { setLoading(false); }
  };

  const Field = ({ label, field, type = 'number', prefix = '₹', options }: any) => (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      {type === 'select' ? (
        <select value={(form as any)[field]} onChange={e => set(field, e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-emerald-500">
          {options.map((o: string) => <option key={o} value={o} className="bg-[#0B0E14]">{o}</option>)}
        </select>
      ) : (
        <div className="relative">
          {prefix && <span className="absolute left-3 top-2.5 text-gray-500 text-sm">{prefix}</span>}
          <input type="number" value={(form as any)[field]}
            onChange={e => set(field, Number(e.target.value))}
            className={`w-full bg-black/30 border border-white/10 rounded-xl py-2.5 ${prefix ? 'pl-7' : 'pl-3'} pr-3 text-white text-sm focus:outline-none focus:border-emerald-500`}
          />
        </div>
      )}
    </div>
  );

  const fmt = { cr: (n: number) => `₹${(n / 1e7).toFixed(2)} Cr`, lakh: (n: number) => n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}` };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-teal-400" /> FIRE Sandbox
        </h1>
        <p className="text-gray-400 text-sm">Project your retirement corpus & stress test against market crashes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white text-sm mb-2">Your Financial Profile</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current Age" field="age" prefix="" />
            <Field label="Retire At" field="retireAt" prefix="" />
            <Field label="Monthly Income" field="income" />
            <Field label="Monthly Expenses" field="expenses" />
            <Field label="Current Savings" field="savings" />
            <Field label="Existing SIP/month" field="sip" />
            <Field label="Food Delivery/month" field="discretionary" />
            <Field label="Risk Profile" field="risk" type="select" options={['Conservative', 'Moderate', 'Aggressive']} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={analyze} disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Running Agents...</> : <><TrendingUp className="h-4 w-4" />Run FIRE Analysis</>}
          </motion.button>
          {error && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-3">{error}</p>}
        </div>

        {/* Results */}
        <AnimatePresence>
          {plan ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
              <div className={`flex items-center gap-3 rounded-2xl p-4 border ${plan.status.includes('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                {plan.status.includes('✅') ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
                <p className="font-semibold text-sm">{plan.status}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Target Corpus', v: fmt.cr(plan.target_corpus_needed), sub: '25× annual expenses' },
                  { l: 'Projected Corpus', v: fmt.cr(plan.projected_corpus_at_retirement), sub: 'At retirement' },
                  { l: 'Monthly SIP', v: fmt.lakh(plan.total_monthly_sip), sub: `Existing: ${fmt.lakh(plan.existing_sip)}` },
                  { l: 'Time to FIRE', v: `${plan.years_to_invest} yrs`, sub: `${plan.expected_return_pct}% CAGR` },
                ].map(m => (
                  <div key={m.l} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-xs mb-1">{m.l}</p>
                    <p className="text-white font-bold text-lg">{m.v}</p>
                    <p className="text-gray-500 text-xs">{m.sub}</p>
                  </div>
                ))}
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                <p className="text-orange-400 text-xs font-semibold mb-2">⚡ Stress Test — 20% Market Crash in Year 5</p>
                <p className="text-white font-bold">{fmt.cr(plan.stress_test.stressed_corpus)}</p>
                <p className="text-orange-300 text-sm mt-1">{plan.stress_test.status}</p>
              </div>
              {plan.lost_opportunity_cost && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <p className="text-purple-400 text-xs font-semibold mb-1">💸 Food Delivery Opportunity Cost</p>
                  <p className="text-white font-bold">{fmt.cr(plan.lost_opportunity_cost)}</p>
                  <p className="text-purple-300 text-xs">That's what your ₹{form.discretionary.toLocaleString()}/mo habit costs over {plan.years_to_invest} years</p>
                </div>
              )}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-gray-400 text-xs">{plan.macro_note}</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Fill in your profile and run the analysis →
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}