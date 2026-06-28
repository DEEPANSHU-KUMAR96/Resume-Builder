'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume } from '@/types/resume.types';

/**
 * SummaryPage Component
 * 
 * This page allows users to create a professional summary for their resume.
 * It features an AI generation tool that leverages the user's existing 
 * skills and experience to craft a high-impact introduction.
 */
export default function SummaryPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [resume, setResume] = useState<IResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // AI related state
  const [jobTitle, setJobTitle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level');

  // Fetch resume data on component mount
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
        setSummary(resumeData.summary || '');

        // Auto-detect job title from the most recent work experience if it exists
        if (resumeData.workExperience && resumeData.workExperience.length > 0) {
          setJobTitle(resumeData.workExperience[0].position);
        }
      } else {
        toast.error(response.data.message || 'Failed to fetch resume');
        router.push('/dashboard');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/auth/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch resume');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleGenerateSummary
   * Calls the AI endpoint to generate a professional summary based on 
   * the provided job title, experience level, and listed skills.
   */
  const handleGenerateSummary = async () => {
    if (!jobTitle) {
      toast.error('Please provide a target Job Title for better AI generation');
      return;
    }

    if (!resume?.skills || resume.skills.length === 0) {
      toast.error('Please add some skills in the Skills section first to help AI generate a contextual summary');
      return;
    }

    try {
      setGeneratingSummary(true);
      toast.loading('🤖 AI is crafting your professional summary...');

      const response = await axios.post(
        '/api/ai/generate-summary',
        {
          jobTitle,
          experienceLevel,
          skills: resume.skills.join(', ')
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSummary(response.data.data.summary);
        toast.dismiss();
        toast.success('✨ Professional summary generated!');
      } else {
        toast.dismiss();
        toast.error(response.data.message || 'Failed to generate summary');
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  /**
   * handleSave
   * Updates the resume with the new summary and proceeds to the final preview.
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { summary },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Summary saved successfully!');
        // Proceed to the final step: Preview
        router.push(`/resume/${resumeId}/preview`);
      } else {
        toast.error(response.data.message || 'Failed to save summary');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save summary');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 text-[#DC143C] mx-auto mb-4 border-4 border-white/5 border-t-[#DC143C] rounded-full"></div>
          <p className="text-gray-500 font-medium tracking-tight">Preparing your summary workspace...</p>
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Step 6: Summary</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* Header Section */}
        <div className="mb-14 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Professional Summary</h2>
          <p className="text-gray-500 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Elevate your profile with a high-impact narrative that captures your architectural vision and career depth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">

          {/* AI Helper Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-[2rem] border border-white/5 p-4 md:p-8 space-y-6 sticky top-28 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#DC143C]/5 blur-2xl rounded-full"></div>

              <div className="flex items-center gap-3 mb-10 relative z-10">
                <div className="w-10 h-10 flex items-center justify-center bg-[#DC143C]/10 rounded-xl text-[#DC143C] border border-[#DC143C]/20">
                  <span className="text-xl">✨</span>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Content Engine</h3>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="group">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C]">
                    Target Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Software Architect"
                    className="w-full px-5 py-3 rounded-xl border-2 border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50 outline-none transition-all text-sm font-medium text-white placeholder-gray-700"
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 group-focus-within:text-[#DC143C]">
                    Seniority Grade
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-5 py-3 rounded-xl border-2 border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50 outline-none transition-all text-sm font-medium text-white appearance-none cursor-pointer"
                  >
                    <option className="bg-[#0A0A0A]">Entry-Level</option>
                    <option className="bg-[#0A0A0A]">Mid-Level</option>
                    <option className="bg-[#0A0A0A]">Senior-Level</option>
                    <option className="bg-[#0A0A0A]">Executive</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-[#F5F0E8] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all duration-200 shadow-lg shadow-[#DC143C]/10"
                >
                  {generatingSummary ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <><span>✨</span> Generate Summary</>
                  )}
                </button>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 group/tip">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-relaxed flex items-start gap-2 group-hover/tip:text-gray-400 transition-colors">
                  <span className="text-[#DC143C]">💡</span>
                  The AI engine analyzes your distinct competencies to construct an ATS-optimized professional narrative.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass rounded-[2rem] border border-white/5 p-4 md:p-8 space-y-6 flex flex-col relative overflow-hidden group/editor">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full group-hover/editor:bg-[#DC143C]/5 transition-colors duration-1000"></div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-lg font-bold text-white tracking-tight">Professional Narrative</h3>
                <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-white/5">
                  {summary.length} Characters
                </div>
              </div>

              <div className="relative flex-1 flex flex-col z-10">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Articulate your career journey, leadership impact, and technical depth here..."
                  className="flex-1 w-full p-6 md:p-8 rounded-2xl border-2 border-white/5 bg-[#1A1A1A] focus:bg-[#1A1A1A] focus:border-[#DC143C]/20 outline-none transition-all text-gray-300 text-base md:text-lg leading-relaxed resize-none placeholder-gray-800"
                />
              </div>

              {/* Action Bar */}
              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/resume/${resumeId}/experience`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-200"
                >
                  ← Previous section
                </Link>
                <button
                  onClick={handleSave}
                  disabled={saving || !summary}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:opacity-90 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-[#DC143C]/20 disabled:opacity-60"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Preview Resume <span className="text-lg">→</span></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
