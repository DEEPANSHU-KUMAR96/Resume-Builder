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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4 border-4 border-indigo-100 border-t-indigo-600 rounded-full"></div>
          <p className="text-gray-600 font-medium">Preparing your summary workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Premium Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1">
            <span className="text-lg">←</span> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">AI Resume Builder</h1>
          </div>
          <div className="w-20"></div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Professional <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Summary</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            This is your elevator pitch. Make it count with a high-impact summary that captures your career essence.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Helper Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 p-7 border border-indigo-50 sticky top-28">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-extrabold text-gray-900">Magic AI Writer</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 px-1">
                    Target Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Dev"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 px-1">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  >
                    <option>Entry-Level</option>
                    <option>Mid-Level</option>
                    <option>Senior-Level</option>
                    <option>Executive</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="w-full py-4 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 hover:shadow-xl hover:shadow-indigo-200 text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-sm group"
                >
                  <span className="flex items-center justify-center gap-2">
                    {generatingSummary ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Synthesizing...
                        </>
                    ) : (
                        <>
                            <span className="group-hover:rotate-12 transition-transform">✨</span> 
                            Generate with AI
                        </>
                    )}
                  </span>
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-50">
                <div className="bg-blue-50 p-4 rounded-2xl">
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed flex gap-2">
                        <span>💡</span>
                        Our AI analyzes your skills and background to generate an industry-standard, ATS-optimized summary.
                    </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Editor Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-8 md:p-10 border border-gray-100 min-h-[500px] flex flex-col group">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-gray-900 text-2xl tracking-tight">Personal Manifesto</h3>
                <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {summary.length} Characters
                </div>
              </div>

              <div className="relative flex-1 flex flex-col">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter your professional summary here... For better results, use the AI generator →"
                  className="flex-1 w-full p-8 rounded-[2rem] border-2 border-transparent bg-gray-50/50 focus:bg-white focus:border-indigo-500/20 focus:ring-0 outline-none transition-all text-gray-700 text-lg leading-relaxed resize-none scrollbar-hide"
                />
              </div>

              {/* Action Bar */}
              <div className="mt-10 flex items-center justify-between gap-4">
                <Link
                  href={`/resume/${resumeId}/achievements`}
                  className="px-8 py-4 text-gray-400 font-bold hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Back
                </Link>
                <button
                  onClick={handleSave}
                  disabled={saving || !summary}
                  className="group relative px-10 py-4 bg-gray-900 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {saving ? 'Saving...' : 'Finalize & Preview'}
                    {!saving && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Visual background decorations */}
      <div className="fixed top-0 left-0 -z-10 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-indigo-200 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-purple-100 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}
