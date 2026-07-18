import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, AlertCircle, ArrowRight,
  Building2, ShoppingBag, Bus, Hotel,
  Shield, Zap, Globe,
  CheckCircle2, Star, BarChart2
} from 'lucide-react';

const FEATURES = [
  { icon: Shield, title: 'Secure Escrow Payments', desc: "Every transaction is protected. Funds only release when you've delivered." },
  { icon: BarChart2, title: 'Real-time Business Analytics', desc: 'Track revenue, orders, occupancy, and growth — all in one view.' },
  { icon: Zap, title: 'Multi-vertical Operations', desc: 'Run hotels, restaurants, transit, and retail from a single dashboard.' },
  { icon: Globe, title: 'Marketplace Visibility', desc: 'Reach thousands of customers on the Azaman consumer app.' },
];

const BUSINESS_TYPES = [
  { icon: Hotel, label: 'Hotels', color: '#6C4FD1' },
  { icon: ShoppingBag, label: 'Retail', color: '#1FA37A' },
  { icon: Bus, label: 'Transit', color: '#3D74DB' },
  { icon: Building2, label: 'Restaurants', color: '#E2A33D' },
];

const STATS = [
  { value: '2,400+', label: 'Active Businesses' },
  { value: '₵14M+', label: 'Processed Monthly' },
  { value: '99.9%', label: 'Uptime' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveFeature(prev => (prev + 1) % FEATURES.length), 3500);
    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'var(--az-bg)' }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1A1630 0%, #0F0E18 60%, #16122A 100%)', borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6C4FD1 0%, transparent 70%)', transform: 'translate(-40%, -40%)' }} />
        <div className="absolute bottom-20 right-0 w-60 h-60 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3D74DB 0%, transparent 70%)', transform: 'translateX(40%)' }} />
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: 'rgba(108,79,209,0.2)', border: '1px solid rgba(108,79,209,0.4)' }}>
              <img src="/azaman-logo.png" alt="Azaman" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="text-base font-bold text-white tracking-tight">AZAMAN</p>
              <p className="text-xs font-medium" style={{ color: '#8B76E0' }}>Business Portal</p>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            The operating system<br />for your <span style={{ color: '#8B76E0' }}>business</span>
          </h1>
          <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Manage every aspect of your business in one place — from orders and payments to staff and analytics.
          </p>
          <div className="flex flex-wrap gap-2 mb-10">
            {BUSINESS_TYPES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                animate={{ opacity: i === activeFeature ? 1 : 0.35 }}
                transition={{ duration: 0.4 }}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
                style={{
                  background: i === activeFeature ? 'rgba(108,79,209,0.12)' : 'transparent',
                  border: `1px solid ${i === activeFeature ? 'rgba(108,79,209,0.25)' : 'transparent'}`
                }}
                onClick={() => setActiveFeature(i)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(108,79,209,0.2)' }}>
                  <f.icon className="w-4 h-4" style={{ color: '#8B76E0' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-1 rounded-full transition-all duration-500"
                style={{ background: i === activeFeature ? '#6C4FD1' : 'rgba(255,255,255,0.15)', width: i === activeFeature ? '24px' : '6px' }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: 'var(--az-accent-subtle)', border: '1px solid var(--az-accent-border)' }}>
              <img src="/azaman-logo.png" alt="Azaman" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--az-text)' }}>AZAMAN</p>
              <p className="text-xs" style={{ color: 'var(--az-accent)' }}>Business Portal</p>
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--az-text)' }}>Welcome back</h2>
            <p className="text-sm" style={{ color: 'var(--az-text-secondary)' }}>Sign in to your business account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'var(--az-text-secondary)' }}>Email Address</label>
              <input type="email" autoComplete="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@business.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--az-surface-solid)', border: '1.5px solid var(--az-border)', color: 'var(--az-text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--az-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--az-border)'} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'var(--az-text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'var(--az-surface-solid)', border: '1.5px solid var(--az-border)', color: 'var(--az-text)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--az-accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--az-border)'} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                  style={{ color: 'var(--az-text-muted)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl text-sm"
                  style={{ background: 'var(--az-danger-subtle)', color: 'var(--az-danger)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: loading ? 'var(--az-accent-subtle)' : 'var(--az-accent)',
                color: loading ? 'var(--az-accent)' : '#ffffff',
                border: loading ? '1px solid var(--az-accent-border)' : 'none',
              }}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Signing in...</>
              ) : (
                <>Sign in to Portal<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-xs" style={{ color: 'var(--az-text-muted)' }}>
            Not registered yet?{' '}
            <a href="https://azaman.com" target="_blank" rel="noopener noreferrer"
              className="font-semibold" style={{ color: 'var(--az-accent)' }}>
              Apply for business access →
            </a>
          </p>
          <div className="mt-8 pt-6 flex items-center gap-4" style={{ borderTop: '1px solid var(--az-border)' }}>
            {[['Secure', CheckCircle2], ['Trusted', Shield], ['4.9 ★ Rated', Star]].map(([label, Icon]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--az-text-muted)' }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
