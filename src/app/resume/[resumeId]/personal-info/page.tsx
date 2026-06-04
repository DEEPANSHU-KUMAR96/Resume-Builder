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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
              ← Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Personal Information</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Personal Information</h2>
          <p className="text-gray-600">Add your contact details and professional links</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-10">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname || ''}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.fullname
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.fullname && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.fullname}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.email}</p>
                )}
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile *
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile || ''}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.mobile
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.mobile && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.mobile}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50"
                />
              </div>

              {/* GitHub */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  name="github"
                  value={formData.github || ''}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.github
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.github && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.github}</p>
                )}
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin || ''}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.linkedin
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.linkedin && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.linkedin}</p>
                )}
              </div>

              {/* Portfolio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio Website
                </label>
                <input
                  type="url"
                  name="portfolio"
                  value={formData.portfolio || ''}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.portfolio
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.portfolio && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.portfolio}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  '💾 Save Personal Information'
                )}
              </button>
              <Link
                href={`/resume/${resumeId}/education`}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors text-center"
              >
                Next: Education →
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Make sure your email and phone number are correct. Recruiters will use these to contact you.
          </p>
        </div>
      </div>
    </div>
  );
}
