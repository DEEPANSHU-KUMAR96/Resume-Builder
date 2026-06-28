'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume } from '@/types/resume.types';

export default function DashboardPage() {
  const router = useRouter();

  const [resumes, setResumes] = useState<IResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingResume, setCreatingResume] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch all resumes on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  // Fetch resumes from API
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/resume', {
          withCredentials: true
        });

        if (response.data.success) {
          setResumes(response.data.data || []);
        } else {
          toast.error(response.data.message || 'Failed to fetch resumes');
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
          // Unauthorized - redirect to login
            router.push('/auth/login');
            toast.error('Your session has expired. Please login again.');
          } else {
            toast.error(error.response?.data?.message || 'Failed to fetch resumes');
          }
        } else {
          toast.error('An unexpected error occurred');
        }
        console.error('Fetch resumes error:', error);
      } finally {
        setLoading(false);
      }
    };

  // Create new resume
  const handleCreateResume = async () => {
    try {
      setCreatingResume(true);
      const response = await axios.post('/api/resume/create',
        {
          title: 'Untitled Resume'
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        const newResume = response.data.data;
        toast.success('Resume created successfully!');
        router.push(`/resume/${newResume._id}/personal-info`);
      } else {
        toast.error(response.data.message || 'Failed to create resume');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          router.push('/auth/login');
          toast.error('Your session has expired. Please login again.');
        } else {
          toast.error(error.response?.data?.message || 'Failed to create resume');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Create resume error:', error);
    } finally {
      setCreatingResume(false);
    }
  };

  // Delete resume
  const handleDeleteResume = async (resumeId: string) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(resumeId);
      const response = await axios.delete(`/api/resume/${resumeId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success('Resume deleted successfully');
        setResumes(resumes.filter(r => r._id !== resumeId));
      } else {
        toast.error(response.data.message || 'Failed to delete resume');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          router.push('/auth/login');
          toast.error('Your session has expired. Please login again.');
        } else {
          toast.error(error.response?.data?.message || 'Failed to delete resume');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Delete resume error:', error);
    } finally {
      setDeleting(null);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      // Clear any stored tokens/data
      localStorage.clear();
      sessionStorage.clear();

      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-x-hidden selection:bg-[#DC143C]/30">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#DC143C]/5 rounded-full blur-[100px] md:blur-[150px] -z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[20%] h-[20%] bg-[#DC143C]/5 rounded-full blur-[100px] -z-0 pointer-events-none"></div>

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#DC143C] to-[#8B0000] rounded-lg flex items-center justify-center shadow-[#DC143C]/20 border border-white/10">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight uppercase">Resume Builder</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-white/10 hover:border-[#DC143C]/50 hover:bg-[#DC143C]/5 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all rounded-lg"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16 relative z-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">Your Resumes</h2>
            <p className="text-gray-500 font-medium text-sm md:text-lg max-w-xl">
              Manage and optimize your professional resumes with AI.
            </p>
          </div>

          <button
            onClick={handleCreateResume}
            disabled={creatingResume}
            className="group relative overflow-hidden px-6 md:px-8 py-3 md:py-4 rounded-xl active:scale-95 transition-all text-white font-bold text-sm shadow-xl shadow-[#DC143C]/10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#DC143C] to-[#8B0000] group-hover:scale-110 transition-transform"></div>
            <div className="relative flex items-center gap-2">
              {creatingResume ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-xl">+</span>
                  Create New
                </>
              )}
            </div>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-3 border-[#DC143C]/20 border-t-[#DC143C] rounded-full animate-spin"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading Resumes...</p>
          </div>
        )}

        {/* Resumes Grid */}
        {!loading && (
          <>
            {resumes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {resumes.map((resume) => (
                  <div
                    key={resume._id}
                    className="glass rounded-[1.5rem] border border-white/5 hover:border-[#DC143C]/30 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DC143C]/20 to-transparent group-hover:via-[#DC143C]/50 transition-all"></div>

                    <div className="p-6 md:p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl group-hover:bg-[#DC143C]/10 transition-colors">📄</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md border border-white/5">
                          {new Date(resume.updatedAt || '').toLocaleDateString()}
                        </div>
                      </div>

                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 truncate group-hover:text-[#DC143C] transition-colors">
                        {resume.title || 'Untitled Resume'}
                      </h3>

                      <div className="space-y-4 mb-6">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider truncate">
                          {resume.personalInfo?.fullname || 'No Name Provided'}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Completion</span>
                          <span className="text-xs font-bold text-[#DC143C]">
                            {calculateCompletion(resume)}%
                          </span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#DC143C] to-[#8B0000] h-full rounded-full transition-all duration-700"
                            style={{ width: `${calculateCompletion(resume)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Link
                          href={`/resume/${resume._id}/personal-info`}
                          className="flex-1 bg-white text-black hover:bg-[#DC143C] hover:text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg transition-all text-center"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/resume/${resume._id}/preview`}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg border border-white/5 transition-all text-center"
                        >
                          Preview
                        </Link>
                        <button
                          onClick={() => handleDeleteResume(resume._id || '')}
                          disabled={deleting === resume._id}
                          className="w-10 h-10 flex items-center justify-center bg-red-500/5 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/10 transition-all"
                        >
                          {deleting === resume._id ? (
                            <div className="w-4 h-4 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                          ) : (
                            '🗑'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-[2rem] py-20 text-center border-dashed border-2 border-white/5">
                <div className="text-5xl mb-6 opacity-20">🗂</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Resumes Found</h3>
                <p className="text-gray-500 text-sm mb-8">Start by creating your first AI-optimized resume.</p>
                <button
                  onClick={handleCreateResume}
                  disabled={creatingResume}
                  className="px-8 py-3 bg-gradient-to-r from-[#DC143C] to-[#8B0000] text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-xl transition-all"
                >
                  Create New Resume
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to calculate resume completion percentage
function calculateCompletion(resume: IResume): number {
  let completedFields = 0;
  let totalFields = 7; // personalInfo, education, workExperience, projects, skills, certifications, summary

  if (resume.personalInfo && Object.keys(resume.personalInfo).length > 0) completedFields++;
  if (resume.education && resume.education.length > 0) completedFields++;
  if (resume.workExperience && resume.workExperience.length > 0) completedFields++;
  if (resume.projects && resume.projects.length > 0) completedFields++;
  if (resume.skills && resume.skills.length > 0) completedFields++;
  if (resume.certifications && resume.certifications.length > 0) completedFields++;
  if (resume.summary) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
}
