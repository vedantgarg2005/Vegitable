import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { TextInput, Snackbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';

const LoginScreen = ({ navigation }) => {
  const continueAsGuest = () => navigation.replace('Main');

  // After successful login, go back to where user came from
  const handleLoginSuccess = (userData, token) => {
    setToken(token);
    setUser(userData);
    navigation.goBack();
  };
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [step, setStep] = useState('phone');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuth();
  const insets = useSafeAreaInsets();

  const showSnack = (msg) => { setSnackbarMessage(msg); setSnackbarVisible(true); };

  const sendOtp = async () => {
    if (!phone || phone.length < 10) { showSnack('Please enter a valid phone number'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (response.ok) { setStep('otp'); showSnack('OTP sent! Use 123456'); }
      else { const data = await response.json(); showSnack(data.message || 'Failed to send OTP'); }
    } catch { showSnack('Network error'); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp) { showSnack('Please enter OTP'); return; }
    if (otp !== '123456') { showSnack('Invalid OTP. Use 123456'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.isNewUser === false) { handleLoginSuccess(data.user, data.token); }
        else setStep('register');
      } else { showSnack(data.message); }
    } catch { setStep('register'); }
    setLoading(false);
  };

  const completeRegistration = async () => {
    if (!name.trim()) { showSnack('Please enter your name'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, referralCode }),
      });
      const data = await response.json();
      if (response.ok) { handleLoginSuccess(data.user, data.token); }
      else showSnack(data.message || 'Registration failed');
    } catch { showSnack('Network error'); }
    setLoading(false);
  };

  const stepConfig = {
    phone: { title: 'Welcome Back!', subtitle: 'Enter your phone number to continue', icon: 'restaurant' },
    otp: { title: 'Verify OTP', subtitle: `Code sent to +91 ${phone}`, icon: 'shield-checkmark' },
    register: { title: 'Almost There!', subtitle: 'Tell us a bit about yourself', icon: 'person-add' },
  };

  const { title, subtitle, icon } = stepConfig[step];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.gradient, { paddingTop: insets.top, backgroundColor: colors.navy }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={rs(36)} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, shadows.large]}>

            {step === 'phone' && (
              <>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    mode="outlined"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.phoneInput}
                    outlineStyle={styles.inputOutline}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor={colors.placeholder}
                    theme={{ colors: { primary: colors.primary, background: colors.surface } }}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={sendOtp}
                  disabled={loading || phone.length < 10}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.primaryBtnText}>Send OTP</Text>
                    <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {step === 'otp' && (
              <>
                <Text style={styles.fieldLabel}>Enter 4-digit OTP</Text>
                <TextInput
                  mode="outlined"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  placeholder="• • • •"
                  placeholderTextColor={colors.placeholder}
                  theme={{ colors: { primary: colors.primary, background: colors.surface } }}
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={verifyOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.primaryBtnText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkBtn} onPress={() => setStep('phone')}>
                  <Text style={styles.linkBtnText}>← Change Number</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'register' && (
              <>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  mode="outlined"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  placeholder="Your full name"
                  placeholderTextColor={colors.placeholder}
                  left={<TextInput.Icon icon="account" color={colors.primary} />}
                  theme={{ colors: { primary: colors.primary, background: colors.surface } }}
                />
                <Text style={styles.fieldLabel}>Referral Code (Optional)</Text>
                <TextInput
                  mode="outlined"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  placeholder="Enter referral code"
                  placeholderTextColor={colors.placeholder}
                  left={<TextInput.Icon icon="gift" color={colors.accent} />}
                  theme={{ colors: { primary: colors.primary, background: colors.surface } }}
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={completeRegistration}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.primaryBtnText}>{loading ? 'Creating Account...' : 'Get Started 🎉'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Guest access */}
          {step === 'phone' && (
            <TouchableOpacity style={styles.guestBtn} onPress={continueAsGuest}>
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          )}

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {['phone', 'otp', 'register'].map((s, i) => (
              <View
                key={s}
                style={[styles.stepDot, step === s && styles.stepDotActive,
                  ['phone', 'otp', 'register'].indexOf(step) > i && styles.stepDotDone]}
              />
            ))}
          </View>

        </ScrollView>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: rs(20), paddingBottom: vs(40) },

  hero: { alignItems: 'center', marginBottom: vs(28) },
  iconCircle: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(16),
    ...shadows.medium,
  },
  heroTitle: { fontSize: ms(28), fontWeight: '800', color: '#FFFFFF', marginBottom: vs(6), textAlign: 'center' },
  heroSubtitle: { fontSize: ms(15), color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: ms(22) },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: rs(24),
    marginBottom: vs(20),
  },

  fieldLabel: { fontSize: ms(13), fontWeight: '600', color: colors.textSecondary, marginBottom: vs(6), marginTop: vs(4) },

  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: vs(16) },
  countryCode: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(12),
    paddingVertical: vs(14),
  },
  countryCodeText: { fontSize: ms(14), fontWeight: '600', color: colors.text },
  phoneInput: { flex: 1, backgroundColor: colors.surface, fontSize: ms(15) },

  input: { backgroundColor: colors.surface, marginBottom: vs(14), fontSize: ms(15) },
  inputOutline: { borderRadius: borderRadius.sm, borderColor: colors.border },

  primaryBtn: { borderRadius: borderRadius.md, overflow: 'hidden', marginTop: vs(4) },
  btnDisabled: { opacity: 0.6 },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(15),
    gap: rs(8),
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: ms(16), fontWeight: '700' },

  linkBtn: { alignItems: 'center', paddingVertical: vs(12) },
  linkBtnText: { color: colors.primary, fontSize: ms(14), fontWeight: '600' },

  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: rs(8) },
  stepDot: { width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: 'rgba(255,255,255,0.4)' },
  stepDotActive: { backgroundColor: '#FFFFFF', width: rs(24) },
  stepDotDone: { backgroundColor: 'rgba(255,255,255,0.7)' },

  snackbar: { backgroundColor: colors.text },

  guestBtn: { alignItems: 'center', paddingVertical: vs(12) },
  guestBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: ms(14), fontWeight: '500', textDecorationLine: 'underline' },
});

export default LoginScreen;
