'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume, IPersonalInfo } from '@/types/resume.types';

export default function PersonalInfoPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [resume, setResume] = useState<IResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<IPersonalInfo>({
    fullname: '',
    email: '',
    mobile: '',
    location: '',
    github: '',
    linkedin: '',
    portfolio: ''
  });

  const [errors, setErrors] = useState<Partial<IPersonalInfo>>({});

  // Fetch resume data
  useEffect(() => {
    if (resumeId) {
      fetchResume();
    }
  }, [resumeId]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/resume/${resumeId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        const resumeData = response.data.data;
        setResume(resumeData);
        setFormData(resumeData.personalInfo || {
          fullname: '',
          email: '',
          mobile: '',
          location: '',
          github: '',
          linkedin: '',
          portfolio: ''
        });
      } else {
        toast.error(response.data.message || 'Failed to fetch resume');
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          router.push('/auth/login');
        } else {
          toast.error(error.response?.data?.message || 'Failed to fetch resume');
        }
      }
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Partial<IPersonalInfo> = {};

    if (!formData.fullname?.trim()) {
      newErrors.fullname = 'Full name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.mobile?.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9\s\-\+\(\)]{10,}$/.test(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile format';
    }

    if (formData.github && !/^https?:\/\/(www\.)?github\.com\//.test(formData.github)) {
      newErrors.github = 'Invalid GitHub URL';
    }

    if (formData.linkedin && !/^https?:\/\/(www\.)?linkedin\.com\//.test(formData.linkedin)) {
      newErrors.linkedin = 'Invalid LinkedIn URL';
    }

    if (formData.portfolio && !/^https?:\/\//.test(formData.portfolio)) {
      newErrors.portfolio = 'Portfolio URL must start with http:// or https://';
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

    if (errors[name as keyof IPersonalInfo]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { personalInfo: formData },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Personal information saved successfully!');
        setResume(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to save');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-x-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#DC143C]/10 to-transparent -z-0 pointer-events-none"></div>

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#DC143C] rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Step 1: Contact Info</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 relative z-10">

        {/* Page Header */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Personal Information</h2>
          <p className="text-gray-500 text-sm md:text-base font-medium">Enter your contact details and professional links.</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-[2rem] p-6 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

              {/* Full Name */}
              <div className="md:col-span-2 group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname || ''}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className={`w-full px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.fullname
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700`}
                />
                {errors.fullname && (
                  <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.fullname}</p>
                )}
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.email
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700`}
                />
                {errors.email && (
                  <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.email}</p>
                )}
              </div>

              {/* Mobile */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile || ''}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                  className={`w-full px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.mobile
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700`}
                />
                {errors.mobile && (
                  <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.mobile}</p>
                )}
              </div>

              {/* Location */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  placeholder="City, Country"
                  className="w-full px-5 py-3 rounded-xl border-2 border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50 focus:outline-none text-white font-medium text-sm md:text-base placeholder-gray-700 transition-all"
                />
              </div>

              {/* GitHub */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  name="github"
                  value={formData.github || ''}
                  onChange={handleChange}
                  placeholder="github.com/username"
                  className={`w-full px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.github
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700`}
                />
                {errors.github && (
                  <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.github}</p>
                )}
              </div>

              {/* LinkedIn */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin || ''}
                  onChange={handleChange}
                  placeholder="linkedin.com/in/username"
                  className={`w-full px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.linkedin
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700`}
                />
                {errors.linkedin && (
                  <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.linkedin}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/5">
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] relative group overflow-hidden rounded-xl bg-gradient-to-r from-[#DC143C] to-[#8B0000] h-12"
              >
                <div className="relative flex items-center justify-center gap-2 text-white font-bold uppercase tracking-widest text-xs">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Save Information'
                  )}
                </div>
              </button>
              <Link
                href={`/resume/${resumeId}/education`}
                className="flex-1 bg-white text-black hover:bg-[#F5F0E8] font-bold uppercase tracking-widest text-xs flex items-center justify-center rounded-xl h-12 transition-all active:scale-95"
              >
                Next Step →
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 text-center opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Tip: Use a professional email address for better recruiter response rates.
          </p>
        </div>
      </div>
    </div>
  );
}
