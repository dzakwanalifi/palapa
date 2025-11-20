'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

// Hardcoded test credentials
const TEST_CREDENTIALS = {
  username: 'test',
  password: 'test123'
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [phoneOrUsername, setPhoneOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check credentials
    if (phoneOrUsername === TEST_CREDENTIALS.username && password === TEST_CREDENTIALS.password) {
      onLoginSuccess(phoneOrUsername);
    } else {
      setError('Nomor HP atau Password salah');
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phoneOrUsername && password && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-[#FDFDFD] flex flex-col overflow-hidden">
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center">
        <div className="flex flex-col w-full max-w-md">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center px-6 mb-12"
          >
            <Image
              src="/logo-login.png"
              alt="Budaya GO Login Logo"
              width={225}
              height={93}
              priority
              className="w-full max-w-xs h-auto object-contain"
            />
          </motion.div>

          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="px-[37px] pb-6 w-full"
          >
          {/* Phone Input */}
          <div className="space-y-[10px] mb-4">
            <label className="block text-[14px] font-[500] text-[#1D1D1D]"
                   style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
              Nomor Telepon
            </label>
            <Input
              type="text"
              placeholder="Loginkan Nomor Telepon"
              value={phoneOrUsername}
              onChange={(e) => setPhoneOrUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              autoComplete="tel"
              className="w-full px-4 py-4 border border-[#CFD0D8] rounded-[8px] focus:border-[#365594] focus:ring-2 focus:ring-[#365594]/20 text-[14px] text-[#1D1D1D] placeholder:text-[#1D1D1D]/40 disabled:bg-[#F5F5F5] disabled:text-[#999999]"
              style={{ fontFamily: "'Nunito Sans', sans-serif" }}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-[10px] mb-4">
            <label className="block text-[14px] font-[500] text-[#1D1D1D]"
                   style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
              Kata Sandi
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Loginkan Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full px-4 py-4 border border-[#CFD0D8] rounded-[8px] focus:border-[#365594] focus:ring-2 focus:ring-[#365594]/20 text-[14px] text-[#1D1D1D] placeholder:text-[#1D1D1D]/40 pr-12 disabled:bg-[#F5F5F5] disabled:text-[#999999]"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1D1D1D]/40 hover:text-[#1D1D1D]/60 disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          <motion.div
            initial={false}
            animate={{ height: error ? 'auto' : 0, opacity: error ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm font-medium border border-red-200">
              {error}
            </div>
          </motion.div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-[18px] h-[18px] rounded-[4px] border-2 border-[#CFD0D8] accent-[#47AF64] cursor-pointer"
              />
              <label htmlFor="remember" className="text-[12px] font-[500] text-[#464646] cursor-pointer"
                     style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
                Ingat Saya
              </label>
            </div>
            <button
              type="button"
              className="text-[12px] font-[500] text-[#1D1D1D] hover:opacity-70 transition"
              style={{ fontFamily: "'Nunito Sans', sans-serif" }}
            >
              Lupa Password
            </button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={!phoneOrUsername || !password || isLoading}
            className="w-full text-white font-[700] py-4 rounded-[14px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            style={{
              fontFamily: "'Nunito Sans', sans-serif",
              fontSize: '16px',
              background: 'linear-gradient(0deg, rgba(54, 85, 148, 1) 39%, rgba(59, 105, 204, 1) 100%)',
              boxShadow: '0px 5.77px 9.62px 0px rgba(128, 128, 128, 0.2)'
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Masuk...</span>
              </div>
            ) : (
              'Login'
            )}
          </Button>

          {/* Test Credentials Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
            <p className="text-xs font-semibold text-slate-900 mb-2">📝 Test: test / test123</p>
          </div>
        </motion.div>
        </div>
      </div>

      {/* Bottom Home Indicator */}
      <div className="w-full h-8 bg-white flex justify-center items-center">
        <div className="w-[134px] h-1 bg-black rounded-full opacity-0"></div>
      </div>
    </div>
  );
};
