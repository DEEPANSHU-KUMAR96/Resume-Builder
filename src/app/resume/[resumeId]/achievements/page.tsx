'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume } from '@/types/resume.types';

/**
 * AchievementsPage Component
 * 
 * Manages the "Achievements" section, which maps to the "certifications" field 
 * in our database schema. It allows users to list awards, certificates, 
 * and other professional accolades.
 */
export default function AchievementsPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

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
        // In our schema, achievements are stored in 'certifications'
        setAchievements(response.data.data.certifications || []);
      } else {
        toast.error('Failed to fetch resume');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error('Session expired');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!inputValue.trim()) return;

    // Check for duplicates
    if (achievements.includes(inputValue.trim())) {
      toast.error('This item is already in your list');
      return;
    }

    setAchievements([...achievements, inputValue.trim()]);
    setInputValue('');
  };

  const handleRemoveItem = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.patch(
        `/api/resume/${resumeId}`,
        { certifications: achievements },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Achievements saved successfully!');
        router.push(`/resume/${resumeId}/summary`);
      } else {
        toast.error(response.data.message || 'Failed to save');
      }
    } catch (error: any) {
      toast.error('An error occurred during save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 text-blue-600 border-4 border-blue-100 border-t-blue-600 rounded-full"></div>
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Step 5: Achievements</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 md:px-6 md:py-12">

        {/* Page Header */}
        <div className="mb-14 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight uppercase tracking-wider">Honors & Accolades</h2>
          <p className="text-gray-500 text-sm md:text-base font-medium max-w-2xl mx-auto">
            Document your professional certificates, awards, and significant industry milestones.
          </p>
        </div>

        <div className="glass rounded-[2rem] border border-white/5 p-4 md:p-8 space-y-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#DC143C]/5 blur-3xl rounded-full"></div>

          {/* Input Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-12 border-b border-white/5 pb-12">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect"
              className="flex-1 px-5 py-4 rounded-2xl border-2 border-white/5 bg-[#1A1A1A] focus:border-[#DC143C]/50 outline-none transition-all text-white font-medium text-sm md:text-base placeholder-gray-700"
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <button
              onClick={handleAddItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/10 hover:border-[#DC143C]/50 text-gray-400 hover:text-white text-sm font-medium transition-all duration-200"
            >
              Add Achievement
            </button>
          </div>

          {/* List Display */}
          <div className="space-y-6 mb-12">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-6 px-1">Achievements List ({achievements.length})</h3>

            {achievements.map((item, i) => (
              <div
                key={i}
                className="group flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-[#DC143C]/30 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#DC143C]/20"></div>
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-[#DC143C]/10 border border-[#DC143C]/20 flex items-center justify-center text-lg shadow-inner">
                    <span className="text-[#DC143C]">🏆</span>
                  </div>
                  <span className="font-bold text-gray-200 text-sm md:text-base">{item}</span>
                </div>
                <button
                  onClick={() => handleRemoveItem(i)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-medium transition-all"
                >
                  ✕
                </button>
              </div>
            ))}

            {achievements.length === 0 && (
              <div className="text-center py-24 bg-white/2 border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
                <div className="text-5xl mb-4">🎖️</div>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No achievements added yet</p>
                <p className="text-xs text-gray-500 mt-2">Add your certifications or honors to showcase your expertise.</p>
              </div>
            )}
          </div>

          {/* Navigation Section */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/resume/${resumeId}/experience`}
              className="order-2 sm:order-1 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-200"
            >
              ← Previous: Industry Experience
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="order-1 sm:order-2 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:opacity-90 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-[#DC143C]/20 disabled:opacity-60"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Continue to Summary <span className="text-lg">→</span></>
              )}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center opacity-40">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] max-w-xl mx-auto leading-relaxed">
            Strategy: Document professional licenses and international certifications to increase index visibility in automated ATS evaluations.
          </p>
        </div>
      </div>
    </div>
  );
}
