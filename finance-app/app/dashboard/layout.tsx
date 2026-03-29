'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BrainCircuit, ShieldCheck, Wallet,
  LineChart, BarChart3, Umbrella, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard',        color: 'text-emerald-400' },
  { href: '/dashboard/cfo',         icon: BrainCircuit,    label: 'AI CFO Chat',      color: 'text-purple-400'  },
  { href: '/dashboard/fire',        icon: ShieldCheck,     label: 'FIRE Sandbox',     color: 'text-teal-400'    },
  { href: '/dashboard/tax',         icon: Wallet,          label: 'Tax Optimizer',    color: 'text-blue-400'    },
  { href: '/dashboard/opportunity', icon: LineChart,       label: 'Opportunity Cost', color: 'text-orange-400'  },
  { href: '/dashboard/networth',    icon: BarChart3,       label: 'Net Worth',        color: 'text-yellow-400'  },
  { href: '/dashboard/insurance',   icon: Umbrella,        label: 'Insurance',        color: 'text-pink-400'    },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUserName(localStorage.getItem('userName') ?? 'User');
    setUserEmail(localStorage.getItem('userEmail') ?? '');
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex">
      <motion.aside
        animate={{ width: collapsed ? 72 : 248 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="shrink-0 h-screen sticky top-0 flex flex-col bg-[#0d1117] border-r border-white/8 overflow-hidden z-20"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <span className="text-white font-black text-xs">ET</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-white leading-tight">ET Sentinel</p>
              <p className="text-[10px] text-emerald-400/70 leading-tight">Agentic Wealth Engine</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    active ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? item.color : 'text-gray-600'}`} />
                  {!collapsed && (
                    <span className={`text-sm ${active ? 'text-white font-medium' : 'text-gray-500'}`}>
                      {item.label}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/8">
          {!collapsed && userName && (
            <div className="px-2 py-2 mb-1">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className="text-xs text-gray-600 truncate">{userEmail}</p>
            </div>
          )}
          <button
            onClick={() => { localStorage.clear(); router.push('/'); }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>

        {/* Collapse btn */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-[22px] -right-3 w-6 h-6 bg-[#0B0E14] border border-white/10 rounded-full flex items-center justify-center hover:border-emerald-500/50 z-10"
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3 text-gray-500" />
            : <ChevronLeft className="h-3 w-3 text-gray-500" />}
        </button>
      </motion.aside>

      <main className="flex-1 overflow-auto min-h-screen">
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}