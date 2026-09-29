import React, { useState } from 'react';
import { ChitraLogo } from './common/ChitraLogo';
import { authApi } from '../api/client';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('adminpass');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'ADMIN' | 'EMPLOYEE' | 'DISTRIBUTOR' | 'WAREHOUSE') => {
    setError('');
    setLoading(true);
    try {
      let u = 'master_admin@ccs.com';
      let p = 'AdminPass123!';
      if (role === 'EMPLOYEE') {
        u = 'master_emp@ccs.com';
        p = 'EmpPass123!';
      } else if (role === 'DISTRIBUTOR') {
        u = 'testdistributor@ccs.com';
        p = 'Testing@123';
      } else if (role === 'WAREHOUSE') {
        u = 'warehouse@ccs.com';
        p = 'Ccs@12345';
      }
      setUsername(u);
      setPassword(p);
      const res = await authApi.login(u, p);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex flex-col justify-center items-center p-4 selection:bg-[#16a34a] selection:text-white">
      <div className="w-full max-w-md bg-white border border-[#bbf7d0] shadow-xl rounded-2xl p-8 transition-all">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-6 text-center">
          <ChitraLogo variant="horizontal" size="lg" showTagline={true} />
          <h2 className="text-xl font-bold text-[#14532d] mt-4">CCS Partners ERP Portal</h2>
          <p className="text-xs text-[#475569] mt-1">Sign in with your authorized credentials to access your account</p>
        </div>

        {/* Quick Role Demo Selector */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-2 text-center">
            Quick Role Demo Access
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('ADMIN')}
              className="px-2 py-2 text-xs font-semibold rounded bg-[#16a34a] hover:bg-[#15803d] text-white transition cursor-pointer text-center"
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('EMPLOYEE')}
              className="px-2 py-2 text-xs font-semibold rounded bg-[#0f766e] hover:bg-[#115e59] text-white transition cursor-pointer text-center"
            >
              EMPLOYEE
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('DISTRIBUTOR')}
              className="px-2 py-2 text-xs font-semibold rounded bg-[#15803d] hover:bg-[#166534] text-white transition cursor-pointer text-center"
            >
              DISTRIBUTOR
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('WAREHOUSE')}
              className="px-2 py-2 text-xs font-semibold rounded bg-[#0284c7] hover:bg-[#0369a1] text-white transition cursor-pointer text-center"
            >
              WAREHOUSE
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-[#e2e8f0]"></div>
          <span className="flex-shrink mx-3 text-gray-400 text-xs uppercase font-medium">Or enter credentials</span>
          <div className="flex-grow border-t border-[#e2e8f0]"></div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-xs rounded-md">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#334155] mb-1">Username or Email</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or dealer@ccs.com"
              className="w-full px-3.5 py-2 text-sm border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#334155] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold py-2.5 px-4 text-sm rounded-lg transition duration-150 shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#e2e8f0] text-center">
          <a
            href="/downloads/CCS-Connect.apk"
            download="CCS-Connect.apk"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16a34a] hover:text-[#15803d] hover:underline transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">android</span>
            <span>Download CCS Connect Mobile App (APK)</span>
          </a>
        </div>

        <p className="text-center text-[11px] text-[#64748b] mt-4">
          CCS Partners ERP v2.0 • Secured with JWT Authentication & PostgreSQL
        </p>
      </div>
    </div>
  );
};
