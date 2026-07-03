import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Globe, 
  Calendar, 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Eye, 
  PenTool, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { Post, GhostConfig } from '../types';
import AIAssistant from './AIAssistant';

interface EditorViewProps {
  post: Post;
  ghostConfig: GhostConfig;
  onSave: (updatedPost: Partial<Post>) => Promise<Post>;
  onPublishNow: (postId: string) => Promise<void>;
  onDelete: (postId: string) => void;
  onClose: () => void;
}

export default function EditorView({
  post,
  ghostConfig,
  onSave,
  onPublishNow,
  onDelete,
  onClose
}: EditorViewProps) {
  const [title, setTitle] = useState(post.title);
  const [html, setHtml] = useState(post.html);
  const [featured, setFeatured] = useState(post.featured);
  const [type, setType] = useState(post.type);
  const [customExcerpt, setCustomExcerpt] = useState(post.custom_excerpt || '');
  const [tagsInput, setTagsInput] = useState(post.tags.join(', '));
  const [featureImage, setFeatureImage] = useState(post.feature_image || '');
  const [status, setStatus] = useState(post.status);
  
  // Date-time for scheduling
  const [scheduleDate, setScheduleDate] = useState(() => {
    if (post.scheduled_at) {
      const d = new Date(post.scheduled_at);
      // Format as YYYY-MM-DDTHH:MM
      return d.toISOString().slice(0, 16);
    }
    // Default to tomorrow
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    tom.setHours(12, 0, 0, 0);
    return tom.toISOString().slice(0, 16);
  });

  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse tags string into array
  const getTagsArray = () => {
    return tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  };

  const handleSavePost = async (newStatus?: Post['status']) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const targetStatus = newStatus !== undefined ? newStatus : status;

    const updatedData: Partial<Post> = {
      title,
      html,
      featured,
      type,
      custom_excerpt: customExcerpt,
      tags: getTagsArray(),
      feature_image: featureImage,
      status: targetStatus,
      scheduled_at: targetStatus === 'scheduled' ? new Date(scheduleDate).toISOString() : undefined
    };

    try {
      const saved = await onSave(updatedData);
      setStatus(saved.status);
      setSuccess('Article draft saved successfully on disk.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save post.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishNow = async () => {
    if (!window.confirm(`Are you sure you want to publish "${title}" instantly to Ghost CMS?`)) return;
    
    setPublishing(true);
    setError(null);
    setSuccess(null);

    try {
      // Save current changes first
      await handleSavePost();
      // Publish
      await onPublishNow(post.id);
      setStatus('published');
      setSuccess('Successfully published to Ghost CMS!');
    } catch (err: any) {
      setError(err.message || 'Error occurred during publishing.');
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!scheduleDate) {
      setError('Please provide a valid publication time.');
      return;
    }
    const scheduleTime = new Date(scheduleDate);
    if (scheduleTime <= new Date()) {
      setError('Schedule publication time must be in the future.');
      return;
    }

    await handleSavePost('scheduled');
    setSuccess(`Article queued! Will be published on ${scheduleTime.toLocaleString()}`);
  };

  const handleCancelSchedule = async () => {
    await handleSavePost('draft');
    setSuccess('Scheduled publication cancelled. Post returned to Draft status.');
  };

  // Image upload handler
  const processImageUpload = async (file: File) => {
    setSaving(true);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: base64String, filename: file.name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        setFeatureImage(data.url);
        setSuccess('Feature image uploaded and bound successfully!');
        setTimeout(() => setSuccess(null), 3500);
      } catch (err: any) {
        setError(err.message || 'Failed to complete image upload.');
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageUpload(file);
  };

  // AI Apply handlers
  const handleApplyDraft = (generatedHtml: string) => {
    setHtml(generatedHtml);
    setActiveTab('write');
  };

  const handleApplySEO = (seoTitle: string, seoExcerpt: string, seoTags: string[]) => {
    setTitle(seoTitle);
    setCustomExcerpt(seoExcerpt);
    setTagsInput(seoTags.join(', '));
  };

  return (
    <div className="flex h-[calc(100vh-140px)] relative border border-[#333333] rounded-none overflow-hidden bg-[#111113] text-[#EAEAEA]">
      {/* Editor Main body */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Editor Controls Bar */}
        <div className="bg-[#1A1A1C] border-b border-[#333333] px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#111113] text-white hover:text-[#00FF9D] rounded-none transition-colors cursor-pointer border border-transparent hover:border-[#333333]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#8A8782] font-mono font-bold uppercase tracking-wider">Status:</span>
                <span className={`px-2 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase border tracking-wider ${
                  status === 'published' ? 'bg-[#00FF9D]/10 border-[#00FF9D]/20 text-[#00FF9D]' :
                  status === 'scheduled' ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-400' :
                  status === 'failed' ? 'bg-red-950/40 border-red-500/20 text-[#FF5F57]' :
                  'bg-[#111113] border-[#333333] text-[#8A8782]'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Save Draft */}
            <button
              onClick={() => handleSavePost()}
              disabled={saving}
              className="px-4 py-2 bg-transparent hover:bg-[#111113] text-[#EAEAEA] border border-[#444444] hover:border-[#00FF9D] hover:text-[#00FF9D] rounded-none text-xs font-mono font-bold uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Draft</span>
            </button>

            {/* AI Assist toggle */}
            <button
              onClick={() => setShowAiSidebar(!showAiSidebar)}
              className={`px-4 py-2 rounded-none text-xs font-mono font-bold uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer transition-all border ${
                showAiSidebar 
                  ? 'bg-[#00FF9D] text-[#111113] border-[#00FF9D]' 
                  : 'bg-transparent hover:bg-[#111113] border-[#444444] text-[#00FF9D]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            {/* Danger: Delete */}
            <button
              onClick={() => {
                if (window.confirm('Are you absolutely sure you want to delete this post? This cannot be undone.')) {
                  onDelete(post.id);
                }
              }}
              className="p-2 bg-transparent hover:bg-[#FF5F57]/10 border border-[#444444] hover:border-[#FF5F57] text-[#8A8782] hover:text-[#FF5F57] rounded-none cursor-pointer transition-colors"
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message center */}
        {error && (
          <div className="bg-[#FF5F57]/10 border-b border-[#FF5F57]/20 px-4 py-2.5 flex items-start space-x-2 text-xs text-white font-mono uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#FF5F57]" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-[#00FF9D]/10 border-b border-[#00FF9D]/20 px-4 py-2.5 flex items-start space-x-2 text-xs text-white font-mono uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#00FF9D]" />
            <span>{success}</span>
          </div>
        )}

        {/* Editor Split Panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Workspace (Left Column) */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-5">
            {/* Title & Excerpt Panel */}
            <div className="space-y-4 bg-[#1A1A1C] p-6 border border-[#333333] rounded-none">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ENTER ARTICLE TITLE..."
                className="w-full bg-transparent font-syne font-extrabold text-2xl text-white placeholder-[#5A5A5C] focus:outline-none border-b border-[#333333] pb-2.5 focus:border-[#00FF9D] uppercase tracking-tighter"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div className="space-y-1.5">
                  <label className="text-[#8A8782] font-mono font-bold block uppercase tracking-widest text-[9px]">Document Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#111113] border border-[#333333] rounded-none px-3 py-2 text-xs text-white focus:outline-none font-mono font-bold uppercase tracking-widest cursor-pointer"
                  >
                    <option value="post">Blog Post</option>
                    <option value="page">Static Page</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#8A8782] font-mono font-bold block uppercase tracking-widest text-[9px]">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="SEO, TECH, GHOST, GUIDE"
                    className="w-full bg-[#111113] border border-[#333333] rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00FF9D] font-mono shadow-inner uppercase tracking-widest"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] text-[#8A8782] font-mono font-bold block uppercase tracking-widest">Custom Excerpt / SEO Metadata Summary</label>
                <textarea
                  value={customExcerpt}
                  onChange={(e) => setCustomExcerpt(e.target.value)}
                  placeholder="PROVIDE A HIGH-CONVERTING EDITORIAL EXCERPT SUMMARIZING YOUR ARTICLE FOR SEARCH ENGINES & ARCHIVE LISTINGS..."
                  className="w-full h-16 bg-[#111113] border border-[#333333] rounded-none p-3 text-xs text-white focus:outline-none focus:border-[#00FF9D] resize-none leading-relaxed shadow-inner font-mono uppercase tracking-wide"
                />
              </div>
            </div>

            {/* Writer Canvas */}
            <div className="flex-1 flex flex-col bg-[#1A1A1C] border border-[#333333] rounded-none overflow-hidden min-h-[350px]">
              {/* Writer Header Tabs */}
              <div className="bg-[#111113] border-b border-[#333333] px-3 py-1 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveTab('write')}
                    className={`px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer transition-all border-b-2 ${
                      activeTab === 'write' ? 'border-[#00FF9D] text-white' : 'border-transparent text-[#8A8782] hover:text-white'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Write HTML Content</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer transition-all border-b-2 ${
                      activeTab === 'preview' ? 'border-[#00FF9D] text-white' : 'border-transparent text-[#8A8782] hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Render Preview</span>
                  </button>
                </div>
                <div className="text-[10px] text-[#8A8782] font-mono pr-2 uppercase tracking-wide select-none">
                  {html.length} characters
                </div>
              </div>

              {/* Writer Tabs Content */}
              <div className="flex-1 overflow-hidden h-full">
                {activeTab === 'write' ? (
                  <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    placeholder="WRITE OR PASTE YOUR ARTICLE HTML OR PLAIN TEXT HERE. USE THE AI ASSISTANT PANEL TO INSTANTLY DRAFT, STRUCTURE, AND OPTIMIZE..."
                    className="w-full h-full bg-[#1A1A1C] p-5 text-xs font-mono text-[#EAEAEA] placeholder-[#5A5A5C] focus:outline-none resize-none leading-relaxed overflow-y-auto focus:ring-0 shadow-inner"
                  />
                ) : (
                  <div className="w-full h-full p-8 overflow-y-auto max-w-none text-[#EAEAEA] select-text bg-[#111113]">
                    {/* Render live content simulation inside a styled frame */}
                    {featureImage && (
                      <img 
                        src={featureImage} 
                        alt="Post header asset" 
                        className="w-full max-h-72 object-cover rounded-none mb-6 border border-[#333333]"
                        onError={(e) => {
                          // Fallback
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    )}
                    <h1 className="font-syne font-extrabold text-3xl mb-3 text-white tracking-tight uppercase">{title || "Untitled Article"}</h1>
                    <div className="flex items-center space-x-2 text-xs text-[#8A8782] font-mono mb-6 border-b border-[#333333] pb-3 uppercase">
                      <span>By Editorial Dispatcher</span>
                      <span>•</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div 
                      className="text-sm space-y-4 leading-relaxed font-sans text-[#EAEAEA] max-w-2xl"
                      dangerouslySetInnerHTML={{ __html: html || "<p class='italic text-[#8A8782] font-mono uppercase tracking-wider'>Write content inside the canvas editor tab to see rendered live preview modules here.</p>" }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Config / Actions (Right Column) */}
          <div className="w-72 overflow-y-auto p-5 space-y-5 shrink-0 bg-[#1A1A1C] border-l border-[#333333]">
            {/* Feature Image drag-and-drop */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-[#8A8782] uppercase tracking-widest block">Featured Cover Image</label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all rounded-none ${
                  dragOver 
                    ? 'border-[#00FF9D] bg-[#111113]' 
                    : featureImage 
                      ? 'border-[#333333] bg-[#111113]' 
                      : 'border-[#333333] hover:border-[#00FF9D] bg-[#111113]'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {featureImage ? (
                  <div className="space-y-2 relative group">
                    <img
                      src={featureImage}
                      alt="Thumbnail preview"
                      className="w-full h-24 object-cover rounded-none"
                    />
                    <div className="absolute inset-0 bg-[#111113]/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-none">
                      <p className="text-[10px] text-[#00FF9D] font-mono font-bold uppercase tracking-widest">Replace Cover Image</p>
                    </div>
                    <p className="text-[9px] text-[#8A8782] font-mono truncate uppercase">{featureImage}</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <Upload className="w-6 h-6 text-[#00FF9D] mx-auto" />
                    <p className="text-xs font-mono font-bold text-white uppercase tracking-widest">Drag & drop cover</p>
                    <p className="text-[10px] text-[#8A8782] font-mono uppercase">or click to select file</p>
                  </div>
                )}
              </div>

              {/* Or type an image URL */}
              <input
                type="text"
                value={featureImage}
                onChange={(e) => setFeatureImage(e.target.value)}
                placeholder="OR PASTE COVER IMAGE URL..."
                className="w-full bg-[#111113] border border-[#333333] rounded-none px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#00FF9D] font-mono uppercase"
              />
            </div>

            <div className="border-t border-[#333333]" />

            {/* Featured Article toggle */}
            <div className="flex items-center justify-between py-1 text-xs font-mono uppercase">
              <div>
                <label className="text-xs font-bold text-white tracking-wide">Featured Article</label>
                <span className="text-[10px] text-[#8A8782] block tracking-tight">Highlight in theme indexes.</span>
              </div>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#00FF9D] rounded-none border-[#333333]"
              />
            </div>

            <div className="border-t border-[#333333]" />

            {/* Publishing Panel */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-bold text-[#8A8782] uppercase tracking-widest block">Deployment Actions</label>

              {status === 'scheduled' ? (
                <div className="space-y-3 p-4 bg-[#111113] border border-[#333333] rounded-none">
                  <div className="flex items-start space-x-2 text-xs">
                    <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-[#00FF9D]" />
                    <div className="space-y-0.5 font-mono uppercase">
                      <span className="font-bold text-white block">Scheduled Dispatch Active</span>
                      <span className="text-[10px] text-[#8A8782] block">
                        Target: {new Date(post.scheduled_at!).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelSchedule}
                    className="w-full py-2 bg-transparent hover:bg-[#FF5F57]/10 hover:text-[#FF5F57] hover:border-[#FF5F57] text-[#FF5F57] border border-[#FF5F57]/40 text-xs font-mono font-bold uppercase tracking-widest rounded-none transition-all cursor-pointer"
                  >
                    Cancel Scheduled Publish
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Schedule Date picker */}
                  <div className="space-y-2 p-4 bg-[#111113] border border-[#333333] rounded-none">
                    <label className="text-[9px] font-mono font-bold text-[#8A8782] uppercase tracking-widest block">Configure Schedule Time</label>
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-[#1A1A1C] border border-[#333333] rounded-none px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF9D] font-mono uppercase"
                    />
                    <button
                      onClick={handleSchedulePost}
                      disabled={saving}
                      className="w-full mt-2 py-2 bg-transparent hover:border-[#00FF9D] hover:text-[#00FF9D] border border-[#444] text-[#EAEAEA] text-xs font-mono font-bold uppercase tracking-widest rounded-none cursor-pointer transition-all"
                    >
                      Schedule Publication
                    </button>
                  </div>

                  {/* Publish Now */}
                  <div className="space-y-2">
                    <button
                      onClick={handlePublishNow}
                      disabled={publishing || saving}
                      className="w-full py-2.5 bg-[#00FF9D] hover:bg-[#00e08a] disabled:bg-[#333333] text-[#111113] text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center space-x-2 rounded-none transition-colors cursor-pointer"
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 inline" />
                          <span>Publishing live...</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5" />
                          <span>Publish Instantly Now</span>
                        </>
                      )}
                    </button>
                    {!ghostConfig.isConnected && (
                      <div className="p-3 bg-[#111113]/40 border border-[#333333] rounded-none flex items-start space-x-2 text-[10px] text-[#8A8782] leading-relaxed font-mono uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>Ghost blog connection offline. Publication triggers Simulation Mode logs.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out AI Assistant Panel */}
      {showAiSidebar && (
        <div className="w-80 border-l border-[#333333] shrink-0 h-full relative z-20 shadow-2xl animate-in slide-in-from-right duration-250 bg-[#1A1A1C]">
          <AIAssistant
            currentTitle={title}
            currentContent={html}
            onApplyDraft={handleApplyDraft}
            onApplySEO={handleApplySEO}
          />
        </div>
      )}
    </div>
  );
}
