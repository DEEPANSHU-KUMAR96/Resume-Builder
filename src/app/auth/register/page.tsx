'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

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

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        toast.success('Account created successfully! Redirecting to login...');

        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });

        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 1500);
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        toast.error(message || 'An error occurred during registration');
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#C41E3A] opacity-10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#C41E3A] opacity-5 blur-[120px] rounded-full"></div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 transition-all duration-500">

        {/* Registration Card */}
        <div className="glass rounded-[2rem] p-8 md:p-10 border border-white/5 shadow-2xl backdrop-blur-3xl">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/20">
              <span className="text-[10px] font-bold text-[#DC143C] uppercase tracking-[0.2em]">Start Your Journey</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
              Create Account
            </h1>
            <p className="text-gray-500 text-sm md:text-base font-medium">
              Join thousands of professionals building their future
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Full Name Field */}
            <div className="group">
              <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-5 py-4 rounded-2xl border-2 transition-all font-medium text-sm md:text-base ${errors.name
                  ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                  : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                  } focus:outline-none text-white placeholder-gray-700`}
              />
              {errors.name && (
                <p className="mt-2 text-xs text-red-500 font-bold px-1 transition-all">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="group">
              <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`w-full px-5 py-4 rounded-2xl border-2 transition-all font-medium text-sm md:text-base ${errors.email
                  ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                  : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                  } focus:outline-none text-white placeholder-gray-700`}
              />
              {errors.email && (
                <p className="mt-2 text-xs text-red-500 font-bold px-1 transition-all">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 gap-6">
              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all font-medium text-sm md:text-base ${errors.password
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700`}
                />
                {errors.password && (
                  <p className="mt-2 text-xs text-red-500 font-bold px-1 transition-all">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="group">
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all font-medium text-sm md:text-base ${errors.confirmPassword
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700`}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-xs text-red-500 font-bold px-1 transition-all">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group/btn overflow-hidden bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:shadow-2xl hover:shadow-[#DC143C]/20 text-white font-bold h-14 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 mt-6"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Sign Up'
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-4 bg-[#0A0A0A] text-gray-600 font-bold uppercase tracking-widest">Or</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-[#DC143C] font-bold hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-10 text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity">
          <p>Secure Professional Experience &copy; 2024</p>
        </div>
      </div>
    </div>
  );
}
