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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm font-bold text-gray-400">
           <span>Resume</span>
           <span>/</span>
           <span className="text-gray-900">Achievements</span>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 p-10 border border-indigo-50">
          <div className="mb-10">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Honors & Accolades</h2>
            <p className="text-gray-500 font-medium">List your certifications, awards, and major milestones.</p>
          </div>
          
          {/* Input Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. AWS Certified Cloud Practitioner"
              className="flex-1 p-5 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-indigo-500/20 focus:ring-0 outline-none transition-all text-gray-700 font-medium"
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <button 
              onClick={handleAddItem}
              className="px-8 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
            >
              Add Item
            </button>
          </div>

          {/* List Display */}
          <div className="space-y-4 mb-12">
            {achievements.map((item, i) => (
              <div 
                key={i} 
                className="group flex justify-between items-center p-5 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">🏆</div>
                    <span className="font-bold text-gray-700">{item}</span>
                </div>
                <button 
                    onClick={() => handleRemoveItem(i)} 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all font-black"
                >
                    ✕
                </button>
              </div>
            ))}
            
            {achievements.length === 0 && (
              <div className="text-center py-16 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Your trophy case is empty</p>
                <p className="text-gray-300 text-sm mt-1">Start adding your achievements above.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-gray-50 pt-10">
            <Link 
              href={`/resume/${resumeId}/experience`} 
              className="order-2 sm:order-1 text-gray-400 font-black hover:text-gray-900 transition-all uppercase tracking-widest text-xs"
            >
              ← Previous: Experience
            </Link>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="order-1 sm:order-2 w-full sm:w-auto px-12 py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-100 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Continue →'}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 font-medium">
                Tip: Including certifications from recognized providers (AWS, Google, Coursera) significantly boosts ATS scoring.
            </p>
        </div>
      </div>
    </div>
  );
}
