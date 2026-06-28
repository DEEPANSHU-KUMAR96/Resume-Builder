'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume, IProject } from '@/types/resume.types';

export default function ProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [resume, setResume] = useState<IResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [formData, setFormData] = useState<IProject>({
    title: '',
    description: '',
    techStack: [],
    githubUrl: '',
    liveUrl: ''
  });
  const [errors, setErrors] = useState<Partial<IProject>>({});
  const [techInput, setTechInput] = useState('');

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
        setProjects(resumeData.projects || []);
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
    const newErrors: Partial<IProject> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (formData.techStack && formData.techStack.length === 0) {
      newErrors.techStack = ['Add at least one technology'];
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

    if (errors[name as keyof IProject]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Add tech to stack
  const handleAddTech = () => {
    if (!techInput.trim()) return;

    const newTechStack = [...(formData.techStack || []), techInput.trim()];
    setFormData(prev => ({
      ...prev,
      techStack: newTechStack
    }));
    setTechInput('');
  };

  // Remove tech from stack
  const handleRemoveTech = (tech: string) => {
    const newTechStack = (formData.techStack || []).filter(t => t !== tech);
    setFormData(prev => ({
      ...prev,
      techStack: newTechStack
    }));
  };

  // Generate project description with AI
  const handleGenerateDescription = async () => {
    if (!formData.title?.trim()) {
      toast.error('Please enter a project title first');
      return;
    }

    if (!formData.techStack || formData.techStack.length === 0) {
      toast.error('Please add at least one technology');
      return;
    }

    try {
      setGeneratingDescription(true);
      toast.loading('🤖 Generating project description...', { id: 'ai-proj' });

      const response = await axios.post(
        '/api/ai/generate-project-description',
        {
          jobTitle: resume?.personalInfo?.fullname || 'Developer',
          experienceLevel: 'mid-level',
          techStack: formData.techStack,
          projectTitle: formData.title
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        const description = response.data.data?.description || '';
        setFormData(prev => ({
          ...prev,
          description
        }));
        toast.dismiss('ai-proj');
        toast.success('✨ Description generated!');
      } else {
        toast.dismiss('ai-proj');
        toast.error(response.data.message || 'Failed to generate description');
      }
    } catch (error: unknown) {
      toast.dismiss('ai-proj');
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to generate description');
      }
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Add or update project
  const handleAddProject = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      let updatedProjects: IProject[];

      if (editingIndex !== null) {
        updatedProjects = [...projects];
        updatedProjects[editingIndex] = formData;
      } else {
        updatedProjects = [...projects, formData];
      }

      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { projects: updatedProjects },
        { withCredentials: true }
      );

      if (response.data.success) {
        setProjects(updatedProjects);
        setFormData({
          title: '',
          description: '',
          techStack: [],
          githubUrl: '',
          liveUrl: ''
        });
        setEditingIndex(null);
        toast.success(editingIndex !== null ? 'Project updated!' : 'Project added!');
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

  // Edit project
  const handleEditProject = (index: number) => {
    setFormData(projects[index]);
    setEditingIndex(index);
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete project
  const handleDeleteProject = async (index: number) => {
    try {
      setSaving(true);
      const updatedProjects = projects.filter((_, i) => i !== index);

      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { projects: updatedProjects },
        { withCredentials: true }
      );

      if (response.data.success) {
        setProjects(updatedProjects);
        if (editingIndex === index) {
          setEditingIndex(null);
          setFormData({
            title: '',
            description: '',
            techStack: [],
            githubUrl: '',
            liveUrl: ''
          });
        }
        toast.success('Project deleted!');
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
      title: '',
      description: '',
      techStack: [],
      githubUrl: '',
      liveUrl: ''
    });
    setErrors({});
    setTechInput('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#DC143C]/20 border-t-[#DC143C] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium text-sm">Loading resume...</p>
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
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <Link href="/dashboard" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#DC143C] rounded-full animate-pulse"></div>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500">Step 4: Projects</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-6 md:py-12">

        {/* Page Header */}
        <div className="mb-8 md:mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Key Projects</h2>
          <p className="text-gray-500 text-xs sm:text-sm md:text-base font-medium px-4">Highlight your best work, technical depth, and problem-solving skills.</p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-[2rem] border border-white/5 p-4 md:p-8 space-y-6">

          {/* Form Section */}
          <div className="border-b border-white/5 pb-8 md:pb-10 mb-8 md:mb-10">
            <h3 className="text-base md:text-lg font-bold text-white mb-6 md:mb-8">
              {editingIndex !== null ? '✏️ Edit Project' : '➕ Add New Project'}
            </h3>

            <div className="space-y-6 md:space-y-8">

              {/* Project Title */}
              <div className="group">
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 md:mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  Project Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  placeholder="e.g. AI Content Platform"
                  className={`w-full px-4 md:px-5 py-3 rounded-xl border-2 transition-all font-medium text-sm md:text-base ${errors.title
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700`}
                />
                {errors.title && (
                  <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.title}</p>
                )}
              </div>

              {/* Description with AI */}
              <div className="group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 md:mb-3 px-1 gap-2">
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-[#DC143C] transition-colors">
                    Project Description *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generatingDescription}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC143C]/10 hover:bg-[#DC143C]/20 text-[#DC143C] font-bold border border-[#DC143C]/20 transition-all uppercase tracking-widest text-[10px] md:text-xs"
                  >
                    {generatingDescription ? '⏳ Analyzing...' : '✨ Generate with AI'}
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Describe the features, architecture, and your contributions..."
                  rows={4}
                  className={`w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 transition-all font-medium text-sm md:text-base ${errors.description
                    ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                    : 'border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50'
                    } focus:outline-none text-white placeholder-gray-700 resize-none`}
                />
                {errors.description && (
                  <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.description}</p>
                )}
              </div>

              {/* Tech Stack */}
              <div className="group">
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 md:mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                  Technology Stack *
                </label>
                <div className="flex gap-2 md:gap-3 mb-3 md:mb-4">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTech();
                      }
                    }}
                    placeholder="e.g. Next.js, OpenAI, Redis"
                    className="flex-1 min-w-0 px-4 md:px-5 py-3 rounded-xl border-2 border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50 focus:outline-none text-white font-medium text-sm md:text-base placeholder-gray-700 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddTech}
                    className="px-4 md:px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 transition-all text-[10px] md:text-xs uppercase tracking-widest shrink-0"
                  >
                    Add
                  </button>
                </div>

                {formData.techStack && formData.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.techStack.map((tech, idx) => (
                      <div key={idx} className="inline-flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-1 bg-[#DC143C]/10 border border-[#DC143C]/20 text-[#DC143C] rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider">
                        {tech}
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(tech)}
                          className="hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.techStack && (
                  <p className="mt-2 text-xs text-red-500 font-medium px-1">{errors.techStack}</p>
                )}
              </div>

              {/* URLs Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="group">
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 md:mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                    GitHub Repository
                  </label>
                  <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl || ''}
                    onChange={handleChange}
                    placeholder="github.com/user/project"
                    className="w-full px-4 md:px-5 py-3 rounded-xl border-2 border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50 focus:outline-none text-white font-medium text-sm md:text-base placeholder-gray-700 transition-all"
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 md:mb-3 px-1 group-focus-within:text-[#DC143C] transition-colors">
                    Live URL
                  </label>
                  <input
                    type="url"
                    name="liveUrl"
                    value={formData.liveUrl || ''}
                    onChange={handleChange}
                    placeholder="myproject.vercel.app"
                    className="w-full px-4 md:px-5 py-3 rounded-xl border-2 border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50 focus:outline-none text-white font-medium text-sm md:text-base placeholder-gray-700 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-8 md:mt-10">
              <button
                type="button"
                onClick={handleAddProject}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/10 hover:border-[#DC143C]/50 text-gray-400 hover:text-white text-sm font-medium transition-all duration-200"
              >
                <div className="relative flex items-center justify-center gap-2 text-white font-bold uppercase tracking-widest text-[10px] md:text-xs">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : editingIndex !== null ? (
                    'Update Project'
                  ) : (
                    'Add Project'
                  )}
                </div>
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] md:text-xs rounded-xl h-12 transition-all border border-white/5"
                >
                  Discard Changes
                </button>
              )}
            </div>
          </div>

          {/* Projects List */}
          {projects.length > 0 && (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.25em] md:tracking-[0.3em] mb-4 md:mb-6 px-1">Projects List ({projects.length})</h3>
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {projects.map((project, index) => (
                  <div
                    key={index}
                    className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all relative overflow-hidden group/item ${editingIndex === index
                      ? 'border-[#DC143C]/50 bg-[#DC143C]/5'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base md:text-xl font-bold text-white group-hover/item:text-[#DC143C] transition-colors truncate">{project.title}</h4>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleEditProject(index)}
                          className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-lg md:rounded-xl border border-white/5 transition-all text-sm"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteProject(index)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-medium transition-all"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-medium mb-3 md:mb-4 line-clamp-3">{project.description}</p>

                    {project.techStack && project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-6">
                        {project.techStack.map((tech, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white/5 text-gray-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded border border-white/5">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 md:gap-4">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#DC143C] hover:text-white font-bold text-[9px] md:text-[10px] uppercase tracking-widest flex items-center gap-1.5 underline decoration-[#DC143C]/50 underline-offset-4"
                        >
                          🔗 Source Code
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#DC143C] hover:text-white font-bold text-[9px] md:text-[10px] uppercase tracking-widest flex items-center gap-1.5 underline decoration-[#DC143C]/50 underline-offset-4"
                        >
                          🚀 Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length === 0 && editingIndex === null && (
            <div className="text-center py-16 md:py-20 opacity-30">
              <div className="text-4xl md:text-5xl mb-4">📂</div>
              <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-500">No projects added yet</p>
              <p className="text-[10px] text-gray-600 mt-2">Use the form above to add your first project.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/resume/${resumeId}/skills`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-200"
          >
            ← Previous: Skills
          </Link>
          <Link
            href={`/resume/${resumeId}/experience`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:opacity-90 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-[#DC143C]/20 disabled:opacity-60"
          >
            Next: Experience →
          </Link>
        </div>

        {/* Tip */}
        <div className="mt-6 md:mt-10 text-center opacity-40">
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-gray-500 px-4">
            Tip: Prioritize projects that demonstrate production-ready engineering and modern architectural patterns.
          </p>
        </div>
      </div>
    </div>
  );
}
