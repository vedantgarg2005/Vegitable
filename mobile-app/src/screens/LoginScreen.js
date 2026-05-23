import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  TouchableOpacity, TextInput, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';

const STEPS = ['phone', 'otp', 'register'];

const STEP_META = {
  phone:    { label: 'Phone',    icon: 'call-outline' },
  otp:      { label: 'Verify',   icon: 'shield-checkmark-outline' },
  register: { label: 'Profile',  icon: 'person-outline' },
};

/* ── OTP Box Row ─────────────────────────────────────────────────── */
function OtpInput({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = value.split('');

  const handleKey = (index, text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      onChange(next.join(''));
      if (index > 0) refs[index - 1].current?.focus();
      return;
    }
    const next = [...digits];
    next[index] = cleaned[cleaned.length - 1];
    onChange(next.join(''));
    if (index < 3) refs[index + 1].current?.focus();
  };

  return (
    <View style={otp.row}>
      {[0, 1, 2, 3].map(i => (
        <TextInput
          key={i}
          ref={refs[i]}
          style={[otp.box, digits[i] ? otp.boxFilled : null]}
          value={digits[i] || ''}
          onChangeText={t => handleKey(i, t)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const otp = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: rs(14), marginBottom: vs(24) },
  box: {
    width: rs(60), height: rs(64),
    borderRadius: borderRadius.md,
    borderWidth: 2, borderColor: colors.border,
    fontSize: ms(26), fontWeight: '800', color: colors.text,
    backgroundColor: colors.background,
  },
  boxFilled: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
});

/* ── Step Progress Bar ───────────────────────────────────────────── */
function StepBar({ step }) {
  const current = STEPS.indexOf(step);
  return (
    <View style={bar.row}>
      {STEPS.map((s, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <React.Fragment key={s}>
            <View style={bar.item}>
              <View style={[bar.circle, done && bar.circleDone, active && bar.circleActive]}>
                {done
                  ? <Ionicons name="checkmark" size={rs(13)} color="#fff" />
                  : <Text style={[bar.num, active && bar.numActive]}>{i + 1}</Text>}
              </View>
              <Text style={[bar.label, active && bar.labelActive]}>{STEP_META[s].label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[bar.line, done && bar.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const bar = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'center', marginBottom: vs(28),
    paddingHorizontal: rs(8),
  },
  item: { alignItems: 'center', gap: vs(4) },
  circle: {
    width: rs(32), height: rs(32), borderRadius: rs(16),
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'transparent',
  },
  circleActive: { borderColor: '#fff', backgroundColor: colors.primary },
  circleDone:   { borderColor: colors.primary, backgroundColor: colors.primary },
  num:          { fontSize: ms(13), fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  numActive:    { color: '#fff' },
  label:        { fontSize: ms(10), fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  labelActive:  { color: '#fff' },
  line: {
    flex: 1, height: 2, marginTop: rs(15), marginHorizontal: rs(4),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  lineDone: { backgroundColor: colors.primary },
});

/* ── Main Screen ─────────────────────────────────────────────────── */
export default function LoginScreen({ navigation }) {
  const { setUser, setToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState('');
  const [name, setName]             = useState('');
  const [referralCode, setReferral] = useState('');
  const [step, setStep]             = useState('phone');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  // Slide-in card when step changes
  useEffect(() => {
    cardAnim.setValue(40);
    Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }, [step]);

  // Resend countdown
  const startTimer = useCallback(() => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const showError = (msg) => { setError(msg); shake(); };

  const handleLoginSuccess = (userData, token) => {
    setToken(token);
    setUser(userData);
    navigation.goBack();
  };

  const sendOtp = async () => {
    if (phone.length < 10) { showError('Enter a valid 10-digit number'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) { setStep('otp'); startTimer(); }
      else { const d = await res.json(); showError(d.message || 'Failed to send OTP'); }
    } catch { showError('Network error. Try again.'); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (otp.length < 4) { showError('Enter the 4-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isNewUser === false) handleLoginSuccess(data.user, data.token);
        else setStep('register');
      } else { showError(data.message || 'Invalid OTP'); }
    } catch { setStep('register'); }
    setLoading(false);
  };

  const completeRegistration = async () => {
    if (!name.trim()) { showError('Please enter your name'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, referralCode }),
      });
      const data = await res.json();
      if (res.ok) handleLoginSuccess(data.user, data.token);
      else showError(data.message || 'Registration failed');
    } catch { showError('Network error. Try again.'); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#1B3A2D', '#254D3C', '#1B3A2D']} style={[s.bg, { paddingTop: insets.top }]}>

        {/* ── Top brand area ── */}
        <View style={s.brand}>
          <View style={s.logoWrap}>
            <Text style={s.logoEmoji}>🌿</Text>
          </View>
          <Text style={s.brandName}>Khatri Veg Chaap</Text>
          <Text style={s.brandTagline}>Pure veg, pure taste</Text>
        </View>

        {/* ── Step progress ── */}
        <StepBar step={step} />

        {/* ── Card ── */}
        <Animated.View style={[s.card, shadows.large, { transform: [{ translateY: cardAnim }, { translateX: shakeAnim }] }]}>

          {/* Card header */}
          <View style={s.cardHeader}>
            <View style={s.cardIconWrap}>
              <Ionicons name={STEP_META[step].icon} size={rs(22)} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>
                {step === 'phone' ? 'Sign In / Sign Up' : step === 'otp' ? 'Enter OTP' : 'Create Profile'}
              </Text>
              <Text style={s.cardSubtitle}>
                {step === 'phone' ? 'Enter your mobile number to continue'
                  : step === 'otp' ? `Code sent to +91 ${phone}`
                  : 'Just a few details to get started'}
              </Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* ── Phone step ── */}
          {step === 'phone' && (
            <>
              <Text style={s.label}>Mobile Number</Text>
              <View style={s.phoneRow}>
                <View style={s.countryBadge}>
                  <Text style={s.countryFlag}>🇮🇳</Text>
                  <Text style={s.countryCode}>+91</Text>
                </View>
                <TextInput
                  style={s.phoneInput}
                  value={phone}
                  onChangeText={t => { setPhone(t.replace(/[^0-9]/g, '').slice(0, 10)); setError(''); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="10-digit number"
                  placeholderTextColor={colors.placeholder}
                  autoFocus
                />
                {phone.length === 10 && (
                  <Ionicons name="checkmark-circle" size={rs(20)} color={colors.success} />
                )}
              </View>

              {error ? <ErrorRow msg={error} /> : null}

              <TouchableOpacity
                style={[s.btn, (loading || phone.length < 10) && s.btnOff]}
                onPress={sendOtp}
                disabled={loading || phone.length < 10}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#E8650A', '#B84D00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Text style={s.btnText}>Send OTP</Text><Ionicons name="arrow-forward" size={rs(18)} color="#fff" /></>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* ── OTP step ── */}
          {step === 'otp' && (
            <>
              <Text style={s.label}>Verification Code</Text>
              <OtpInput value={otp} onChange={v => { setOtp(v); setError(''); }} />

              {error ? <ErrorRow msg={error} /> : null}

              <TouchableOpacity
                style={[s.btn, (loading || otp.length < 4) && s.btnOff]}
                onPress={verifyOtp}
                disabled={loading || otp.length < 4}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#E8650A', '#B84D00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Text style={s.btnText}>Verify OTP</Text><Ionicons name="shield-checkmark" size={rs(18)} color="#fff" /></>}
                </LinearGradient>
              </TouchableOpacity>

              <View style={s.otpFooter}>
                <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); setError(''); }}>
                  <Text style={s.linkText}>← Change Number</Text>
                </TouchableOpacity>
                {resendTimer > 0
                  ? <Text style={s.timerText}>Resend in {resendTimer}s</Text>
                  : <TouchableOpacity onPress={sendOtp}><Text style={s.linkText}>Resend OTP</Text></TouchableOpacity>}
              </View>
            </>
          )}

          {/* ── Register step ── */}
          {step === 'register' && (
            <>
              <Text style={s.label}>Full Name *</Text>
              <View style={[s.inputWrap, name.trim() && s.inputWrapFilled]}>
                <Ionicons name="person-outline" size={rs(18)} color={name.trim() ? colors.primary : colors.placeholder} />
                <TextInput
                  style={s.textInput}
                  value={name}
                  onChangeText={t => { setName(t); setError(''); }}
                  placeholder="Your full name"
                  placeholderTextColor={colors.placeholder}
                  autoFocus
                />
              </View>

              <Text style={[s.label, { marginTop: vs(12) }]}>Referral Code <Text style={s.optional}>(optional)</Text></Text>
              <View style={s.inputWrap}>
                <Ionicons name="gift-outline" size={rs(18)} color={colors.placeholder} />
                <TextInput
                  style={s.textInput}
                  value={referralCode}
                  onChangeText={setReferral}
                  placeholder="Enter referral code"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="characters"
                />
              </View>

              {error ? <ErrorRow msg={error} /> : null}

              <TouchableOpacity
                style={[s.btn, (loading || !name.trim()) && s.btnOff]}
                onPress={completeRegistration}
                disabled={loading || !name.trim()}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#E8650A', '#B84D00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.btnText}>Get Started 🎉</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        <Text style={s.terms}>By continuing, you agree to our{' '}
          <Text style={s.termsLink}>Terms of Service</Text> &{' '}
          <Text style={s.termsLink}>Privacy Policy</Text>
        </Text>

      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function ErrorRow({ msg }) {
  return (
    <View style={err.row}>
      <Ionicons name="alert-circle-outline" size={rs(15)} color={colors.error} />
      <Text style={err.text}>{msg}</Text>
    </View>
  );
}

const err = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: vs(10) },
  text: { fontSize: ms(12), color: colors.error, fontWeight: '600', flex: 1 },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  bg:   { flex: 1, paddingHorizontal: rs(20), justifyContent: 'center' },

  // Brand
  brand:       { alignItems: 'center', marginBottom: vs(32) },
  logoWrap:    {
    width: rs(72), height: rs(72), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(10),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  logoEmoji:   { fontSize: ms(38) },
  brandName:   { fontSize: ms(26), fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  brandTagline:{ fontSize: ms(13), color: 'rgba(255,255,255,0.5)', marginTop: vs(2) },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: rs(22),
    marginBottom: vs(20),
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: vs(14) },
  cardIconWrap:{
    width: rs(44), height: rs(44), borderRadius: rs(12),
    backgroundColor: colors.primarySurface,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle:   { fontSize: ms(17), fontWeight: '800', color: colors.text },
  cardSubtitle:{ fontSize: ms(12), color: colors.placeholder, marginTop: vs(2) },
  divider:     { height: 1, backgroundColor: colors.divider, marginBottom: vs(18) },

  // Fields
  label:       { fontSize: ms(12), fontWeight: '700', color: colors.textSecondary, marginBottom: vs(8), letterSpacing: 0.3 },
  optional:    { fontWeight: '400', color: colors.placeholder },

  phoneRow:    { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: vs(16) },
  countryBadge:{
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    backgroundColor: colors.background, borderRadius: borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: rs(12), paddingVertical: vs(13),
  },
  countryFlag: { fontSize: ms(16) },
  countryCode: { fontSize: ms(14), fontWeight: '700', color: colors.text },
  phoneInput:  {
    flex: 1, fontSize: ms(16), fontWeight: '700', color: colors.text,
    backgroundColor: colors.background, borderRadius: borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: rs(14), paddingVertical: vs(13),
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    backgroundColor: colors.background, borderRadius: borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: rs(14), paddingVertical: vs(4),
    marginBottom: vs(4),
  },
  inputWrapFilled: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  textInput: { flex: 1, fontSize: ms(15), fontWeight: '600', color: colors.text, paddingVertical: vs(10) },

  // Button
  btn:     { borderRadius: borderRadius.md, overflow: 'hidden', marginTop: vs(4) },
  btnOff:  { opacity: 0.5 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: vs(15), gap: rs(8) },
  btnText: { color: '#fff', fontSize: ms(16), fontWeight: '800' },

  // OTP footer
  otpFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: vs(14) },
  linkText:  { fontSize: ms(13), color: colors.primary, fontWeight: '700' },
  timerText: { fontSize: ms(13), color: colors.placeholder, fontWeight: '600' },

  // Terms
  terms:     { textAlign: 'center', fontSize: ms(11), color: 'rgba(255,255,255,0.35)', lineHeight: ms(18) },
  termsLink: { color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
});
