'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Zap, BrainCircuit, ShieldCheck, Wallet,
  LineChart, BarChart3, Umbrella, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

const TICKER = [
  { label: 'NIFTY 50',  value: '22,450', change: '+1.2%', positive: true  },
  { label: 'SENSEX',    value: '74,119', change: '+0.8%', positive: true  },
  { label: 'GOLD (10g)',value: '₹72,300',change: '-0.4%', positive: false },
  { label: 'RBI REPO',  value: '6.50%',  change: 'Steady',positive: true  },
  { label: 'USD/INR',   value: '83.45',  change: '+0.1%', positive: false },
  { label: 'NIFTY IT',  value: '38,200', change: '+2.1%', positive: true  },
  { label: 'CRUDE OIL', value: '$82.4',  change: '-0.9%', positive: false },
];

const ET_HEADLINES = [
  { title: 'RBI holds repo rate at 6.5%, signals rate cuts possible in Q3 2025', sentiment: 'positive', time: '2h ago' },
  { title: 'Nifty hits record high; analysts predict 25,000 by December', sentiment: 'positive', time: '4h ago' },
  { title: 'SEBI tightens F&O rules — retail investors to face new restrictions', sentiment: 'neutral', time: '5h ago' },
  { title: 'Gold prices dip as US dollar strengthens; should you buy the dip?', sentiment: 'negative', time: '6h ago' },
  { title: 'Budget 2025: New tax regime gets further sweeteners, 80C unchanged', sentiment: 'positive', time: '8h ago' },
];

const TOOLS = [
  { href: '/dashboard/cfo',         icon: BrainCircuit, label: 'AI CFO Chat',       desc: 'Chat with Gemini about your finances',     color: 'from-purple-500 to-indigo-600',  badge: 'AI Powered' },
  { href: '/dashboard/fire',        icon: ShieldCheck,  label: 'FIRE Sandbox',      desc: 'Project corpus & stress test crashes',     color: 'from-emerald-500 to-teal-600',   badge: 'Math Engine' },
  { href: '/dashboard/tax',         icon: Wallet,       label: 'Tax Optimizer',     desc: 'Old vs New regime — find your savings',    color: 'from-blue-500 to-cyan-600',      badge: 'FY 2024-25' },
  { href: '/dashboard/opportunity', icon: LineChart,    label: 'Opportunity Cost',  desc: 'What your habits cost your FIRE date',     color: 'from-orange-500 to-red-600',     badge: 'Eye Opener' },
  { href: '/dashboard/networth',    icon: BarChart3,    label: 'Net Worth Tracker', desc: 'Track assets, liabilities & net growth',   color: 'from-yellow-500 to-amber-600',   badge: 'New' },
  { href: '/dashboard/insurance',   icon: Umbrella,     label: 'Insurance Planner', desc: 'Calculate ideal term + health cover',      color: 'from-pink-500 to-rose-600',      badge: 'Essential' },
];

// Simple sparkline SVG
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`
  ).join(' ');
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// Corpus growth chart (pure SVG, no library needed)
function CorpusChart({ years = 20 }: { years?: number }) {
  const baseData: { yr: number; base: number; stress: number; target: number }[] = [];
  let base = 5000000, stress = 5000000;
  const target = 30000000;
  for (let y = 0; y <= years; y++) {
    if (y === 5) stress = stress * 0.80; // crash
    baseData.push({ yr: y, base: Math.round(base), stress: Math.round(stress), target });
    base = base * 1.12 + 15000 * 12;
    stress = stress * 1.12 + 15000 * 12;
  }
  const maxVal = Math.max(...baseData.map(d => d.base));
  const W = 480, H = 160;
  const toX = (i: number) => 40 + (i / years) * (W - 60);
  const toY = (v: number) => H - 20 - ((v / maxVal) * (H - 40));
  const basePath = baseData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.base)}`).join(' ');
  const stressPath = baseData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.stress)}`).join(' ');
  const targetY = toY(target);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 10}`} className="overflow-visible">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={40} y1={toY(maxVal * p)} x2={W - 20} y2={toY(maxVal * p)}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4,4" />
      ))}
      {/* Target line */}
      <line x1={40} y1={targetY} x2={W - 20} y2={targetY}
        stroke="#f59e0b" strokeWidth="1" strokeDasharray="6,3" opacity="0.6" />
      <text x={W - 18} y={targetY - 4} fill="#f59e0b" fontSize="9" textAnchor="end" opacity="0.8">Target</text>
      {/* Stress path */}
      <path d={stressPath} fill="none" stroke="#f97316" strokeWidth="1.5"
        strokeDasharray="5,3" opacity="0.7" />
      {/* Base path */}
      <path d={basePath} fill="none" stroke="#10b981" strokeWidth="2" />
      {/* Area fill */}
      <path d={`${basePath} L${toX(years)},${H - 20} L${toX(0)},${H - 20} Z`}
        fill="url(#cg)" opacity="0.15" />
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* X axis labels */}
      {[0, 5, 10, 15, 20].map(y => (
        <text key={y} x={toX(y)} y={H + 8} fill="rgba(255,255,255,0.3)"
          fontSize="9" textAnchor="middle">Y{y}</text>
      ))}
      {/* Y axis */}
      <text x={38} y={toY(maxVal) + 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end">
        {(maxVal / 1e7).toFixed(0)}Cr
      </text>
      <text x={38} y={toY(0)} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end">0</text>
    </svg>
  );
}

