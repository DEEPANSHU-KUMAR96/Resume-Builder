'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume } from '@/types/resume.types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface IAtsScore {
  score: number;
  suggestions: string[];
  strengths: string[];
  missing: string[];
}

/**
 * PreviewPage Component
 * 
 * The culmination of the resume building process. 
 * Provides a high-fidelity visual preview, AI-powered ATS scoring,
 * and high-quality PDF export functionality.
 */
export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;
  const resumeRef = useRef<HTMLDivElement>(null);

  const [resume, setResume] = useState<IResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  // ATS AI State
  const [atsScore, setAtsScore] = useState<IAtsScore | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (resumeId) fetchResume();
  }, [resumeId]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/resume/${resumeId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setResume(response.data.data);
      } else {
        toast.error('Failed to fetch resume data');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error('Session expired or error fetching data');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleDownloadPDF
   * Uses html2canvas to capture the resume element and jsPDF to save it.
   */
  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    
    try {
      setDownloading(true);
      toast.loading('💾 Preparing your professional PDF...');
      
      const element = resumeRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${resume?.personalInfo?.fullname || 'Resume'}_AI_Builder.pdf`);
      
      toast.dismiss();
      toast.success('✅ Downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('PDF generation failed. Use browser print (Ctrl+P) as fallback.');
    } finally {
      setDownloading(false);
    }
  };

  /**
   * handleRunAtsScan
   * Extracts text representation of the resume and calls the AI ATS API.
   */
  const handleRunAtsScan = async () => {
    if (!resume) return;

    try {
      setScanning(true);
      toast.loading('🔍 AI is analyzing your resume for ATS compatibility...');

      // Construct a string representation for AI analysis
      const resumeText = `
        Full Name: ${resume.personalInfo?.fullname}
        Summary: ${resume.summary}
        Skills: ${resume.skills?.join(', ')}
        Experience: ${resume.workExperience?.map(exp => `${exp.position} at ${exp.company}`).join('; ')}
        Projects: ${resume.projects?.map(p => p.title).join('; ')}
        Education: ${resume.education?.map(e => e.degree).join('; ')}
      `;

      const response = await axios.post('/api/ai/ats-score', { resumeText }, { withCredentials: true });

      if (response.data.success) {
        setAtsScore(response.data.data.atsScore);
        toast.dismiss();
        toast.success('📈 ATS analysis complete!');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('AI scanning failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold animate-pulse">Assembling your final document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Dynamic Navbar */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/resume/${resumeId}/summary`} className="text-gray-500 hover:text-indigo-600 font-bold flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Editor
          </Link>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Draft Saved & Finalized</span>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleRunAtsScan}
              disabled={scanning}
              className="px-5 py-2 bg-purple-50 text-purple-700 font-bold rounded-xl border border-purple-100 hover:bg-purple-100 transition-all flex items-center gap-2"
            >
              {scanning ? '...' : <span>💎 Run ATS Scan</span>}
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              {downloading ? '...' : <span>📥 Download PDF</span>}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 mt-8 flex flex-col xl:flex-row gap-8 items-start">
        
        {/* Left Side: Professional Resume Document (The Preview) */}
        <div className="flex-1 w-full flex justify-center">
          <div 
            ref={resumeRef}
            className="w-full max-w-[800px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.06)] min-h-[1100px] p-[20mm] md:p-[30mm] text-gray-800"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Header */}
            <header className="border-b-2 border-indigo-600 pb-8 mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-end">
              <div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-2">
                  {resume?.personalInfo?.fullname || 'Your Name'}
                </h1>
                <div className="flex flex-wrap gap-4 text-gray-500 font-medium text-sm">
                  <span>{resume?.personalInfo?.email}</span>
                  <span>•</span>
                  <span>{resume?.personalInfo?.mobile}</span>
                  {resume?.personalInfo?.location && (
                    <><span>•</span><span>{resume?.personalInfo?.location}</span></>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                {resume?.personalInfo?.linkedin && (
                    <span className="text-[10px] font-bold px-3 py-1 bg-gray-100 rounded text-gray-500">LinkedIn</span>
                )}
                {resume?.personalInfo?.github && (
                    <span className="text-[10px] font-bold px-3 py-1 bg-gray-100 rounded text-gray-500">GitHub</span>
                )}
              </div>
            </header>

            {/* Summary */}
            {resume?.summary && (
              <section className="mb-10">
                <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Professional Summary</h2>
                <p className="text-gray-700 leading-relaxed font-medium">
                  {resume.summary}
                </p>
              </section>
            )}

            {/* Experience */}
            {resume?.workExperience && resume.workExperience.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Work Experience</h2>
                <div className="space-y-8">
                  {resume.workExperience.map((exp, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-gray-900 text-lg">{exp.position}</h3>
                        <span className="text-sm font-bold text-gray-400">{exp.startDate} - {exp.endDate}</span>
                      </div>
                      <div className="font-bold text-indigo-500 mb-2">{exp.company}</div>
                      <p className="text-gray-600 text-sm leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {resume?.projects && resume.projects.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Key Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resume.projects.map((proj, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <h3 className="font-black text-gray-900 mb-1">{proj.title}</h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {proj.techStack?.map((t, idx) => (
                            <span key={idx} className="text-[9px] font-bold px-2 py-0.5 bg-white text-gray-500 border rounded">
                                {t}
                            </span>
                        ))}
                      </div>
                      <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-3">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {resume?.skills && resume.skills.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Expertise & Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, i) => (
                    <span key={i} className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg tracking-wide">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {resume?.education && resume.education.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Education</h2>
                <div className="space-y-4">
                  {resume.education.map((edu, i) => (
                    <div key={i} className="flex justify-between">
                      <div>
                        <div className="font-bold text-gray-900">{edu.degree}</div>
                        <div className="text-sm text-gray-500 font-medium">{edu.institution}</div>
                      </div>
                      <div className="text-sm font-bold text-gray-400">{edu.startDate} - {edu.endDate}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Right Side: AI Analytics Sidebar */}
        <aside className="w-full xl:w-96 flex flex-col gap-6">
          
          {/* ATS Score Card */}
          {atsScore ? (
            <div className="bg-white rounded-[2rem] p-8 shadow-xl border-t-8 border-purple-500 overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-xl font-black text-gray-900 mb-6">ATS Analysis</h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full border-[6px] border-purple-100 flex items-center justify-center relative">
                    <span className="text-3xl font-black text-purple-600">{atsScore.score}</span>
                    <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                        <circle 
                            cx="48" cy="48" r="42" 
                            fill="none" stroke="currentColor" strokeWidth="6" 
                            className="text-purple-600" 
                            strokeDasharray={264}
                            strokeDashoffset={264 - (264 * atsScore.score) / 100}
                        />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Optimization Score</h4>
                    <p className="text-sm text-gray-500 font-medium">Out of 100 points</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-2">Strengths</h5>
                    <ul className="space-y-2">
                      {atsScore.strengths.map((str, i) => (
                        <li key={i} className="text-xs font-bold text-gray-600 flex items-start gap-2">
                          <span className="text-green-500">✓</span> {str}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-2">Areas for Improvement</h5>
                    <ul className="space-y-2">
                      {atsScore.suggestions.map((sug, i) => (
                        <li key={i} className="text-xs font-bold text-gray-600 flex items-start gap-2">
                          <span className="text-yellow-500">!</span> {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white shadow-xl text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">⚡</div>
              <h3 className="text-xl font-black mb-3">AI Resume Scan</h3>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-8">
                Run our AI analysis to see how well your resume matches standard Applicant Tracking Systems.
              </p>
              <button 
                onClick={handleRunAtsScan}
                disabled={scanning}
                className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
              >
                {scanning ? 'Analyzing...' : 'Scan Now'}
              </button>
            </div>
          )}

          {/* Tips Card */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <h4 className="font-black text-gray-900 mb-4 tracking-tight">Final Checks</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-gray-500 font-medium">
                <span className="text-indigo-500 font-bold">1.</span>
                Double check dates for all experiences.
              </li>
              <li className="flex gap-3 text-sm text-gray-500 font-medium">
                <span className="text-indigo-500 font-bold">2.</span>
                Ensure links to GitHub and Portfolio are working.
              </li>
              <li className="flex gap-3 text-sm text-gray-500 font-medium">
                <span className="text-indigo-500 font-bold">3.</span>
                Verify email and phone number are correct.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
