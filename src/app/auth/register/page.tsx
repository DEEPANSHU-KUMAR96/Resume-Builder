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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      {/* Main Container */}
      <div className="w-full max-w-md">
        
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Build your professional resume with AI
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                  errors.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                } focus:outline-none focus:ring-4 bg-gray-50 text-gray-900 placeholder-gray-500`}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="text-lg">⚠️</span> {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                } focus:outline-none focus:ring-4 bg-gray-50 text-gray-900 placeholder-gray-500`}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="text-lg">⚠️</span> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                } focus:outline-none focus:ring-4 bg-gray-50 text-gray-900 placeholder-gray-500`}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="text-lg">⚠️</span> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                } focus:outline-none focus:ring-4 bg-gray-50 text-gray-900 placeholder-gray-500`}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="text-lg">⚠️</span> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating your account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600 text-sm md:text-base">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-8 text-gray-600 text-xs md:text-sm">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
