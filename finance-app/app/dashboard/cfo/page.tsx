'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, BrainCircuit, Upload, X, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'chat' | 'analysis';
  plan?: any;
}

const STARTERS = [
  "I'm 28, earn 15 LPA, spend 60k/month. What's my FIRE number?",
  "Should I choose Old or New tax regime? I earn 12 LPA.",
  "I have ₹5 lakhs to invest. What should I do?",
  "What is FIRE and how do I plan for it?",
];

// Detect if message is financial query or casual chat
function isFinancialQuery(text: string): boolean {
  const keywords = [
    'lpa', 'salary', 'income', 'earn', 'spend', 'expense', 'retire',
    'fire', 'sip', 'invest', 'corpus', 'tax', 'savings', 'month',
    'lakh', 'crore', 'insurance', 'mutual fund', 'nifty', 'age',
    'years old', 'year old', 'per month', '/month',
  ];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// Format the analysis plan into beautiful readable cards
function AnalysisCard({ plan }: { plan: any }) {
  const fmt = {
    cr:   (n: number) => `₹${(n / 1e7).toFixed(2)} Cr`,
    lakh: (n: number) => n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${Math.round(n).toLocaleString('en-IN')}`,
    inr:  (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`,
  };

  const onTrack = plan?.status?.includes('✅');

  if (!plan || !plan.target_corpus_needed) return null;

  return (
    <div className="space-y-3 w-full">
      {/* Status */}
      <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
        onTrack ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      }`}>
        {onTrack ? '✅' : '⚠️'} {plan.status?.replace('✅ ', '').replace('⚠️ ', '')}
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: '🎯 Target Corpus',   value: fmt.cr(plan.target_corpus_needed),            sub: '25× annual expenses'         },
          { label: '📈 Projected',        value: fmt.cr(plan.projected_corpus_at_retirement),  sub: 'At retirement'               },
          { label: '💰 Monthly SIP',      value: fmt.inr(plan.total_monthly_sip),              sub: `Existing: ${fmt.inr(plan.existing_sip ?? 0)}` },
          { label: '⏱️ Years to FIRE',   value: `${plan.years_to_invest} years`,              sub: `${plan.expected_return_pct}% CAGR` },
        ].map(m => (
          <div key={m.label} className="bg-white/5 border border-white/8 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">{m.label}</p>
            <p className="text-white font-bold text-base">{m.value}</p>
            <p className="text-gray-500 text-xs">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Tax insight */}
      {plan.tax_comparison && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-blue-400 text-xs font-semibold mb-1">💰 Tax Optimizer</p>
          <p className="text-white text-sm">
            <span className="font-bold">{plan.tax_comparison.better_regime}</span> saves you{' '}
            <span className="text-emerald-400 font-bold">
              {fmt.inr(plan.tax_comparison.savings)}/year
            </span>
            {' '}= {fmt.inr(Math.round(plan.tax_comparison.savings / 12))}/month extra take-home
          </p>
        </div>
      )}

      {/* Stress test */}
      {plan.stress_test && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
          <p className="text-orange-400 text-xs font-semibold mb-1">⚡ Stress Test — 20% Market Crash</p>
          <p className="text-white text-sm">{plan.stress_test.status}</p>
          {plan.stress_test.extra_years_if_crash > 0 && (
            <p className="text-orange-300 text-xs mt-1">
              Need {plan.stress_test.extra_years_if_crash} extra years if crash happens at year 5
            </p>
          )}
        </div>
      )}

      {/* Insurance alert */}
      {plan.insurance_alert && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <p className="text-red-400 text-xs font-semibold mb-1">🚨 Critical Gap</p>
          <p className="text-white text-sm">
            No life insurance detected. Get a term plan of at least{' '}
            <span className="text-red-400 font-bold">
              {fmt.cr((plan.profile_summary?.monthly_income ?? 50000) * 12 * 10)}
            </span>{' '}
            before investing — costs only ~₹8,000–12,000/year.
          </p>
        </div>
      )}

      {/* ET Fund alerts */}
      {plan.et_fund_alerts?.length > 0 && plan.et_fund_alerts.map((alert: string, i: number) => (
        <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <p className="text-amber-300 text-xs">{alert}</p>
        </div>
      ))}

      {/* Macro */}
      {plan.macro_note && (
        <div className="bg-white/4 border border-white/8 rounded-xl p-3">
          <p className="text-gray-500 text-xs font-semibold mb-1">📡 ET Live Context</p>
          <p className="text-gray-300 text-xs leading-relaxed">{plan.macro_note}</p>
        </div>
      )}
    </div>
  );
}

// Smart casual response for non-financial queries
function getCasualResponse(text: string): string {
  const lower = text.toLowerCase().trim();

  if (['hi', 'hello', 'hey', 'hii', 'helo'].some(g => lower === g || lower.startsWith(g + ' '))) {
    return "Hey! 👋 I'm your AI Financial CFO. Tell me your age, income, and expenses and I'll build you a complete FIRE plan — retirement corpus, monthly SIP, tax optimization, and stress testing. Try: *\"I'm 28, earn 15 LPA, spend 60k/month, want to retire at 50\"*";
  }
  if (lower.includes('what is fire') || lower.includes('what is f.i.r.e')) {
    return "**FIRE** stands for **Financial Independence, Retire Early**. 🔥\n\nThe core idea:\n- Save and invest aggressively (typically 50–70% of income)\n- Build a corpus = **25× your annual expenses** (the 4% rule)\n- Live off 4% of that corpus forever\n\nExample: If you spend ₹60k/month (₹7.2L/year), your FIRE number is ₹1.8 Cr. Tell me your numbers and I'll calculate yours!";
  }
  if (lower.includes('what can you do') || lower.includes('help')) {
    return "Here's what I can do for you:\n\n📊 **FIRE Planning** — Calculate your retirement corpus & monthly SIP\n💰 **Tax Optimization** — Old vs New regime comparison\n⚡ **Stress Testing** — Simulate 2008-style market crashes\n🍕 **Opportunity Cost** — See what habits cost your FIRE date\n🏥 **Insurance Check** — Flag if you're underinsured\n📡 **ET Live Data** — Real-time RBI repo rate & market context\n\nJust tell me your age, income, and expenses to get started!";
  }
  if (lower.includes('thank')) {
    return "Happy to help! 😊 Your financial future is worth planning carefully. Any other questions about your FIRE journey?";
  }
  return "I'm specialized in personal finance for Indian investors! Ask me about your FIRE number, tax regime, SIP planning, or investment strategy. Or just tell me: *\"I'm [age], earn [X] LPA, spend [Y]k/month\"* and I'll build your complete plan.";
}

export default function CFOPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      type: 'chat',
      content: "👋 Hello! I'm **ET Sentinel**, your AI Financial CFO powered by Gemini 2.5 Flash.\n\nTell me your **age, income, and monthly expenses** and I'll instantly build you:\n- 📊 Your FIRE corpus target\n- 💰 Monthly SIP needed\n- 🧾 Tax regime comparison\n- ⚡ Crash stress test\n\nYou can also upload a Swiggy/Zomato receipt and I'll calculate your opportunity cost!",
    }
  ]);
  const [input,   setInput]   = useState('');
  const [file,    setFile]    = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (msg?: string) => {
    const text = msg ?? input;
    if (!text.trim()) return;
    setInput('');

    const userMsg: Message = { role: 'user', type: 'chat', content: text };
    setMessages(prev => [...prev, userMsg]);

    // If casual message — respond without hitting backend
    if (!isFinancialQuery(text)) {
      const casual = getCasualResponse(text);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', type: 'chat', content: casual }]);
      }, 400);
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('message', text);
      if (file) { form.append('file', file); setFile(null); }

      const res  = await fetch('http://127.0.0.1:8000/api/analyze', { method: 'POST', body: form });
      const json = await res.json();

      if (json.status === 'success') {
        const plan = json.data;
        // Check if extraction returned zeros (fallback)
        const hasValidData = plan.target_corpus_needed > 0 && plan.years_to_invest < 60;

        if (hasValidData) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            type: 'analysis',
            content: '',
            plan,
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            type: 'chat',
            content: "I couldn't extract your financial details clearly. Could you rephrase like:\n\n*\"I'm 28 years old, I earn ₹15 LPA (lakhs per annum), my monthly expenses are ₹60,000, and I want to retire at 50.\"*\n\nThe more specific you are, the more accurate your FIRE plan will be!",
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant', type: 'chat',
          content: `❌ Backend error: ${json.message}`,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant', type: 'chat',
        content: '❌ Cannot reach backend. Make sure uvicorn is running from the `ETMoneyMentor` folder.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Render markdown-style bold text
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i} className="text-gray-300">{part.slice(1, -1)}</em>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-purple-400" />
          AI Financial CFO
        </h1>
        <p className="text-gray-500 text-sm">ET Sentinel — Gemini 2.5 Flash + 5-agent pipeline</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}

              <div className={`max-w-[85%] ${m.role === 'user'
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-white rounded-2xl rounded-tr-sm px-4 py-3'
                : m.type === 'analysis'
                ? 'w-full'
                : 'bg-white/5 border border-white/10 text-gray-200 rounded-2xl rounded-tl-sm px-4 py-3'
              }`}>
                {m.type === 'analysis' && m.plan
                  ? <AnalysisCard plan={m.plan} />
                  : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {m.content.split('\n').map((line, li) => (
                        <p key={li} className={line === '' ? 'h-2' : 'mb-0.5'}>
                          {renderText(line)}
                        </p>
                      ))}
                    </div>
                  )
                }
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
              <span className="text-gray-500 text-xs ml-2">ET Sentinel is analyzing...</span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick starters — shown only at beginning */}
      {messages.length === 1 && (
        <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
          {STARTERS.map((s, i) => (
            <button key={i} onClick={() => send(s)}
              className="text-xs text-gray-400 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 hover:border-purple-500/40 hover:text-purple-300 transition-colors text-left leading-snug">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 shrink-0">
        {file && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 mb-2 bg-emerald-500/10 rounded-lg px-3 py-1.5">
            <span>📎 {file.name}</span>
            <button onClick={() => setFile(null)} className="ml-auto">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <label className="cursor-pointer text-gray-600 hover:text-emerald-400 transition-colors p-1 shrink-0">
            <Upload className="h-4 w-4" />
            <input type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && send()}
            placeholder="I'm 28, earn 15 LPA, spend 60k/month, want to retire at 50..."
            className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl disabled:opacity-40 transition-opacity shrink-0 flex items-center gap-1.5 text-sm font-medium"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
