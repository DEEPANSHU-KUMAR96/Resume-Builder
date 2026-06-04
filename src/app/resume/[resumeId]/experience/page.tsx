'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume, IWorkExperience } from '@/types/resume.types';

export default function ExperiencePage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [resume, setResume] = useState<IResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experience, setExperience] = useState<IWorkExperience[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [formData, setFormData] = useState<IWorkExperience>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [errors, setErrors] = useState<Partial<IWorkExperience>>({});

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
        setExperience(resumeData.workExperience || []);
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
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<IWorkExperience> = {};

    if (!formData.company?.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.position?.trim()) {
      newErrors.position = 'Position/Job title is required';
    }

    if (!formData.startDate?.trim()) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate?.trim()) {
      newErrors.endDate = 'End date is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name as keyof IWorkExperience]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Generate experience description with AI
  const handleGenerateDescription = async () => {
    if (!formData.position?.trim()) {
      toast.error('Please enter job position first');
      return;
    }

    if (!formData.company?.trim()) {
      toast.error('Please enter company name first');
      return;
    }

    try {
      setGeneratingDescription(true);
      toast.loading('🤖 Generating experience description with AI...');

      // Calculate duration
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const durationMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      const duration = Math.max(durationMonths, 1);

      const response = await axios.post(
        '/api/ai/generate-experience-description',
        {
          jobRole: formData.position,
          companyName: formData.company,
          experienceLevel: 2, // mid-level
          duration: `${duration} months`,
          techStack: resume?.skills || ['General']
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        const description = response.data.data?.description || '';
        setFormData(prev => ({
          ...prev,
          description
        }));
        toast.dismiss();
        toast.success('✨ Description generated!');
      } else {
        toast.dismiss();
        toast.error(response.data.message || 'Failed to generate description');
      }
    } catch (error: unknown) {
      toast.dismiss();
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to generate description');
      }
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Add or update experience
  const handleAddExperience = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      let updatedExperience: IWorkExperience[];

      if (editingIndex !== null) {
        updatedExperience = [...experience];
        updatedExperience[editingIndex] = formData;
      } else {
        updatedExperience = [...experience, formData];
      }

      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { workExperience: updatedExperience },
        { withCredentials: true }
      );

      if (response.data.success) {
        setExperience(updatedExperience);
        setFormData({
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          description: ''
        });
        setEditingIndex(null);
        toast.success(editingIndex !== null ? 'Experience updated!' : 'Experience added!');
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

  // Edit experience
  const handleEditExperience = (index: number) => {
    setFormData(experience[index]);
    setEditingIndex(index);
  };

  // Delete experience
  const handleDeleteExperience = async (index: number) => {
    try {
      setSaving(true);
      const updatedExperience = experience.filter((_, i) => i !== index);

      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { workExperience: updatedExperience },
        { withCredentials: true }
      );

      if (response.data.success) {
        setExperience(updatedExperience);
        if (editingIndex === index) {
          setEditingIndex(null);
          setFormData({
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            description: ''
          });
        }
        toast.success('Experience deleted!');
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
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: ''
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
            <h1 className="text-xl font-bold text-gray-900">Experience</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Work Experience</h2>
          <p className="text-gray-600">Add your professional work experience</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-10">
          
          {/* Form Section */}
          <div className="border-b border-gray-200 pb-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingIndex !== null ? 'Edit Experience' : 'Add New Experience'}
            </h3>

            <div className="space-y-6">
              
              {/* Company & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company || ''}
                    onChange={handleChange}
                    placeholder="e.g., Google, Microsoft"
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                      errors.company
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    } focus:outline-none bg-gray-50`}
                  />
                  {errors.company && (
                    <p className="mt-2 text-sm text-red-600">⚠️ {errors.company}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title/Position *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position || ''}
                    onChange={handleChange}
                    placeholder="e.g., Senior Software Engineer"
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                      errors.position
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    } focus:outline-none bg-gray-50`}
                  />
                  {errors.position && (
                    <p className="mt-2 text-sm text-red-600">⚠️ {errors.position}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Description with AI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Job Description *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generatingDescription}
                    className="text-xs px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded transition-colors"
                  >
                    {generatingDescription ? '⏳ Generating...' : '✨ Generate with AI'}
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Describe your responsibilities, achievements, and technologies used..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.description
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50 resize-none`}
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.description}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleAddExperience}
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
                  '✏️ Update Experience'
                ) : (
                  '➕ Add Experience'
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

          {/* Experience List */}
          {experience.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Your Experience ({experience.length})</h3>
              <div className="space-y-4">
                {experience.map((exp, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      editingIndex === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{exp.position}</h4>
                        <p className="text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {exp.startDate} - {exp.endDate}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditExperience(index)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(index)}
                          disabled={saving}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience.length === 0 && editingIndex === null && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No experience entries yet</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link
            href={`/resume/${resumeId}/projects`}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors text-center"
          >
            ← Previous: Projects
          </Link>
          <Link
            href={`/resume/${resumeId}/achievements`}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all text-center"
          >
            Next: Achievements →
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Use the AI generator to create compelling job descriptions. Include key achievements and responsibilities in each role.
          </p>
        </div>
      </div>
    </div>
  );
}
