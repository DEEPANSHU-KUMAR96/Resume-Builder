'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume, IEducation } from '@/types/resume.types';

export default function EducationPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [resume, setResume] = useState<IResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [education, setEducation] = useState<IEducation[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<IEducation>({
    institution: '',
    degree: '',
    startDate: '',
    endDate: ''
  });
  const [errors, setErrors] = useState<Partial<IEducation>>({});

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
        setEducation(resumeData.education || []);
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<IEducation> = {};

    if (!formData.institution?.trim()) {
      newErrors.institution = 'Institution name is required';
    }

    if (!formData.degree?.trim()) {
      newErrors.degree = 'Degree is required';
    }

    if (!formData.startDate?.trim()) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate?.trim()) {
      newErrors.endDate = 'End date is required';
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

    if (errors[name as keyof IEducation]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Add or update education
  const handleAddEducation = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      let updatedEducation: IEducation[];

      if (editingIndex !== null) {
        // Update existing
        updatedEducation = [...education];
        updatedEducation[editingIndex] = formData;
      } else {
        // Add new
        updatedEducation = [...education, formData];
      }

      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { education: updatedEducation },
        { withCredentials: true }
      );

      if (response.data.success) {
        setEducation(updatedEducation);
        setFormData({
          institution: '',
          degree: '',
          startDate: '',
          endDate: ''
        });
        setEditingIndex(null);
        toast.success(editingIndex !== null ? 'Education updated!' : 'Education added!');
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

  // Edit education
  const handleEditEducation = (index: number) => {
    setFormData(education[index]);
    setEditingIndex(index);
  };

  // Delete education
  const handleDeleteEducation = async (index: number) => {
    try {
      setSaving(true);
      const updatedEducation = education.filter((_, i) => i !== index);

      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { education: updatedEducation },
        { withCredentials: true }
      );

      if (response.data.success) {
        setEducation(updatedEducation);
        if (editingIndex === index) {
          setEditingIndex(null);
          setFormData({
            institution: '',
            degree: '',
            startDate: '',
            endDate: ''
          });
        }
        toast.success('Education deleted!');
      } else {
        toast.error(response.data.message || 'Failed to delete');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      }
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingIndex(null);
    setFormData({
      institution: '',
      degree: '',
      startDate: '',
      endDate: ''
    });
    setErrors({});
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
            <h1 className="text-xl font-bold text-gray-900">Education</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Education</h2>
          <p className="text-gray-600">Add your educational background</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-10">
          
          {/* Form Section */}
          <div className="border-b border-gray-200 pb-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingIndex !== null ? 'Edit Education' : 'Add New Education'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              {/* Institution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Name *
                </label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution || ''}
                  onChange={handleChange}
                  placeholder="e.g., University of California"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.institution
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.institution && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.institution}</p>
                )}
              </div>

              {/* Degree */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Degree *
                </label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree || ''}
                  onChange={handleChange}
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.degree
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.degree && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.degree}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="month"
                  name="startDate"
                  value={formData.startDate || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.startDate
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.startDate && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="month"
                  name="endDate"
                  value={formData.endDate || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.endDate
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.endDate && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddEducation}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : editingIndex !== null ? (
                  '✏️ Update Education'
                ) : (
                  '➕ Add Education'
                )}
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Education List */}
          {education.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Your Education ({education.length})</h3>
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-lg border-2 transition-all ${
                      editingIndex === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{edu.degree}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {edu.startDate} - {edu.endDate}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditEducation(index)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteEducation(index)}
                          disabled={saving}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length === 0 && editingIndex === null && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No education entries yet</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link
            href={`/resume/${resumeId}/personal-info`}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors text-center"
          >
            ← Previous: Personal Info
          </Link>
          <Link
            href={`/resume/${resumeId}/skills`}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all text-center"
          >
            Next: Skills →
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Add all your educational qualifications including degree, institution, and dates.
          </p>
        </div>
      </div>
    </div>
  );
}
