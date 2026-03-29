'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Zap, BrainCircuit, ShieldCheck, Wallet, LineChart,
  BarChart3, Umbrella, TrendingUp, TrendingDown, Minus,
  ArrowRight
} from 'lucide-react';

const TICKER = [
  { label: 'NIFTY 50',   value: '22,450', change: '+1.2%', pos: true  },
  { label: 'SENSEX',     value: '74,119', change: '+0.8%', pos: true  },
  { label: 'GOLD (10g)', value: '₹72,300',change: '-0.4%', pos: false },
  { label: 'RBI REPO',   value: '6.50%',  change: 'Steady',pos: true  },
  { label: 'USD/INR',    value: '83.45',  change: '+0.1%', pos: false },
  { label: 'NIFTY IT',   value: '38,200', change: '+2.1%', pos: true  },
  { label: 'NIFTY BANK', value: '47,850', change: '+0.5%', pos: true  },
  { label: 'CRUDE OIL',  value: '$82.4',  change: '-0.9%', pos: false },
];

const HEADLINES = [
  { title: 'RBI holds repo at 6.5% — rate cuts likely in Q3 2025', sentiment: 'positive' },
  { title: 'Nifty targets 25,000 by Dec; FIIs net buyers for 3rd week', sentiment: 'positive' },
  { title: 'SEBI tightens F&O rules — retail investors face restrictions', sentiment: 'neutral' },
  { title: 'Gold dips as dollar strengthens — good buying opportunity?', sentiment: 'negative' },
  { title: 'Budget 2025: New tax regime sweetened, 80C limit unchanged', sentiment: 'positive' },
];

const PREDICTIONS = [
  { label: 'NIFTY 50 (3-month)', prediction: '23,800–24,200', confidence: 72, direction: 'up',   basis: 'FII inflows + RBI pause' },
  { label: 'RBI Rate Cut',       prediction: 'Aug 2025',      confidence: 68, direction: 'up',   basis: 'Inflation below 4% target' },
  { label: 'Gold Price',         prediction: '₹75,000/10g',   confidence: 61, direction: 'up',   basis: 'Global uncertainty hedge' },
  { label: 'USD/INR',            prediction: '84.5–85.0',     confidence: 55, direction: 'down',  basis: 'CAD widening pressure' },
  { label: 'NIFTY IT',          prediction: 'Outperform',    confidence: 78, direction: 'up',   basis: 'US tech spending revival' },
  { label: 'Crude Oil',         prediction: '$78–80/bbl',    confidence: 58, direction: 'down',  basis: 'OPEC+ supply discipline' },
];

const TOOLS = [
  { href: '/dashboard/cfo',         icon: BrainCircuit, label: 'AI CFO Chat',       desc: 'Chat with Gemini 2.5 about your FIRE plan',  color: 'from-purple-500 to-indigo-600',  badge: 'Gemini AI' },
  { href: '/dashboard/fire',        icon: ShieldCheck,  label: 'FIRE Sandbox',      desc: 'Project corpus & stress test crashes',        color: 'from-emerald-500 to-teal-600',   badge: 'Math Engine' },
  { href: '/dashboard/tax',         icon: Wallet,       label: 'Tax Optimizer',     desc: 'Old vs New regime — find your savings',       color: 'from-blue-500 to-cyan-600',      badge: 'FY 2024-25' },
  { href: '/dashboard/opportunity', icon: LineChart,    label: 'Opportunity Cost',  desc: 'What your habits cost your FIRE date',        color: 'from-orange-500 to-red-600',     badge: 'Eye Opener' },
  { href: '/dashboard/networth',    icon: BarChart3,    label: 'Net Worth Tracker', desc: 'Track assets, liabilities & net growth',      color: 'from-yellow-500 to-amber-600',   badge: 'Live Calc' },
  { href: '/dashboard/insurance',   icon: Umbrella,     label: 'Insurance Planner', desc: 'Calculate ideal term + health cover amount',  color: 'from-pink-500 to-rose-600',      badge: 'Essential' },
];

