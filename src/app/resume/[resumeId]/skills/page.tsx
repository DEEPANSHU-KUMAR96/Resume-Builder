'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume } from '@/types/resume.types';

export default function SkillsPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [resume, setResume] = useState<IResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [generatingSkills, setGeneratingSkills] = useState(false);

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
        setSkills(resumeData.skills || []);
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

  // Add skill
  const handleAddSkill = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newSkill.trim()) {
      toast.error('Please enter a skill');
      return;
    }

    if (skills.includes(newSkill.trim())) {
      toast.error('This skill already exists');
      setNewSkill('');
      return;
    }

    try {
      setSaving(true);
      const updatedSkills = [...skills, newSkill.trim()];

      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { skills: updatedSkills },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSkills(updatedSkills);
        setNewSkill('');
        toast.success('Skill added!');
      } else {
        toast.error(response.data.message || 'Failed to add skill');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to add skill');
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete skill
  const handleDeleteSkill = async (skillToDelete: string) => {
    try {
      setSaving(true);
      const updatedSkills = skills.filter(skill => skill !== skillToDelete);

      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { skills: updatedSkills },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSkills(updatedSkills);
        toast.success('Skill removed!');
      } else {
        toast.error(response.data.message || 'Failed to remove skill');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to remove skill');
      }
    } finally {
      setSaving(false);
    }
  };

  // Generate skills using AI
  const handleGenerateSkills = async () => {
    // Get job title and experience level for AI generation
    const jobTitle = resume?.personalInfo?.fullname ? prompt('What is your job title/role?') : '';
    const experienceLevel = prompt('What is your experience level? (e.g., Junior, Mid-level, Senior)');

    if (!jobTitle || !experienceLevel) {
      toast.error('Please provide job title and experience level');
      return;
    }

    try {
      setGeneratingSkills(true);
      toast.loading('🤖 Generating skills with AI...');

      const response = await axios.post(
        '/api/ai/generate-skills',
        {
          jobTitle,
          experienceLevel
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        const generatedSkills = response.data.data?.skills || [];
        
        // Merge with existing skills (avoid duplicates)
        const mergedSkills = Array.from(new Set([...skills, ...generatedSkills]));
        
        const updateResponse = await axios.patch(
          `/api/resume/${resumeId}`,
          { skills: mergedSkills },
          { withCredentials: true }
        );

        if (updateResponse.data.success) {
          setSkills(mergedSkills);
          toast.dismiss();
          toast.success('✨ Skills generated and added!');
        }
      } else {
        toast.dismiss();
        toast.error(response.data.message || 'Failed to generate skills');
      }
    } catch (error: unknown) {
      toast.dismiss();
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to generate skills');
      }
    } finally {
      setGeneratingSkills(false);
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
            <h1 className="text-xl font-bold text-gray-900">Skills</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Skills</h2>
          <p className="text-gray-600">Add your technical and professional skills</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-10">
          
          {/* AI Generation Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">✨ AI-Powered Skill Generation</h3>
                <p className="text-gray-600 text-sm">Generate skills based on your job title and experience level</p>
              </div>
              <button
                onClick={handleGenerateSkills}
                disabled={generatingSkills}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {generatingSkills ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  '🚀 Generate with AI'
                )}
              </button>
            </div>
          </div>

          {/* Add Skill Form */}
          <div className="border-b border-gray-200 pb-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Skill Manually</h3>
            <form onSubmit={handleAddSkill} className="flex gap-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g., React, Python, Project Management..."
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-gray-50"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  '➕ Add'
                )}
              </button>
            </form>
          </div>

          {/* Skills Display */}
          {skills.length > 0 ? (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-6">Your Skills ({skills.length})</h3>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-full group hover:shadow-md transition-all"
                  >
                    <span className="text-gray-900 font-medium">{skill}</span>
                    <button
                      onClick={() => handleDeleteSkill(skill)}
                      disabled={saving}
                      className="text-gray-500 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove skill"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No skills added yet</p>
              <p className="text-gray-400 text-sm">Add skills manually or generate them with AI</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link
            href={`/resume/${resumeId}/education`}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-colors text-center"
          >
            ← Previous: Education
          </Link>
          <Link
            href={`/resume/${resumeId}/projects`}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all text-center"
          >
            Next: Projects →
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Include both technical skills (programming languages, tools) and soft skills (communication, leadership).
          </p>
        </div>
      </div>
    </div>
  );
}
