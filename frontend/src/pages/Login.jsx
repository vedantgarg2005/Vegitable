import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
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
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                done   ? 'border-green-500 bg-green-500 text-white' :
                active ? 'border-white bg-green-700 text-white' :
                         'border-white/30 text-white/40'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-semibold ${ active ? 'text-white' : 'text-white/40' }`}>
                {STEP_META[s].label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 mt-4 mx-1 transition-all ${ done ? 'bg-green-500' : 'bg-white/20' }`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OtpBoxes({ value, onChange }) {
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
          className={`w-14 h-16 text-center text-2xl font-extrabold rounded-xl border-2 outline-none transition-all ${
            digits[i] ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 bg-gray-50 text-gray-800'
          } focus:border-green-500 focus:bg-green-50`}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

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
        navigate('/');
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
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-green-500 focus:bg-green-50 bg-gray-50 text-gray-800 placeholder-gray-400 transition-all";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8"
      style={{ background: 'linear-gradient(160deg, #1B3A2D 0%, #254D3C 50%, #1B3A2D 100%)' }}>

      {/* Step Bar */}
      <StepBar step={step}/>

      {/* Card */}
      <div key={cardKey}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
        style={{ animation: 'slideUp 0.3s ease' }}>

        {/* Card Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: '#E8F5E9' }}>
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
        <div className="h-px bg-gray-100 mb-5"/>

        {/* Phone Step */}
        {step === 'phone' && (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 border-2 border-gray-200 rounded-xl px-3 py-3 bg-gray-50 flex-shrink-0">
                <span className="text-base">🇮🇳</span>
                <span className="text-sm font-bold text-gray-700">+91</span>
              </div>
              <div className="relative flex-1">
                <input
                  type="tel" maxLength={10} autoFocus
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10)); setError(''); }}
                  placeholder="10-digit number"
                  className={inputCls}
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
            <OtpBoxes value={otp} onChange={v => { setOtp(v); setError(''); }}/>
            {error && <ErrorRow msg={error}/>}
            <OrangeButton onClick={verifyOtp} loading={loading} disabled={otp.length < 4}>
              Verify OTP 🛡️
            </OrangeButton>
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => { goStep('phone'); setOtp(''); }} className="text-green-700 text-sm font-bold hover:underline">
                ← Change Number
              </button>
              {resendTimer > 0
                ? <span className="text-gray-400 text-sm font-semibold">Resend in {resendTimer}s</span>
                : <button onClick={sendOtp} className="text-green-700 text-sm font-bold hover:underline">Resend OTP</button>
              }
            </div>
          </>
        )}

        {/* Register Step */}
        {step === 'register' && (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</p>
            <div className={`flex items-center gap-2 border-2 rounded-xl px-4 py-3 mb-4 transition-all ${
              name.trim() ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <span className="text-gray-400">👤</span>
              <input
                type="text" autoFocus
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
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

      <p className="text-center text-white/35 text-xs mt-6 leading-relaxed">
        By continuing, you agree to our{' '}
        <span className="text-white/60 font-semibold cursor-pointer">Terms of Service</span>
        {' '}&{' '}
        <span className="text-white/60 font-semibold cursor-pointer">Privacy Policy</span>
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
      className="w-full py-3.5 rounded-xl font-extrabold text-white text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
      style={{ background: loading || disabled ? '#ccc' : 'linear-gradient(90deg, #E8650A, #B84D00)' }}
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
