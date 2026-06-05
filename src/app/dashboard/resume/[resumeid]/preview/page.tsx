'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IResume } from '@/types/resume.types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ResumePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const resumeid = params.resumeid as string;
  const resumeRef = useRef<HTMLDivElement>(null);

  const [resume, setResume] = useState<IResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (resumeid) {
      fetchResume();
    }
  }, [resumeid]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/resume/${resumeid}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setResume(response.data.data);
      } else {
        toast.error('Failed to fetch resume');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Session expired or error fetching data');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    try {
      setDownloading(true);
      toast.loading('Preparing PDF...', { id: 'pdf-gen' });
      const element = resumeRef.current;
      const linkMetadata: { url: string; x: number; y: number; w: number; h: number }[] = [];

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
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
            pdf.link(link.x, link.y - pageTop, link.w, link.h, { url: link.url });
          }
        });
      };

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      addLinksToPage(1);
      heightLeft -= pdfHeight;

      // Additional pages
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        currentPage++;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        addLinksToPage(currentPage);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${resume?.personalInfo?.fullname || 'Resume'}.pdf`);
      toast.success('PDF Downloaded!', { id: 'pdf-gen' });
    } catch (error) {
      console.error('PDF error:', error);
      toast.error('Download failed. Try again.', { id: 'pdf-gen' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="w-12 h-12 border-4 border-[#DC143C]/20 border-t-[#DC143C] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header / Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-400 hover:text-white font-bold uppercase tracking-widest text-[10px]">
            ← Back to Dashboard
          </Link>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-8 h-12 bg-gradient-to-r from-[#DC143C] to-[#8B0000] text-white font-black rounded-xl shadow-xl shadow-[#DC143C]/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
          >
            {downloading ? 'Processing...' : 'Download PDF'}
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* PDF Wrapper - This is white for actual resume look */}
        <div className="flex justify-center mb-20 overflow-x-auto">
          <div
            ref={resumeRef}
            id="resume-pdf-content"
            className="w-[210mm] min-h-[297mm] bg-white p-[20mm] text-black shadow-2xl shrink-0"
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
                {resume?.personalInfo?.fullname}
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
      </div>
    </div>
  );
}