function CorpusChart() {
  const years = 20, sip = 15000, r = 0.12 / 12;
  const pts: { y: number; b: number; s: number }[] = [];
  let base = 500000, stress = 500000;
  for (let y = 0; y <= years; y++) {
    pts.push({ y, b: base, s: stress });
    if (y === 5) stress *= 0.80;
    base   = base   * (1 + 0.12) + sip * 12;
    stress = stress * (1 + 0.12) + sip * 12;
  }
  const max = Math.max(...pts.map(p => p.b));
  const W = 460, H = 140;
  const x = (i: number) => 30 + (i / years) * (W - 40);
  const y = (v: number) => H - 10 - (v / max) * (H - 20);
  const bPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.b)}`).join(' ');
  const sPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.s)}`).join(' ');
  const target = 30000000;
  const tY = y(target);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`}>
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={30} y1={y(max * p)} x2={W - 10} y2={y(max * p)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <line x1={30} y1={tY} x2={W - 10} y2={tY}
        stroke="#f59e0b" strokeWidth="1" strokeDasharray="5,3" opacity="0.5" />
      <text x={W - 8} y={tY - 3} fill="#f59e0b" fontSize="8" textAnchor="end" opacity="0.8">Target ₹3Cr</text>
      <path d={`${bPath} L${x(years)},${H - 10} L${x(0)},${H - 10} Z`} fill="url(#bg)" />
      <path d={sPath} fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
      <path d={bPath} fill="none" stroke="#10b981" strokeWidth="2" />
      {[0, 5, 10, 15, 20].map(yr => (
        <text key={yr} x={x(yr)} y={H + 14} fill="rgba(255,255,255,0.25)" fontSize="8" textAnchor="middle">Y{yr}</text>
      ))}
    </svg>
  );
}

function SentimentGauge({ score }: { score: number }) {
  const a = -180 + (score / 100) * 180;
  const r = 44, cx = 60, cy = 56;
  const rad = (d: number) => (d * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad(a));
  const ny = cy + r * Math.sin(rad(a));
  const color = score > 65 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';
  const label = score > 65 ? 'Bullish' : score > 40 ? 'Neutral' : 'Bearish';
  return (
    <svg width="120" height="70" viewBox="0 0 120 70">
      <path d="M16,56 A44,44 0 0,1 104,56" fill="none" stroke="rgba(239,68,68,0.25)" strokeWidth="7" strokeLinecap="round" />
      <path d="M16,56 A44,44 0 0,1 60,12" fill="none" stroke="rgba(245,158,11,0.25)" strokeWidth="7" strokeLinecap="round" />
      <path d="M60,12 A44,44 0 0,1 104,56" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="7" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="3.5" fill={color} />
      <text x="60" y="68" fill="white" fontSize="10" textAnchor="middle" fontWeight="600">{label} {score}/100</text>
    </svg>
  );
}

export default function Dashboard() {
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => { setUserName(localStorage.getItem('userName') ?? ''); }, []);

  return (
    <div className="space-y-6 pb-10">

      {/* Welcome — standalone on top */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back,{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            {userName || 'there'}
          </span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          ET Sentinel — Agentic Wealth Engine &nbsp;·&nbsp;
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Live Ticker */}
      <div className="bg-white/4 border border-white/8 rounded-2xl py-3 px-4 overflow-hidden flex items-center gap-4">
        <div className="flex items-center gap-2 text-emerald-400 shrink-0 border-r border-white/8 pr-4">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="font-bold text-xs tracking-widest">LIVE</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2 mx-6">
                <span className="text-gray-500 text-xs">{t.label}</span>
                <span className="text-white font-bold text-sm">{t.value}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${t.pos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {t.change}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Corpus chart — 2 cols */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white/4 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-white text-sm">AI Corpus Projection</h2>
              <p className="text-gray-500 text-xs">₹15k/mo SIP · 12% CAGR · Base vs 20% Crash at Y5</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-px bg-emerald-400 inline-block" />Base</span>
              <span className="flex items-center gap-1"><span className="w-3 h-px bg-orange-400 inline-block border-dashed" />Crash</span>
              <span className="flex items-center gap-1"><span className="w-3 h-px bg-amber-400 inline-block" />Target</span>
            </div>
          </div>
          <CorpusChart />
          <button onClick={() => router.push('/dashboard/fire')}
            className="mt-3 text-xs text-emerald-400 flex items-center gap-1 hover:gap-2 transition-all">
            Run with your numbers <ArrowRight className="h-3 w-3" />
          </button>
        </motion.div>

        {/* Sentiment */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white/4 border border-white/8 rounded-2xl p-5">
          <h2 className="font-semibold text-white text-sm mb-1">Market Sentiment</h2>
          <p className="text-gray-500 text-xs mb-3">AI analysis of ET news</p>
          <div className="flex justify-center mb-3">
            <SentimentGauge score={68} />
          </div>
          <div className="space-y-2">
            {HEADLINES.slice(0, 4).map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                {h.sentiment === 'positive'
                  ? <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                  : h.sentiment === 'negative'
                  ? <TrendingDown className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                  : <Minus className="h-3 w-3 text-gray-500 shrink-0 mt-0.5" />}
                <p className="text-gray-400 text-xs leading-snug line-clamp-2">{h.title}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Predictions Grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
          ET Sentinel AI Predictions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PREDICTIONS.map((p, i) => (
            <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs">{p.label}</span>
                {p.direction === 'up'
                  ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
              </div>
              <p className="text-white font-bold text-sm mb-2">{p.prediction}</p>
              <div className="mb-1">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600">Confidence</span>
                  <span className={p.confidence > 65 ? 'text-emerald-400' : 'text-amber-400'}>{p.confidence}%</span>
                </div>
                <div className="bg-white/8 rounded-full h-1">
                  <div className={`h-1 rounded-full ${p.confidence > 65 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${p.confidence}%` }} />
                </div>
              </div>
              <p className="text-gray-600 text-xs">{p.basis}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tools Grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" /> Intelligent Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map((tool, i) => (
            <motion.div key={tool.href}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }} whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => router.push(tool.href)}
              className="group cursor-pointer p-5 rounded-2xl bg-white/4 border border-white/8 hover:border-white/15 hover:bg-white/7 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${tool.color} rounded-full blur-[40px] opacity-0 group-hover:opacity-25 transition-opacity`} />
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg`}>
                  <tool.icon className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <span className="text-[10px] text-gray-600 border border-white/8 px-2 py-0.5 rounded-full">{tool.badge}</span>
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{tool.label}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{tool.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-gray-600 group-hover:text-emerald-400 transition-colors">
                Open <ArrowRight className="h-3 w-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}