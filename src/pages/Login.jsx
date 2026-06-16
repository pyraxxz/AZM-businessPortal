import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Store, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--az-black)' }}>

      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 border-r border-[#1e1e2e]"
        style={{ background: 'var(--az-surface)' }}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[#00d97e1a] border border-[#00d97e35] flex items-center justify-center az-glow-emerald">
              <Store className="w-5 h-5 text-[#00d97e]" />
            </div>
            <div>
              <p className="text-base font-bold text-[#e8e8f0] tracking-tight">AZAMAN</p>
              <p className="text-xs text-[#00d97e] font-medium">Business Portal</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[#e8e8f0] leading-tight mb-4">
            Manage your<br />
            <span style={{ color: '#00d97e' }}>business</span> with ease
          </h1>
          <p className="text-[#7b7b9a] text-sm leading-relaxed">
            List products, receive payments, track orders, and grow your business on Ghana's most trusted P2P platform.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-4">
          {[
            ['Secure Escrow Payments', 'Every order is protected by smart escrow'],
            ['Real-time Order Tracking', 'Know exactly where every order stands'],
            ['Instant Notifications',   'Get alerted the moment a customer pays'],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d97e] mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#e8e8f0]">{title}</p>
                <p className="text-xs text-[#4a4a6a]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#4a4a6a]">© 2026 Azaman. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#00d97e1a] border border-[#00d97e35] flex items-center justify-center">
              <Store className="w-4 h-4 text-[#00d97e]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#e8e8f0]">AZAMAN</p>
              <p className="text-xs text-[#00d97e]">Business Portal</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#e8e8f0] mb-2">Welcome back</h2>
          <p className="text-sm text-[#7b7b9a] mb-8">Sign in to your business account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#7b7b9a] uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-[#0f0f17] border border-[#2a2a3e] text-[#e8e8f0] text-sm placeholder:text-[#4a4a6a] outline-none focus:border-[#00d97e60] focus:ring-1 focus:ring-[#00d97e20] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a6a] hover:text-[#7b7b9a] transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f43f5e1a] border border-[#f43f5e30]">
                <AlertCircle className="w-4 h-4 text-[#f43f5e] flex-shrink-0" />
                <p className="text-xs text-[#f43f5e]">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-xs text-[#4a4a6a] text-center mt-6">
            Need access? Contact your Azaman account manager.
          </p>
        </div>
      </div>
    </div>
  );
}