// Sentiment gauge
function SentimentGauge({ score }: { score: number }) {
  // score 0-100
  const angle = -90 + (score / 100) * 180;
  const r = 52, cx = 70, cy = 70;
  const rad = (a: number) => (a * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad(angle));
  const ny = cy + r * Math.sin(rad(angle));
  const color = score > 65 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';
  const label = score > 65 ? 'Bullish' : score > 40 ? 'Neutral' : 'Bearish';

  return (
    <svg width="140" height="90" viewBox="0 0 140 90">
      {/* Track arcs */}
      <path d="M18,70 A52,52 0 0,1 122,70" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="8" strokeLinecap="round" />
      <path d="M18,70 A52,52 0 0,1 70,18" fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth="8" strokeLinecap="round" />
      <path d="M70,18 A52,52 0 0,1 122,70" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="8" strokeLinecap="round" />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill={color} />
      {/* Labels */}
      <text x="70" y="86" fill="white" fontSize="11" textAnchor="middle" fontWeight="600">{label}</text>
      <text x="70" y="76" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">{score}/100</text>
    </svg>
  );
}

export default function Dashboard() {
  const [userName, setUserName] = useState('there');
  const router = useRouter();

  useEffect(() => {
    setUserName(localStorage.getItem('userName') ?? 'there');
  }, []);

  const sentimentScore = 68; // Would come from ET RSS agent

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back,{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            {userName}
          </span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Your AI Financial Intelligence Briefing — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </motion.div>

      {/* Live Ticker */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 overflow-hidden flex items-center gap-4">
        <div className="flex items-center gap-2 text-emerald-400 shrink-0 border-r border-white/10 pr-4">
          <Zap className="h-4 w-4" /><span className="font-bold text-xs tracking-widest">LIVE</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2 mx-6">
                <span className="text-gray-400 text-xs">{t.label}</span>
                <span className="text-white font-bold text-sm">{t.value}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${t.positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{t.change}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Corpus Chart — spans 2 cols */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white text-sm">AI Corpus Projection</h2>
              <p className="text-gray-500 text-xs">₹15k SIP at 12% CAGR — Base vs Crash scenario</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />Base</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded border-dashed" />Crash</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded" />Target</span>
            </div>
          </div>
          <CorpusChart years={20} />
          <p className="text-gray-500 text-xs mt-2 text-center">
            Run the <button onClick={() => router.push('/dashboard/fire')} className="text-emerald-400 underline">FIRE Sandbox</button> with your actual numbers for a personalized projection
          </p>
        </motion.div>

        {/* Sentiment + Headlines */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
          <h2 className="font-semibold text-white text-sm mb-1">Market Sentiment</h2>
          <p className="text-gray-500 text-xs mb-3">AI analysis of ET headlines</p>
          <div className="flex justify-center mb-3">
            <SentimentGauge score={sentimentScore} />
          </div>
          <div className="space-y-2 flex-1 overflow-hidden">
            {ET_HEADLINES.slice(0, 3).map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                {h.sentiment === 'positive' ? <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                  : h.sentiment === 'negative' ? <TrendingDown className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                  : <Minus className="h-3 w-3 text-gray-400 shrink-0 mt-0.5" />}
                <p className="text-gray-400 text-xs leading-snug line-clamp-2">{h.title}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-2 text-right">Powered by ET RSS</p>
        </motion.div>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="text-base font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Intelligent Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool, i) => (
            <motion.div key={tool.href}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }} whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => router.push(tool.href)}
              className="group cursor-pointer p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${tool.color} rounded-full blur-[50px] opacity-0 group-hover:opacity-30 transition-opacity`} />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                  <tool.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-[10px] text-gray-500 border border-white/10 px-2 py-0.5 rounded-full">{tool.badge}</span>
              </div>
              <h3 className="font-bold text-white text-base mb-1">{tool.label}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}