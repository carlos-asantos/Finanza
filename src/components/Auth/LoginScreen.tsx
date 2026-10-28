/**
 * Login & Registration Screen
 * Replaces any profile-selector / Netflix-style grid with a standard, secure Email & Password authentication flow.
 * Validates email format (xxxx@xxxx.com), password strength (>=8 chars, 1 uppercase, 1 number, 1 special char),
 * supports account creation with default BRL setup, and provides pre-seeded dev account (admin / Mudar123!).
 * Passwords are encrypted on the backend using bcrypt.
 */
import React, { useState } from 'react';
import { UserProfile } from '../../types/finance';
import { FinanzaService } from '../../services/storage';
import { Language, translations } from '../../utils/i18n';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  DollarSign,
  ArrowRight,
  Wallet,
  Check,
  X,
  Sparkles,
  Globe,
} from 'lucide-react';

interface LoginScreenProps {
  profiles: UserProfile[];
  lang: Language;
  onToggleLang: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
  onRefreshProfiles: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  lang,
  onToggleLang,
  onLoginSuccess,
  onRefreshProfiles,
}) => {
  const t = translations[lang];

  // Auth Mode: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login Form States (empty by default, no auto-filling admin credentials)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regIncomeTarget, setRegIncomeTarget] = useState('5000');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Status & Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Strict email regex: xxxx@xxxx.com (or 'admin' for dev convenience)
  const isEmailValid = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed === 'admin') return true;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
  };

  // Password rules validation
  const passwordChecks = {
    minChars: regPassword.length >= 8,
    hasNumber: /[0-9]/.test(regPassword),
    hasUpper: /[A-Z]/.test(regPassword),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(regPassword),
  };

  const isPasswordStrong =
    passwordChecks.minChars &&
    passwordChecks.hasNumber &&
    passwordChecks.hasUpper &&
    passwordChecks.hasSpecial;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrim = loginEmail.trim();
    if (!emailTrim || !loginPassword) {
      setErrorMessage(t.fillAllFields);
      return;
    }

    if (!isEmailValid(emailTrim)) {
      setErrorMessage(t.invalidEmailFormat);
      return;
    }

    setIsLoading(true);
    try {
      const profile = await FinanzaService.loginWithEmail(emailTrim, loginPassword);
      FinanzaService.setActiveProfileId(profile.id);
      onLoginSuccess(profile);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t.incorrectPassword;
      setErrorMessage(errorMsg || t.incorrectPassword);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regFullName.trim() || !regEmail.trim() || !regPassword || !regConfirmPassword) {
      setErrorMessage(t.fillAllFields);
      return;
    }

    if (!isEmailValid(regEmail)) {
      setErrorMessage(t.invalidEmailFormat);
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage(
        lang === 'pt'
          ? 'A senha não atende a todos os requisitos de segurança.'
          : 'Password does not meet all security requirements.'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage(t.passwordsDoNotMatch);
      return;
    }

    setIsLoading(true);
    try {
      const incomeVal = parseFloat(regIncomeTarget) || 5000;
      const profile = await FinanzaService.registerAccount({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        mainIncomeTarget: incomeVal,
      });

      await onRefreshProfiles();
      FinanzaService.setActiveProfileId(profile.id);
      onLoginSuccess(profile);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t.createProfileFailed;
      setErrorMessage(errorMsg || t.createProfileFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Top Float */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer shadow-md"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono font-medium">{lang === 'pt' ? 'Português (BR)' : 'English (US)'}</span>
          <span className="text-[10px] text-slate-400 font-mono">· R$ (BRL)</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <Wallet className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t.welcomeTitle}</h1>
          <p className="text-xs text-slate-400 mt-1">{t.welcomeSubtitle}</p>
        </div>

        {/* Authentication Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl">
          {/* Tabs: Entrar / Criar Conta */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.loginTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.registerTab}
            </button>
          </div>

          {/* Alert / Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 flex items-start gap-2">
              <X className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* Form Content: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {lang === 'pt' ? 'Formato: usuario@dominio.com ou admin' : 'Format: user@domain.com or admin'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    {t.passwordLabel}
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t.enterPasswordPlaceholder}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-medium text-sm rounded-lg shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? t.verifying : t.loginButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-400">{t.noAccountYet} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline"
                >
                  {t.signUpLink}
                </button>
              </div>
            </form>
          )}

          {/* Form Content: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.fullName}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.emailLabel} <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="usuario@dominio.com"
                    className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-mono ${
                      regEmail && !isEmailValid(regEmail)
                        ? 'border-rose-500/60 focus:ring-2 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500'
                    }`}
                    required
                  />
                </div>
                {regEmail && !isEmailValid(regEmail) && (
                  <p className="text-[11px] text-rose-400 mt-1">{t.invalidEmailFormat}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.passwordLabel} <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t.createPasswordPlaceholder}
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Criteria Checklist */}
                <div className="mt-2 p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1 text-[11px]">
                  <p className="text-slate-400 font-medium mb-1">{t.passwordRequirementsTitle}</p>
                  <div className="grid grid-cols-2 gap-1">
                    <div className={`flex items-center gap-1.5 ${passwordChecks.minChars ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordChecks.minChars ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                      <span>{t.reqMinChars}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.hasUpper ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordChecks.hasUpper ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                      <span>{t.reqUppercase}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.hasNumber ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordChecks.hasNumber ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                      <span>{t.reqNumber}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passwordChecks.hasSpecial ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordChecks.hasSpecial ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                      <span>{t.reqSpecialChar}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.confirmPasswordLabel} <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">{t.passwordsDoNotMatch}</p>
                )}
              </div>

              {/* Monthly Income Target */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.mainEntriesGoal}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400 font-semibold text-xs font-mono">
                    R$
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={regIncomeTarget}
                    onChange={(e) => setRegIncomeTarget(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-medium text-sm rounded-lg shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-3"
              >
                <span>{isLoading ? t.verifying : t.registerButton}</span>
                <Sparkles className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-400">{t.alreadyHaveAccount} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline"
                >
                  {t.signInLink}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
