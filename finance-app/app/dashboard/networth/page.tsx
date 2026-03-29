'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Plus, Trash2, RefreshCw } from 'lucide-react';

interface Item { label: string; amount: number; }

const DEFAULT_ASSETS: Item[] = [
  { label: 'Mutual Funds / SIP',  amount: 500000  },
  { label: 'Fixed Deposits',       amount: 200000  },
  { label: 'PPF / EPF',            amount: 150000  },
  { label: 'Stocks / Equity',      amount: 100000  },
];
const DEFAULT_LIABILITIES: Item[] = [
  { label: 'Home Loan',            amount: 2000000 },
  { label: 'Car Loan',             amount: 300000  },
  { label: 'Personal Loan',        amount: 100000  },
];

function fmt(n: number) {
  const abs = Math.abs(n);
  const prefix = n < 0 ? '-' : '';
  if (abs >= 1e7) return `${prefix}₹${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${prefix}₹${(abs / 1e5).toFixed(1)}L`;
  return `${prefix}₹${abs.toLocaleString('en-IN')}`;
}

export default function NetWorthPage() {
  const [assets,      setAssets]      = useState<Item[]>(DEFAULT_ASSETS);
  const [liabilities, setLiabilities] = useState<Item[]>(DEFAULT_LIABILITIES);
  const [calculated,  setCalculated]  = useState(false);

  const totalAssets      = assets.reduce((s, i) => s + (i.amount || 0), 0);
  const totalLiabilities = liabilities.reduce((s, i) => s + (i.amount || 0), 0);
  const netWorth         = totalAssets - totalLiabilities;
  const ratio            = totalAssets > 0 ? ((netWorth / totalAssets) * 100).toFixed(0) : '0';

  const update = (arr: Item[], set: (v: Item[]) => void, i: number, k: keyof Item, v: any) => {
    const c = [...arr]; c[i] = { ...c[i], [k]: k === 'amount' ? Number(v) : v }; set(c);
  };
  const remove = (arr: Item[], set: (v: Item[]) => void, i: number) => set(arr.filter((_, j) => j !== i));
  const add    = (arr: Item[], set: (v: Item[]) => void) => set([...arr, { label: 'New Item', amount: 0 }]);

  const ItemRow = ({ item, i, arr, set }: { item: Item; i: number; arr: Item[]; set: any }) => (
    <div className="flex items-center gap-2">
      <input value={item.label} onChange={e => update(arr, set, i, 'label', e.target.value)}
        className="flex-1 bg-black/20 border border-white/8 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-emerald-500" />
      <div className="relative">
        <span className="absolute left-2.5 top-2 text-gray-500 text-sm">₹</span>
        <input type="number" value={item.amount}
          onChange={e => update(arr, set, i, 'amount', e.target.value)}
          className="w-32 bg-black/20 border border-white/8 rounded-lg py-2 pl-6 pr-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
      </div>
      <button onClick={() => remove(arr, set, i)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-yellow-400" /> Net Worth Tracker
        </h1>
        <p className="text-gray-400 text-sm">Enter your assets and liabilities to calculate your true net worth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assets */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
          <h3 className="text-emerald-400 font-semibold text-sm mb-3">💰 Assets</h3>
          <div className="space-y-2 mb-3">
            {assets.map((item, i) => <ItemRow key={i} item={item} i={i} arr={assets} set={setAssets} />)}
          </div>
          <button onClick={() => add(assets, setAssets)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add asset
          </button>
          <div className="border-t border-white/8 mt-3 pt-3 flex justify-between">
            <span className="text-gray-400 text-sm">Total Assets</span>
            <span className="text-emerald-400 font-bold">{fmt(totalAssets)}</span>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
          <h3 className="text-red-400 font-semibold text-sm mb-3">🏦 Liabilities</h3>
          <div className="space-y-2 mb-3">
            {liabilities.map((item, i) => <ItemRow key={i} item={item} i={i} arr={liabilities} set={setLiabilities} />)}
          </div>
          <button onClick={() => add(liabilities, setLiabilities)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add liability
          </button>
          <div className="border-t border-white/8 mt-3 pt-3 flex justify-between">
            <span className="text-gray-400 text-sm">Total Liabilities</span>
            <span className="text-red-400 font-bold">{fmt(totalLiabilities)}</span>
          </div>
        </div>
      </div>

      {/* Calculate button */}
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={() => setCalculated(true)}
        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
        <RefreshCw className="h-4 w-4" /> Calculate Net Worth
      </motion.button>

      {/* Result */}
      {calculated && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 text-center border ${
            netWorth >= 0 ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-red-500/8 border-red-500/20'
          }`}>
          <p className="text-gray-400 text-sm mb-2">Your Net Worth</p>
          <p className={`text-5xl font-black mb-4 ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmt(netWorth)}
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div><p className="text-emerald-400 text-xs">Assets</p><p className="text-white font-bold text-sm">{fmt(totalAssets)}</p></div>
            <div><p className="text-red-400 text-xs">Liabilities</p><p className="text-white font-bold text-sm">{fmt(totalLiabilities)}</p></div>
            <div><p className="text-gray-400 text-xs">Ratio</p><p className="text-white font-bold text-sm">{ratio}%</p></div>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            {Number(ratio) >= 50
              ? '✅ Healthy — more than half your assets are unencumbered'
              : Number(ratio) >= 0
              ? '⚠️ Fair — focus on reducing liabilities while growing assets'
              : '🚨 Negative net worth — prioritise debt repayment urgently'}
          </p>
        </motion.div>
      )}
    </div>
  );
}