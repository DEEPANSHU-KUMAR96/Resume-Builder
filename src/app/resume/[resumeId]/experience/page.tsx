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
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Step 3: Experience</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-6 md:py-12">

        {/* Page Header */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Work Experience</h2>
          <p className="text-gray-500 text-sm md:text-base font-medium">Detail your professional journey and key accomplishments.</p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-[2rem] border border-white/5 p-4 md:p-8 space-y-6">

          {/* Form Section */}
          <div className="border-b border-white/5 pb-10 mb-10">
            <h3 className="text-lg font-bold text-white mb-8">
              {editingIndex !== null ? 'Edit Experience record' : 'Add New Experience'}
            </h3>

            <div className="space-y-8">

              {/* Company & Position */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C]">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company || ''}
                    onChange={handleChange}
                    placeholder="e.g. Google, Microsoft"
                    className={`w-full px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.company
                      ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                      : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                      } focus:outline-none text-white placeholder-gray-700`}
                  />
                  {errors.company && (
                    <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.company}</p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C]">
                    Job Title/Position *
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position || ''}
                    onChange={handleChange}
                    placeholder="e.g. Senior Software Engineer"
                    className={`w-full px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.position
                      ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                      : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                      } focus:outline-none text-white placeholder-gray-700`}
                  />
                  {errors.position && (
                    <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.position}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C]">
                    Start Date *
                  </label>
                  <input
                    type="month"
                    name="startDate"
                    value={formData.startDate || ''}
                    onChange={handleChange}
                    className={`w-full px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.startDate
                      ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                      : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                      } focus:outline-none text-white`}
                  />
                  {errors.startDate && (
                    <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.startDate}</p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C]">
                    End Date *
                  </label>
                  <input
                    type="month"
                    name="endDate"
                    value={formData.endDate || ''}
                    onChange={handleChange}
                    className={`w-full px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.endDate
                      ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                      : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                      } focus:outline-none text-white`}
                  />
                  {errors.endDate && (
                    <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Description with AI */}
              <div className="group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-[#DC143C]">
                    Job Description *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generatingDescription}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC143C]/10 hover:bg-[#DC143C]/20 text-[#DC143C] font-bold border border-[#DC143C]/20 transition-all uppercase tracking-widest text-[10px]"
                  >
                    {generatingDescription ? '⏳ ANALYZING...' : '✨ BUILD WITH AI'}
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Describe your responsibilities, impact, and technology stack..."
                  rows={4}
                  className={`w-full px-5 py-4 rounded-2xl border-2 transition-all font-medium text-sm md:text-base ${errors.description
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700 resize-none`}
                />
                {errors.description && (
                  <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <button
                type="button"
                onClick={handleAddExperience}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/10 hover:border-[#DC143C]/50 text-gray-400 hover:text-white text-sm font-medium transition-all duration-200"
              >
                <div className="relative flex items-center justify-center gap-2 text-white font-bold uppercase tracking-widest text-xs">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : editingIndex !== null ? (
                    'Update Record'
                  ) : (
                    'Add Experience'
                  )}
                </div>
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl h-12 transition-all border border-white/5"
                >
                  Discard Changes
                </button>
              )}
            </div>
          </div>

          {/* Experience List */}
          {experience.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-6 px-1">Experience History ({experience.length})</h3>
              <div className="grid grid-cols-1 gap-6">
                {experience.map((exp, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border-2 transition-all relative overflow-hidden group/item ${editingIndex === index
                      ? 'border-[#DC143C]/50 bg-[#DC143C]/5'
                      : 'border-white/5 bg-white/5 hover:border-white/10'
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white group-hover/item:text-[#DC143C] transition-colors">{exp.position}</h4>
                        <p className="text-gray-400 font-medium text-sm">{exp.company}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-widest">
                            {exp.startDate} — {exp.endDate}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditExperience(index)}
                          className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(index)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-medium transition-all"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed font-medium">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience.length === 0 && editingIndex === null && (
            <div className="text-center py-20 opacity-20">
              <div className="text-5xl mb-4">💼</div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500 transition-colors">No professional history recorded</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/resume/${resumeId}/projects`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-200"
          >
            ← Previous: Projects
          </Link>
          <Link
            href={`/resume/${resumeId}/achievements`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:opacity-90 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-[#DC143C]/20 disabled:opacity-60"
          >
            Next: Achievements →
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-10 text-center opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Strategy: Utilize AI generation for high-impact descriptions that highlight your top results.
          </p>
        </div>
      </div>
    </div>
  );
}
