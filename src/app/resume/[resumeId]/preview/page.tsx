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
   * Supports multi-page resumes by slicing the canvas across A4 pages.
   */
  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;

    try {
      setDownloading(true);
      toast.loading('Preparing your PDF...', { id: 'pdf-download' });

      const element = resumeRef.current;
      const linkMetadata: { url: string; x: number; y: number; w: number; h: number }[] = [];

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // 1. Fix modern colors
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            if (style.color && (style.color.includes('lab') || style.color.includes('oklch') || style.color.includes('oklab'))) {
              el.style.color = 'inherit';
            }
            if (style.backgroundColor && (style.backgroundColor.includes('lab') || style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab'))) {
              el.style.backgroundColor = 'transparent';
            }
            if (style.borderColor && (style.borderColor.includes('lab') || style.borderColor.includes('oklch') || style.borderColor.includes('oklab'))) {
              el.style.borderColor = 'transparent';
            }
          }

          // 2. Track link positions
          const container = clonedDoc.getElementById('resume-pdf-content');
          if (!container) return;
          const containerRect = container.getBoundingClientRect();
          const scaleFactor = 210 / containerRect.width;

          const links = clonedDoc.querySelectorAll('a');
          links.forEach(a => {
            const rect = a.getBoundingClientRect();
            linkMetadata.push({
              url: a.href,
              x: (rect.left - containerRect.left) * scaleFactor,
              y: (rect.top - containerRect.top) * scaleFactor,
              w: rect.width * scaleFactor,
              h: rect.height * scaleFactor
            });
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      let currentPage = 1;

      // Helper to add links for a specific page
      const addLinksToPage = (pageNum: number) => {
        const pageTop = (pageNum - 1) * pdfHeight;
        const pageBottom = pageNum * pdfHeight;

        linkMetadata.forEach(link => {
          if (link.y >= pageTop && link.y < pageBottom) {
            // Adjust Y coordinate relative to the current page top
            pdf.link(link.x, link.y - pageTop, link.w, link.h, { url: link.url });
          }
        });
      };

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      addLinksToPage(1);
      heightLeft -= pdfHeight;

      // Add additional pages
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        currentPage++;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        addLinksToPage(currentPage);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${resume?.personalInfo?.fullname || 'Resume'}.pdf`);

      toast.dismiss('pdf-download');
      toast.success('PDF Downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss('pdf-download');
      toast.error('PDF generation failed.');
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
      toast.loading('AI is analyzing your resume...', { id: 'ats-scan' });

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
        toast.dismiss('ats-scan');
        toast.success('ATS analysis complete!');
      }
    } catch (error) {
      toast.dismiss('ats-scan');
      toast.error('AI scanning failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DC143C]/20 border-t-[#DC143C] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold animate-pulse text-sm">Assembling your document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 relative overflow-x-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#DC143C]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[30%] h-[50%] bg-[#DC143C]/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-3">
          <Link href={`/resume/${resumeId}/summary`} className="flex items-center gap-2 text-gray-500 hover:text-white transition-all font-bold group shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#DC143C]/20 transition-all">
              <span className="text-lg group-hover:-translate-x-0.5 transition-transform">←</span>
            </div>
            <span className="uppercase tracking-[0.15em] text-[9px] md:text-[10px] hidden sm:inline">Back to Editor</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 bg-[#DC143C] rounded-full animate-pulse shadow-[0_0_8px_#DC143C]"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resume Ready</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRunAtsScan}
                disabled={scanning}
                className="px-3 md:px-5 h-10 md:h-11 glass text-white font-bold rounded-xl border border-white/5 hover:border-[#DC143C]/50 transition-all flex items-center gap-2 text-[9px] md:text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                {scanning ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <span className="text-[#DC143C]">Scan</span>}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="px-4 md:px-6 h-10 md:h-11 bg-gradient-to-r from-[#DC143C] to-[#8B0000] text-white font-extrabold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-[#DC143C]/20 disabled:opacity-50"
              >
                {downloading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <span>Export PDF</span>}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 md:mt-12 flex flex-col xl:flex-row gap-8 md:gap-12 items-start relative z-10">

        {/* Document Surface */}
        <div className="flex-1 w-full flex justify-center overflow-x-auto pb-10">
          <div
            ref={resumeRef}
            id="resume-pdf-content"
            className="w-full max-w-[210mm] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.5)] p-6 sm:p-10 md:p-[20mm] text-black shrink-0 relative"
            style={{
              fontFamily: "'Inter', 'Helvetica', 'Arial', sans-serif",
              color: '#1a1a1a',
              lineHeight: '1.5'
            }}
          >
            {/* Professional Header */}
            <header className="text-center mb-10 pb-8" style={{ borderBottom: '2px solid #1a1a1a' }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                marginBottom: '8px',
                lineHeight: '1'
              }}>
                {resume?.personalInfo?.fullname || 'Your Name'}
              </h1>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#4a4a4a',
                letterSpacing: '0.05em'
              }}>
                {resume?.personalInfo?.email && <a href={`mailto:${resume.personalInfo.email}`} style={{ color: '#4a4a4a', textDecoration: 'none', cursor: 'pointer', zIndex: 10 }}>{resume.personalInfo.email}</a>}
                {resume?.personalInfo?.mobile && <span>| {resume.personalInfo.mobile}</span>}
                {resume?.personalInfo?.location && <span>| {resume.personalInfo.location}</span>}
              </div>
              {(resume?.personalInfo?.linkedin || resume?.personalInfo?.github) && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#1a1a1a',
                  textTransform: 'uppercase'
                }}>
                  {resume?.personalInfo?.linkedin && (
                    <a href={resume.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a', textDecoration: 'underline', cursor: 'pointer', zIndex: 10 }}>LinkedIn</a>
                  )}
                  {resume?.personalInfo?.github && (
                    <a href={resume.personalInfo.github} target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a', textDecoration: 'underline', cursor: 'pointer', zIndex: 10 }}>GitHub</a>
                  )}
                </div>
              )}
            </header>

            {/* Content Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Summary */}
              {resume?.summary && (
                <section>
                  <h2 style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#000000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderBottom: '1px solid #1a1a1a',
                    paddingBottom: '4px',
                    marginBottom: '12px'
                  }}>
                    Professional Summary
                  </h2>
                  <p style={{ fontSize: '13px', color: '#1a1a1a', textAlign: 'justify' }}>
                    {resume.summary}
                  </p>
                </section>
              )}

              {/* Experience */}
              {resume?.workExperience && resume.workExperience.length > 0 && (
                <section>
                  <h2 style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#000000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderBottom: '1px solid #1a1a1a',
                    paddingBottom: '4px',
                    marginBottom: '16px'
                  }}>
                    Professional Experience
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {resume.workExperience.map((exp, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'baseline', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#000000', flex: 1 }}>{exp.position}</h3>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a4a', textTransform: 'uppercase' }}>
                            {exp.startDate} — {exp.endDate}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', fontStyle: 'italic', marginBottom: '8px' }}>
                          {exp.company}
                        </div>
                        <p style={{ fontSize: '12px', color: '#333333', whiteSpace: 'pre-wrap' }}>
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Skills Section - Single Column Comma Separated */}
              {resume?.skills && resume.skills.length > 0 && (
                <section>
                  <h2 style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#000000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderBottom: '1px solid #1a1a1a',
                    paddingBottom: '4px',
                    marginBottom: '12px'
                  }}>
                    Technical Skills
                  </h2>
                  <p style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '500' }}>
                    {resume.skills.join(' • ')}
                  </p>
                </section>
              )}

              {/* Projects */}
              {resume?.projects && resume.projects.length > 0 && (
                <section>
                  <h2 style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#000000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderBottom: '1px solid #1a1a1a',
                    paddingBottom: '4px',
                    marginBottom: '16px'
                  }}>
                    Key Projects
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {resume.projects.map((proj, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'baseline', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#000000', flex: 1 }}>{proj.title}</h3>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                            {proj.githubUrl && (
                              <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a', textDecoration: 'underline', cursor: 'pointer', zIndex: 10 }}>GitHub</a>
                            )}
                            {proj.liveUrl && (
                              <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a', textDecoration: 'underline', cursor: 'pointer', zIndex: 10 }}>Live Demo</a>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a4a', marginBottom: '6px' }}>
                          {proj.techStack?.join(', ')}
                        </div>
                        <p style={{ fontSize: '12px', color: '#333333', textAlign: 'justify' }}>{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Education */}
              {resume?.education && resume.education.length > 0 && (
                <section>
                  <h2 style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#000000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderBottom: '1px solid #1a1a1a',
                    paddingBottom: '4px',
                    marginBottom: '16px'
                  }}>
                    Education
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {resume.education.map((edu, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#000000' }}>{edu.degree}</div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#4a4a4a' }}>{edu.institution}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#4a4a4a' }}>{edu.startDate} — {edu.endDate}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Achievements & Certifications */}
              {resume?.certifications && resume.certifications.length > 0 && (
                <section>
                  <h2 style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#000000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderBottom: '1px solid #1a1a1a',
                    paddingBottom: '4px',
                    marginBottom: '12px'
                  }}>
                    Achievements & Certifications
                  </h2>
                  <ul style={{ paddingLeft: '18px', margin: '0' }}>
                    {resume.certifications.map((cert, i) => (
                      <li key={i} style={{ fontSize: '13px', color: '#1a1a1a', marginBottom: '4px' }}>
                        {cert}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full xl:w-96 flex flex-col gap-6 md:gap-8">

          {/* ATS Score Card */}
          {atsScore ? (
            <div className="glass rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#DC143C]"></div>

              <div className="relative z-10">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8 md:mb-10">ATS Analysis</h3>

                <div className="flex items-center gap-6 md:gap-8 mb-8 md:mb-10">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white/5 flex items-center justify-center relative group-hover:border-[#DC143C]/30 transition-all duration-700">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl md:text-4xl font-extrabold text-white leading-none">{atsScore.score}</span>
                      <span className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase mt-1">Grade</span>
                    </div>
                    <svg className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] rotate-[-90deg]">
                      <circle
                        cx="58" cy="58" r="54"
                        fill="none" stroke="#DC143C" strokeWidth="4"
                        className="transition-all duration-1000 ease-out"
                        strokeDasharray={340}
                        strokeDashoffset={340 - (340 * atsScore.score) / 100}
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-1">ATS Score</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Standard ATS Optimization</p>
                  </div>
                </div>

                <div className="space-y-6 md:space-y-8">
                  <div className="bg-white/[0.02] p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/[0.02] hover:bg-white/5 transition-all">
                    <h5 className="text-[9px] font-black uppercase text-[#DC143C] tracking-[0.2em] mb-3 md:mb-4">Core Strengths</h5>
                    <ul className="space-y-2 md:space-y-3">
                      {atsScore.strengths.map((str, i) => (
                        <li key={i} className="text-[10px] md:text-[11px] font-bold text-gray-400 flex items-start gap-2 md:gap-3">
                          <span className="text-[#DC143C] mt-0.5">•</span> {str}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white/[0.02] p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/[0.02] hover:bg-white/5 transition-all">
                    <h5 className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-3 md:mb-4">Improvement Suggestions</h5>
                    <ul className="space-y-2 md:space-y-3">
                      {atsScore.suggestions.map((sug, i) => (
                        <li key={i} className="text-[10px] md:text-[11px] font-bold text-gray-500 flex items-start gap-2 md:gap-3 italic">
                          <span className="text-yellow-900 mt-0.5">!</span> {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-red rounded-2xl md:rounded-[2rem] p-8 md:p-10 text-white shadow-2xl text-center relative overflow-hidden group bg-gradient-to-br from-[#DC143C]/10 to-[#8B0000]/5 border border-[#DC143C]/20">
              <div className="relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white shadow-2xl rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 transform group-hover:rotate-12 transition-transform duration-500">
                  <span className="text-2xl md:text-3xl">🛡️</span>
                </div>
                <h3 className="text-lg md:text-xl font-extrabold mb-3 md:mb-4 uppercase tracking-tighter">ATS Scan</h3>
                <p className="text-white/60 text-[10px] md:text-xs font-bold leading-relaxed mb-8 md:mb-10 uppercase tracking-widest">
                  Evaluate your profile against industry ATS standards.
                </p>
                <button
                  onClick={handleRunAtsScan}
                  disabled={scanning}
                  className="w-full h-12 md:h-14 bg-white text-black font-black rounded-xl md:rounded-2xl hover:bg-[#F5F0E8] transition-all active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]"
                >
                  {scanning ? 'Analyzing...' : 'Start AI Analysis'}
                </button>
              </div>
            </div>
          )}

          {/* Final Checklist */}
          <div className="glass rounded-2xl md:rounded-[2rem] p-6 md:p-8 shadow-sm border border-white/5">
            <h4 className="text-[10px] font-black text-white mb-6 md:mb-8 uppercase tracking-[0.3em]">Final Checklist</h4>
            <ul className="space-y-4 md:space-y-6">
              {[
                'Verify all dates and chronological order',
                'Test all links (GitHub, LinkedIn, Website)',
                'Double-check contact information',
                'Ensure summary matches target role'
              ].map((tip, idx) => (
                <li key={idx} className="flex gap-3 md:gap-4 items-start group">
                  <span className="text-[#DC143C] font-black text-xs leading-none mt-1">{idx + 1}.</span>
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold group-hover:text-gray-300 transition-colors uppercase tracking-widest leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
