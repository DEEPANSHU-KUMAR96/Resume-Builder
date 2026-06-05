'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      }, {
        withCredentials: true // Include cookies in request
      });

      if (response.data.success) {
        toast.success('Login successful! Redirecting to dashboard...');

        // Clear form
        setFormData({
          email: '',
          password: ''
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        toast.error(message || 'An error occurred during login');
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-8 md:py-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#DC143C]/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-[#DC143C]/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="glass rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DC143C] to-transparent opacity-50"></div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#DC143C] to-[#8B0000] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[#DC143C]/20 transition-transform">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
              Sign In
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Access your professional resume builder
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${errors.email
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-white/5 focus:border-[#DC143C]/50'
                  } focus:outline-none text-white placeholder-gray-600 font-medium text-sm md:text-base`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 font-medium px-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-gray-500 hover:text-[#DC143C] font-bold transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${errors.password
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-white/5 focus:border-[#DC143C]/50'
                  } focus:outline-none text-white placeholder-gray-600 font-medium text-sm md:text-base`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 font-medium px-1">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl h-12"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#DC143C] to-[#8B0000] transition-transform group-hover:scale-105"></div>
              <div className="relative flex items-center justify-center gap-2 text-white font-bold text-sm tracking-wide transition-all group-active:scale-95">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Sign In to Dashboard'
                )}
              </div>
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">or</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="text-white font-bold hover:text-[#DC143C] transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
