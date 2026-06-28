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
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Step 3: Skillset</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-6 md:py-12">

        {/* Page Header */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Professional Skills</h2>
          <p className="text-gray-500 text-sm md:text-base font-medium">Showcase your technical expertise and core competencies.</p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-[2rem] border border-white/5 p-4 md:p-8 space-y-6">

          {/* AI Generation Section */}
          <div className="bg-gradient-to-br from-[#DC143C]/10 to-[#8B0000]/5 border border-[#DC143C]/20 rounded-2xl p-6 md:p-8 mb-10 overflow-hidden relative group/ai">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#DC143C]/5 blur-3xl rounded-full -z-10 group-hover/ai:bg-[#DC143C]/10 transition-colors"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">AI-Powered Generation</h3>
                <p className="text-gray-400 text-sm font-medium">Extract skills automatically based on your role and industry.</p>
              </div>
              <button
                onClick={handleGenerateSkills}
                disabled={generatingSkills}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-[#F5F0E8] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 shadow-lg shadow-[#DC143C]/10"
              >
                {generatingSkills ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  '🚀 Generate with AI'
                )}
              </button>
            </div>
          </div>

          {/* Add Skill Form */}
          <div className="border-b border-white/5 pb-10 mb-10">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-6 px-1">Manual Entry</h3>
            <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. React, Python, AWS, DevOps..."
                className="flex-1 px-5 py-3 rounded-xl border-2 border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50 focus:outline-none text-white font-medium text-sm md:text-base placeholder-gray-700 transition-all"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/10 hover:border-[#DC143C]/50 text-gray-400 hover:text-white text-sm font-medium transition-all duration-200"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Add Skill'
                )}
              </button>
            </form>
          </div>

          {/* Skills Display */}
          {skills.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-6 px-1">Identified Skills ({skills.length})</h3>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 hover:border-[#DC143C]/30 rounded-full group transition-all"
                  >
                    <span className="text-gray-300 font-bold text-xs uppercase tracking-wider">{skill}</span>
                    <button
                      onClick={() => handleDeleteSkill(skill)}
                      disabled={saving}
                      className="text-gray-600 hover:text-red-500 transition-colors"
                      title="Remove skill"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 opacity-20">
              <div className="text-5xl mb-4">🛠️</div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500 transition-colors">Skill list remains empty</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/resume/${resumeId}/education`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-200"
          >
            ← Previous: Education
          </Link>
          <Link
            href={`/resume/${resumeId}/projects`}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:opacity-90 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-[#DC143C]/20 disabled:opacity-60"
          >
            Next: Projects →
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-10 text-center opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Tip: Combine hard technical skills with soft skills like leadership and problem-solving for a well-rounded profile.
          </p>
        </div>
      </div>
    </div>
  );
}
