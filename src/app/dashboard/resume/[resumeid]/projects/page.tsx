'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { IProject, IResume } from '@/types/resume.types';

export default function ProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const resumeid = params.resumeid as string;

  const [resume, setResume] = useState<IResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  // Fetch resume data
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
        setProjects(response.data.data.projects || []);
      } else {
        toast.error('Failed to fetch resume');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Error loading resume');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for specific project
  const handleProjectChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedProjects = [...projects];
    updatedProjects[index] = {
      ...updatedProjects[index],
      [name]: value
    };
    setProjects(updatedProjects);
  };

  // Add new project
  const addProject = () => {
    setProjects([...projects, {
      title: '',
      description: '',
      techStack: [],
      githubUrl: '',
      liveUrl: '',
      // @ts-ignore - adding missing fields requested by user
      startDate: '',
      endDate: ''
    }]);
  };

  // Remove project
  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
    toast.success('Project removed from list');
  };

  // Handle tech stack tags
  const handleTechStackChange = (index: number, value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    const updatedProjects = [...projects];
    updatedProjects[index] = {
      ...updatedProjects[index],
      techStack: tags
    };
    setProjects(updatedProjects);
  };

  // AI Generation
  const handleGenerateDescription = async (index: number) => {
    const project = projects[index];
    if (!project.title) {
      toast.error('Please enter project name first');
      return;
    }

    try {
      setGeneratingIndex(index);
      toast.loading('🤖 AI is generating project description...', { id: 'ai-gen' });

      const response = await axios.post('/api/ai/generate-project-description', {
        jobTitle: project.title,
        techStack: project.techStack.join(', '),
        experienceLevel: 'mid-level'
      });

      if (response.data.success) {
        const updatedProjects = [...projects];
        updatedProjects[index].description = response.data.data.description;
        setProjects(updatedProjects);
        toast.success('✨ AI generated description!', { id: 'ai-gen' });
      } else {
        toast.error('AI generation failed', { id: 'ai-gen' });
      }
    } catch (error) {
      toast.error('Error generating AI content', { id: 'ai-gen' });
    } finally {
      setGeneratingIndex(null);
    }
  };

  // Save to DB
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.patch(
        `/api/resume/${resumeid}`,
        { projects },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Projects saved successfully!');
      } else {
        toast.error('Failed to save projects');
      }
    } catch (error) {
      toast.error('Error saving data');
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-[#0A0A0A] text-white relative flex flex-col">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#DC143C]/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between font-bold">
          <Link href="/dashboard" className="text-gray-400 hover:text-white uppercase tracking-widest text-[10px]">
            ← Dashboard
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Step 4: Portfolio Projects</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16 w-full z-10 flex-1">
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight">Key Projects</h1>
          <p className="text-gray-500 font-medium">Highlight your best engineering work and technical depth.</p>
        </header>

        <div className="space-y-8">
          {projects.map((project, index) => (
            <div key={index} className="glass rounded-[2rem] p-6 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#DC143C]/20 group-hover:bg-[#DC143C] transition-all"></div>
              
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-lg font-bold uppercase tracking-widest text-white/80">Project #{index + 1}</h3>
                <button 
                  onClick={() => removeProject(index)}
                  className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black rounded-lg border border-red-500/20 uppercase tracking-widest transition-all"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Project Name */}
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Project Name *</label>
                  <input
                    type="text"
                    name="title"
                    value={project.title}
                    onChange={(e) => handleProjectChange(index, e)}
                    placeholder="e.g. AI-Powered Analytics Suite"
                    className="w-full bg-[#1A1A1A] border-2 border-white/5 focus:border-[#DC143C]/50 rounded-xl px-5 py-3 outline-none transition-all placeholder:text-gray-800 font-medium"
                  />
                </div>

                {/* Tech Stack */}
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Tech Stack (comma separated) *</label>
                  <input
                    type="text"
                    value={project.techStack.join(', ')}
                    onChange={(e) => handleTechStackChange(index, e.target.value)}
                    placeholder="Next.js, TypeScript, Tailwind, MongoDB"
                    className="w-full bg-[#1A1A1A] border-2 border-white/5 focus:border-[#DC143C]/50 rounded-xl px-5 py-3 outline-none transition-all placeholder:text-gray-800 font-medium"
                  />
                </div>

                {/* Dates */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Start Date</label>
                  <input
                    type="month"
                    name="startDate"
                    // @ts-ignore
                    value={project.startDate || ''}
                    onChange={(e) => handleProjectChange(index, e)}
                    className="w-full bg-[#1A1A1A] border-2 border-white/5 focus:border-[#DC143C]/50 rounded-xl px-5 py-3 outline-none transition-all text-gray-400"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">End Date</label>
                  <input
                    type="month"
                    name="endDate"
                    // @ts-ignore
                    value={project.endDate || ''}
                    onChange={(e) => handleProjectChange(index, e)}
                    className="w-full bg-[#1A1A1A] border-2 border-white/5 focus:border-[#DC143C]/50 rounded-xl px-5 py-3 outline-none transition-all text-gray-400"
                  />
                </div>

                {/* URLs */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">GitHub URL</label>
                  <input
                    type="url"
                    name="githubUrl"
                    value={project.githubUrl}
                    onChange={(e) => handleProjectChange(index, e)}
                    placeholder="https://github.com/..."
                    className="w-full bg-[#1A1A1A] border-2 border-white/5 focus:border-[#DC143C]/50 rounded-xl px-5 py-3 outline-none transition-all placeholder:text-gray-800 font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Project Live URL</label>
                  <input
                    type="url"
                    name="liveUrl"
                    value={project.liveUrl}
                    onChange={(e) => handleProjectChange(index, e)}
                    placeholder="https://myproject.com"
                    className="w-full bg-[#1A1A1A] border-2 border-white/5 focus:border-[#DC143C]/50 rounded-xl px-5 py-3 outline-none transition-all placeholder:text-gray-800 font-medium"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Project Description *</label>
                    <button 
                      type="button"
                      onClick={() => handleGenerateDescription(index)}
                      disabled={generatingIndex === index}
                      className="text-[9px] md:text-[10px] px-3 py-1.5 bg-[#DC143C]/10 hover:bg-[#DC143C]/20 text-[#DC143C] font-bold rounded-lg border border-[#DC143C]/20 transition-all uppercase tracking-widest disabled:opacity-50 self-start sm:self-auto"
                    >
                      {generatingIndex === index ? '⏳ Analyzing...' : '✨ Generate with AI'}
                    </button>
                  </div>
                  <textarea
                    name="description"
                    value={project.description}
                    onChange={(e) => handleProjectChange(index, e)}
                    rows={4}
                    placeholder="Describe your architectural decisions and technical challenges solved..."
                    className="w-full bg-[#1A1A1A] border-2 border-white/5 focus:border-[#DC143C]/20 rounded-2xl px-5 py-4 outline-none transition-all placeholder:text-gray-800 font-medium resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addProject}
            className="w-full h-16 rounded-[2rem] border-2 border-dashed border-white/5 hover:border-[#DC143C]/30 hover:bg-[#DC143C]/5 transition-all text-gray-500 hover:text-white font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Add More Projects
          </button>
        </div>

        {/* Footer Actions */}
        <div className="mt-16 pt-10 border-t border-white/5 flex flex-col sm:flex-row gap-4">
          <Link
            href={`/resume/${resumeid}/skills`}
            className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            ← Previous: Skills
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-[#DC143C] to-[#8B0000] flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#DC143C]/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Projects & Next'}
          </button>
          <Link
            href={`/resume/${resumeid}/preview`}
            className="flex-1 h-14 rounded-2xl bg-white text-black flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-[#F5F0E8] transition-all"
          >
            Preview →
          </Link>
        </div>
      </main>
    </div>
  );
}
