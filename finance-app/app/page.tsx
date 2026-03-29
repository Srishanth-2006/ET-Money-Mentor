'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronRight } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = email.split('@')[0];
    const name = raw.charAt(0).toUpperCase() + raw.slice(1);
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center relative overflow-hidden text-white">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            ET Money Mentor
          </h1>
          <p className="text-gray-400 text-sm mt-2">Your AI Financial CFO</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
            <input
              type="email" placeholder="Email address" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
            <input
              type="password" placeholder="Password" required
              className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl mt-2 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            {isLogin ? 'Sign In' : 'Create Account'} <ChevronRight className="h-4 w-4" />
          </motion.button>
        </form>
        <p className="text-center text-gray-500 text-sm mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 hover:underline">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}