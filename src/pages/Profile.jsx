import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchStudentProgress,
  setup2FA,
  enable2FA,
  disable2FA,
  fetch2FABackupCodesStatus,
} from '../services/api';
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Trophy,
  BookOpen,
  CheckCircle,
  TrendingUp,
  KeyRound,
  QrCode,
  Copy,
  Check,
  Lock,
  Smartphone,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState({
    coursesStarted: 0,
    coursesCompleted: 0,
    lessonsCompleted: 0,
    overallProgress: 0,
  });

  // 2FA Management State
  const [is2FAEnabled, setIs2FAEnabled] = useState(!!user?.isTwoFactorEnabled);
  const [setupData, setSetupData] = useState(null); // { secret, qrCode, otpauthUrl }
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading2FA, setLoading2FA] = useState(false);
  const [error2FA, setError2FA] = useState('');
  const [success2FA, setSuccess2FA] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);

  useEffect(() => {
    const loadProfileStats = async () => {
      try {
        const data = await fetchStudentProgress();
        if (data && data.summary) {
          setStats(data.summary);
        }
      } catch (err) {
        console.error('Error loading profile stats:', err);
      }
    };
    loadProfileStats();

    // Check 2FA status from server
    const check2FA = async () => {
      try {
        const status = await fetch2FABackupCodesStatus();
        setIs2FAEnabled(status.isTwoFactorEnabled);
      } catch (err) {
        console.error('Error checking 2FA status:', err);
      }
    };
    check2FA();
  }, []);

  // Step 1: Initiate 2FA Setup
  const handleStartSetup = async () => {
    try {
      setLoading2FA(true);
      setError2FA('');
      setSuccess2FA('');
      const data = await setup2FA();
      setSetupData(data);
    } catch (err) {
      setError2FA(err.response?.data?.message || 'Failed to initiate 2FA setup');
    } finally {
      setLoading2FA(false);
    }
  };

  // Step 2: Confirm 2FA with 6-digit code
  const handleConfirmEnable = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError2FA('Please enter the 6-digit code from your authenticator app');
      return;
    }

    try {
      setLoading2FA(true);
      setError2FA('');
      const result = await enable2FA(setupData.secret, verificationCode.trim());
      setIs2FAEnabled(true);
      setBackupCodes(result.backupCodes || []);
      setSetupData(null);
      setVerificationCode('');
      setSuccess2FA('Two-factor authentication enabled successfully! Please save your backup codes below.');
      if (setUser) {
        setUser((prev) => ({ ...prev, isTwoFactorEnabled: true }));
      }
    } catch (err) {
      setError2FA(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading2FA(false);
    }
  };

  // Step 3: Disable 2FA
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    try {
      setLoading2FA(true);
      setError2FA('');
      await disable2FA(disablePassword);
      setIs2FAEnabled(false);
      setShowDisableModal(false);
      setDisablePassword('');
      setBackupCodes([]);
      setSuccess2FA('Two-factor authentication has been disabled.');
      if (setUser) {
        setUser((prev) => ({ ...prev, isTwoFactorEnabled: false }));
      }
    } catch (err) {
      setError2FA(err.response?.data?.message || 'Failed to disable 2FA. Verify password.');
    } finally {
      setLoading2FA(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-extrabold uppercase shadow-lg shadow-blue-500/20">
            {user?.name ? user.name.charAt(0) : 'S'}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{user?.name || 'Student Name'}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                {user?.role || 'student'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{user?.email || 'student@example.com'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>LearnHub Student Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Security Card (LearnHub Figma Design) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${is2FAEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                {is2FAEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication (2FA)</h2>
            </div>
            <p className="text-xs text-slate-500">
              Add an extra layer of protection to your LearnHub account using TOTP Authenticator apps (Google Authenticator, Authy).
            </p>
          </div>

          <div>
            {is2FAEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Disabled
              </span>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {error2FA && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error2FA}</span>
          </div>
        )}
        {success2FA && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>{success2FA}</span>
          </div>
        )}

        {/* 2FA Mode 1: Disabled -> Start Setup */}
        {!is2FAEnabled && !setupData && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Protect your account</h3>
              <p className="text-xs text-slate-500">
                Each time you log in, you will be prompted for both your password and an authenticator code.
              </p>
            </div>
            <button
              onClick={handleStartSetup}
              disabled={loading2FA}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading2FA ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              <span>Enable 2FA Now</span>
            </button>
          </div>
        )}

        {/* 2FA Mode 2: In-Progress Setup (QR Code + Verification Form) */}
        {!is2FAEnabled && setupData && (
          <div className="p-6 rounded-2xl bg-blue-50/30 border border-blue-200 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Step 1: Scan QR Code with Authenticator App</h3>
              <p className="text-xs text-slate-600">
                Open Google Authenticator, Microsoft Authenticator, or Authy on your mobile phone and scan this code:
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                <img
                  src={setupData.qrCode}
                  alt="2FA QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="space-y-3 w-full">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">Cannot scan the code? Enter key manually:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={setupData.secret}
                      className="w-full font-mono text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(setupData.secret)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleConfirmEnable} className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Step 2: Enter 6-digit confirmation code from your app
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-40 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="submit"
                      disabled={loading2FA || verificationCode.length < 6}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
                    >
                      {loading2FA ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      <span>Verify & Activate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetupData(null)}
                      className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Newly Generated Backup Codes Box */}
        {backupCodes.length > 0 && (
          <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-900">
              <KeyRound className="w-5 h-5 text-amber-700" />
              <h3 className="text-sm font-bold">Important: Save Your Emergency Backup Codes</h3>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              If you lose access to your phone or authenticator app, these one-time codes are the only way to log back into your LearnHub account. Store them in a safe place.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-2.5 bg-white border border-amber-200 rounded-xl text-center font-bold text-slate-800 shadow-sm">
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All Backup Codes</span>
            </button>
          </div>
        )}

        {/* 2FA Mode 3: Enabled -> Show Options to Disable */}
        {is2FAEnabled && (
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Two-Factor Authentication is active</h3>
              <p className="text-xs text-slate-500">
                Your account requires an authenticator OTP code on every login.
              </p>
            </div>
            <button
              onClick={() => setShowDisableModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Disable 2FA
            </button>
          </div>
        )}

        {/* Disable 2FA Password Modal */}
        {showDisableModal && (
          <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-4">
            <h4 className="text-sm font-bold text-rose-900">Confirm Disabling 2FA</h4>
            <p className="text-xs text-slate-600">
              For security reasons, please enter your password to disable two-factor authentication.
            </p>
            <form onSubmit={handleDisable2FA} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="password"
                placeholder="Account password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
              <button
                type="submit"
                disabled={loading2FA}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                {loading2FA ? 'Verifying...' : 'Confirm Disable'}
              </button>
              <button
                type="button"
                onClick={() => setShowDisableModal(false)}
                className="w-full sm:w-auto px-3 py-2 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Learning Stats Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Learning Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="p-2.5 rounded-xl bg-blue-50 w-fit text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Started</p>
            <p className="text-2xl font-bold text-slate-900">{stats.coursesStarted || 0}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 w-fit text-emerald-600">
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Completed</p>
            <p className="text-2xl font-bold text-slate-900">{stats.coursesCompleted || 0}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="p-2.5 rounded-xl bg-purple-50 w-fit text-purple-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lessons Completed</p>
            <p className="text-2xl font-bold text-slate-900">{stats.lessonsCompleted || 0}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="p-2.5 rounded-xl bg-indigo-50 w-fit text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Progress</p>
            <p className="text-2xl font-bold text-slate-900">{stats.overallProgress || 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
