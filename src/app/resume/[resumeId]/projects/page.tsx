'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
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
      newErrors.techStack = 'Add at least one technology';
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
      toast.loading('🤖 Generating project description with AI...');

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
            <h1 className="text-xl font-bold text-gray-900">Projects</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Projects</h2>
          <p className="text-gray-600">Showcase your best work and projects</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-10">
          
          {/* Form Section */}
          <div className="border-b border-gray-200 pb-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingIndex !== null ? 'Edit Project' : 'Add New Project'}
            </h3>

            <div className="space-y-6">
              
              {/* Project Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  placeholder="e.g., AI Resume Builder"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    errors.title
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500'
                  } focus:outline-none bg-gray-50`}
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.title}</p>
                )}
              </div>

              {/* Description with AI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Project Description *
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
                  placeholder="Describe your project, what problems it solves, and your role..."
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

              {/* Tech Stack */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technologies Used *
                </label>
                <div className="flex gap-3 mb-3">
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
                    placeholder="e.g., React, Node.js, MongoDB"
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddTech}
                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {formData.techStack && formData.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.techStack.map((tech, idx) => (
                      <div key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {tech}
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(tech)}
                          className="hover:text-red-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.techStack && (
                  <p className="mt-2 text-sm text-red-600">⚠️ {errors.techStack}</p>
                )}
              </div>

              {/* GitHub URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Repository
                </label>
                <input
                  type="url"
                  name="githubUrl"
                  value={formData.githubUrl || ''}
                  onChange={handleChange}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50"
                />
              </div>

              {/* Live URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Live Website/Demo
                </label>
                <input
                  type="url"
                  name="liveUrl"
                  value={formData.liveUrl || ''}
                  onChange={handleChange}
                  placeholder="https://yourproject.com"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleAddProject}
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
                  '✏️ Update Project'
                ) : (
                  '➕ Add Project'
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

          {/* Projects List */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Your Projects ({projects.length})</h3>
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      editingIndex === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{project.title}</h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProject(index)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteProject(index)}
                          disabled={saving}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{project.description}</p>
                    
                    {project.techStack && project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.techStack.map((tech, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-4 text-sm">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          🔗 GitHub
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-semibold"
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
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No projects added yet</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link
            href={`/resume/${resumeId}/skills`}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors text-center"
          >
            ← Previous: Skills
          </Link>
          <Link
            href={`/resume/${resumeId}/experience`}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all text-center"
          >
            Next: Experience →
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Include 2-3 of your best projects with clear descriptions and links. Use the AI generator to create compelling descriptions based on your project title and tech stack.
          </p>
        </div>
      </div>
    </div>
  );
}
