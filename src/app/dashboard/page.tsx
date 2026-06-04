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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Builder</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">My Resumes</h2>
          <p className="text-gray-600 text-lg">Create and manage your professional resumes</p>
        </div>

        {/* Create New Resume Button */}
        <div className="mb-12">
          <button
            onClick={handleCreateResume}
            disabled={creatingResume}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {creatingResume ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <span className="text-xl">+</span>
                Create New Resume
              </>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 text-lg">Loading your resumes...</p>
          </div>
        )}

        {/* Resumes Grid */}
        {!loading && (
          <>
            {resumes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resumes.map((resume) => (
                  <div
                    key={resume._id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-24 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_25%,rgba(255,255,255,.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.1)_75%,rgba(255,255,255,.1))] bg-[length:50px_50px]"></div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                        {resume.title || 'Untitled Resume'}
                      </h3>
                      
                      <div className="space-y-3 mb-6">
                        {resume.personalInfo?.fullname && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Name:</span> {resume.personalInfo.fullname}
                          </p>
                        )}
                        {resume.personalInfo?.email && (
                          <p className="text-sm text-gray-600 truncate">
                            <span className="font-medium text-gray-700">Email:</span> {resume.personalInfo.email}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Last updated: {new Date(resume.updatedAt || '').toLocaleDateString()}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-gray-600">Profile Completion</span>
                          <span className="text-xs font-bold text-blue-600">
                            {calculateCompletion(resume)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateCompletion(resume)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Link
                          href={`/resume/${resume._id}/personal-info`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors text-center text-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/resume/${resume._id}/preview`}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-colors text-center text-sm"
                        >
                          Preview
                        </Link>
                        <button
                          onClick={() => handleDeleteResume(resume._id || '')}
                          disabled={deleting === resume._id}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === resume._id ? (
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            '🗑️'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No resumes yet</h3>
                <p className="text-gray-600 mb-6">Create your first resume to get started</p>
                <button
                  onClick={handleCreateResume}
                  disabled={creatingResume}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                >
                  <span className="text-xl">+</span>
                  Create Your First Resume
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
