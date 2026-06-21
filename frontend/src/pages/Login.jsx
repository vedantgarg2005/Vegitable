import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth, useLoginModal } from '../context/AuthContext';
import api from '../services/api';

const STEPS = ['phone', 'otp', 'register'];
const STEP_META = {
  phone:    { label: 'Phone',   icon: '📞' },
  otp:      { label: 'Verify',  icon: '🛡️' },
  register: { label: 'Profile', icon: '👤' },
};

function StepBar({ step }) {
  const current = STEPS.indexOf(step);
  return (
    <div className="flex items-start justify-center gap-0 mb-8 px-2">
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-start">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-md border flex items-center justify-center text-xs font-bold transition-all ${
                done   ? 'border-white bg-white text-black' :
                active ? 'border-white bg-transparent text-white' :
                         'border-white/20 text-white/30'
              }`} style={{ borderWidth: 1.5 }}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-semibold ${ active ? 'text-white' : 'text-white/40' }`}>
                {STEP_META[s].label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-12 mt-4 mx-1 transition-all ${ done ? 'bg-white/60' : 'bg-white/15' }`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OtpBoxes({ value, onChange, onEnter }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = value.split('');

  const handleKey = (i, text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const next = [...digits]; next[i] = '';
      onChange(next.join(''));
      if (i > 0) refs[i - 1].current?.focus();
      return;
    }
    const next = [...digits]; next[i] = cleaned[cleaned.length - 1];
    onChange(next.join(''));
    if (i < 3) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (pasted.length === 4) { onChange(pasted); refs[3].current?.focus(); }
  };

  return (
    <div className="flex justify-center gap-3 mb-6">
      {[0, 1, 2, 3].map(i => (
        <input
          key={i} ref={refs[i]}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleKey(i, e.target.value)}
          onPaste={handlePaste}
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          className="w-14 h-16 text-center text-2xl font-extrabold outline-none transition-all"
          style={{ borderRadius: 8, border: '1.5px solid', borderColor: digits[i] ? '#0a0a0a' : '#e5e5e5', background: digits[i] ? '#fafafa' : 'white', color: '#0a0a0a' }}
        />
      ))}
    </div>
  );
}

export default function LoginModal() {
  const { login } = useAuth();
  const { loginOpen, closeLogin } = useLoginModal();

  const [step, setStep]             = useState('phone');
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState('');
  const [name, setName]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [cardKey, setCardKey]       = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = useCallback(() => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  }, []);

  const goStep = (s) => { setStep(s); setError(''); setCardKey(k => k + 1); };

  const sendOtp = async () => {
    if (phone.length < 10) { setError('Enter a valid 10-digit number'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/send-otp', { phone });
      goStep('otp'); startTimer();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length < 4) { setError('Enter the 4-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, otp });
      if (data.isNewUser === false) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        login(data.user, data.token);
        toast.success('Welcome back!');
        closeLogin();
      } else {
        goStep('register');
      }
    } catch { goStep('register'); }
    finally { setLoading(false); }
  };

  const completeRegistration = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/complete-registration', { phone, name });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      login(data.user, data.token);
      toast.success('Welcome! 🎉');
      closeLogin();
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-green-500 focus:bg-green-50 bg-gray-50 text-gray-800 placeholder-gray-400 transition-all";

  if (!loginOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) { closeLogin(); setStep('phone'); setOtp(''); setName(''); setError(''); } }}
    >
      {/* Step Bar */}
      <StepBar step={step}/>

      {/* Card */}
      <div key={cardKey}
        className="w-full max-w-sm bg-white p-6 relative"
        style={{ animation: 'slideUp 0.25s ease', borderRadius: 12, border: '1px solid #e5e5e5' }}>

        <button
          onClick={() => { closeLogin(); setStep('phone'); setOtp(''); setName(''); setError(''); }}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          style={{ border: '1px solid #e5e5e5', fontSize: 14 }}
        >✕</button>

        {/* Card Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: '#f5f5f5', border: '1px solid #e5e5e5' }}>
            {STEP_META[step].icon}
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-base">
              {step === 'phone' ? 'Sign In / Sign Up' : step === 'otp' ? 'Enter OTP' : 'Create Profile'}
            </p>
            <p className="text-xs text-gray-400">
              {step === 'phone' ? 'Enter your mobile number to continue'
                : step === 'otp' ? `Code sent to +91 ${phone}`
                : 'Just a few details to get started'}
            </p>
          </div>
        </div>
        <div style={{ height: 1, background: '#f0f0f0', marginBottom: 20 }}/>

        {/* Phone Step */}
        {step === 'phone' && (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-3 flex-shrink-0" style={{ border: '1.5px solid #e5e5e5', borderRadius: 8, background: '#fafafa' }}>
                <span className="text-base">🇮🇳</span>
                <span className="text-sm font-bold text-gray-700">+91</span>
              </div>
              <div className="relative flex-1">
                <input
                  type="tel" maxLength={10} autoFocus
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10)); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  placeholder="10-digit number"
                  className="" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: 'inherit', color: '#0a0a0a' }}
                />
                {phone.length === 10 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">✓</span>
                )}
              </div>
            </div>
            {error && <ErrorRow msg={error}/>}
            <OrangeButton onClick={sendOtp} loading={loading} disabled={phone.length < 10}>
              Send OTP →
            </OrangeButton>
          </>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Verification Code</p>
            <OtpBoxes value={otp} onChange={v => { setOtp(v); setError(''); }} onEnter={verifyOtp}/>
            {error && <ErrorRow msg={error}/>}
            <OrangeButton onClick={verifyOtp} loading={loading} disabled={otp.length < 4}>
              Verify OTP 🛡️
            </OrangeButton>
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => { goStep('phone'); setOtp(''); }} className="text-sm font-bold hover:underline" style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Change Number
              </button>
              {resendTimer > 0
                ? <span className="text-gray-400 text-sm font-semibold">Resend in {resendTimer}s</span>
                : <button onClick={sendOtp} className="text-sm font-bold hover:underline" style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Resend OTP</button>
              }
            </div>
          </>
        )}

        {/* Register Step */}
        {step === 'register' && (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</p>
            <div className="flex items-center gap-2 px-4 py-3 mb-4" style={{ border: '1.5px solid #e5e5e5', borderRadius: 8, background: '#fafafa' }}>
              <span className="text-gray-400">👤</span>
              <input
                type="text" autoFocus
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && completeRegistration()}
                placeholder="Your full name"
                className="flex-1 bg-transparent text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none"
              />
            </div>
            {error && <ErrorRow msg={error}/>}
            <OrangeButton onClick={completeRegistration} loading={loading} disabled={!name.trim()}>
              Get Started 🎉
            </OrangeButton>
          </>
        )}
      </div>

      <p className="text-center text-xs mt-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
        By continuing, you agree to our{' '}
        <span style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Terms of Service</span>
        {' '}&{' '}
        <span style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Privacy Policy</span>
      </p>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function OrangeButton({ onClick, loading, disabled, children }) {
  return (
    <button
      onClick={onClick} disabled={loading || disabled}
      className="w-full py-3.5 font-extrabold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
      style={{ background: '#0a0a0a', borderRadius: 8, border: 'none', cursor: loading || disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
    >
      {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : children}
    </button>
  );
}

function ErrorRow({ msg }) {
  return (
    <div className="flex items-center gap-1.5 mb-3 text-red-600">
      <span className="text-sm">⚠️</span>
      <p className="text-xs font-semibold">{msg}</p>
    </div>
  );
}
