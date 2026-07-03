import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface AIAssistantProps {
  currentTitle: string;
  currentContent: string;
  onApplyDraft: (html: string) => void;
  onApplySEO: (title: string, excerpt: string, tags: string[]) => void;
}

export default function AIAssistant({
  currentTitle,
  currentContent,
  onApplyDraft,
  onApplySEO
}: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // SEO Suggestions State
  const [seoSuggestions, setSeoSuggestions] = useState<{
    optimizedTitle?: string;
    metaExcerpt?: string;
    suggestedTags?: string[];
  } | null>(null);

  const [imagePrompt, setImagePrompt] = useState<string | null>(null);

  const handleGenerateDraft = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSeoSuggestions(null);
    setImagePrompt(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_draft', prompt })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate draft');
      
      onApplyDraft(data.result);
      setSuccess('Draft successfully generated and inserted into your editor!');
      setPrompt('');
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeSEO = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSeoSuggestions(null);
    setImagePrompt(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'optimize_seo', 
          title: currentTitle, 
          content: currentContent 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to optimize SEO');
      
      setSeoSuggestions(data);
      setSuccess('SEO analysis complete! Review recommendations below.');
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImagePrompt = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSeoSuggestions(null);
    setImagePrompt(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate_image_prompt', 
          title: currentTitle, 
          content: currentContent 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate image prompt');
      
      setImagePrompt(data.prompt);
      setSuccess('Image prompt draft ready!');
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1A1C] border-l border-[#333333] text-[#EAEAEA] p-5 overflow-y-auto">
      <div className="flex items-center space-x-2 border-b border-[#333333] pb-3 mb-4">
        <Sparkles className="w-5 h-5 text-[#00FF9D]" />
        <h2 className="font-syne font-extrabold text-sm text-white uppercase tracking-wider">Gemini Dispatch Assistant</h2>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-[#FF5F57]/10 border border-[#FF5F57]/20 flex items-start space-x-2 text-xs text-[#FF5F57] font-mono uppercase tracking-wide">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF5F57]" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 bg-[#00FF9D]/10 border border-[#00FF9D]/20 flex items-start space-x-2 text-xs text-[#00FF9D] font-mono uppercase tracking-wide">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#00FF9D]" />
          <span>{success}</span>
        </div>
      )}

      {/* Draft Generator */}
      <div className="space-y-3 mb-6 font-mono">
        <label className="text-[10px] font-bold text-[#8A8782] uppercase tracking-widest block">AI Article Draft Generator</label>
        <p className="text-[11px] text-[#8A8782] leading-relaxed uppercase">Describe what you want to write about, and Gemini will output structured HTML headings, paragraphs, and lists.</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.G., AN INTRODUCTORY GUIDE TO GHOST CMS AND HEADLESS BLOGGING ARCHITECTURES IN 2026..."
          className="w-full h-24 bg-[#111113] border border-[#333333] rounded-none p-3 text-xs text-white placeholder-[#5A5A5C] focus:outline-none focus:border-[#00FF9D] resize-none leading-relaxed uppercase"
          disabled={loading}
        />
        <button
          onClick={handleGenerateDraft}
          disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#00FF9D] hover:bg-[#00e08a] disabled:bg-[#333333] disabled:text-[#8A8782] text-[#111113] rounded-none text-xs font-mono font-bold uppercase tracking-widest cursor-pointer transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#111113]" />
          ) : (
            <>
              <span>Generate Draft Content</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      <div className="border-t border-[#333333] my-4" />

      {/* SEO Optimizer & Metadata Tool */}
      <div className="space-y-3 mb-6 font-mono">
        <label className="text-[10px] font-bold text-[#8A8782] uppercase tracking-widest block">SEO & Metadata Optimizer</label>
        <p className="text-[11px] text-[#8A8782] leading-relaxed uppercase">Analyze your active editor's title & content to generate catchy SEO titles, tags, and summary snippets.</p>
        <button
          onClick={handleOptimizeSEO}
          disabled={loading || !currentTitle}
          className="w-full py-2.5 bg-transparent hover:bg-[#111113] border border-[#444444] text-[#00FF9D] hover:border-[#00FF9D] disabled:bg-[#333333] disabled:text-[#8A8782] rounded-none text-xs font-bold uppercase tracking-widest cursor-pointer transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-[#00FF9D]" /> : "Analyze & Optimize SEO"}
        </button>

        {seoSuggestions && (
          <div className="mt-4 p-4 bg-[#111113] border border-[#333333] rounded-none space-y-3 text-xs">
            <div>
              <span className="font-mono text-[10px] text-[#00FF9D] uppercase tracking-wider block mb-0.5">Optimized SEO Title:</span>
              <p className="text-white italic leading-relaxed uppercase">"{seoSuggestions.optimizedTitle}"</p>
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#00FF9D] uppercase tracking-wider block mb-0.5">Custom Meta Excerpt:</span>
              <p className="text-white italic leading-relaxed uppercase">{seoSuggestions.metaExcerpt}</p>
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#00FF9D] uppercase tracking-wider block mb-0.5">Suggested Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {seoSuggestions.suggestedTags?.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-[#1A1A1C] border border-[#333333] rounded-none text-[10px] text-white font-mono uppercase">{tag}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (seoSuggestions.optimizedTitle && seoSuggestions.metaExcerpt && seoSuggestions.suggestedTags) {
                  onApplySEO(
                    seoSuggestions.optimizedTitle,
                    seoSuggestions.metaExcerpt,
                    seoSuggestions.suggestedTags
                  );
                  setSuccess('Successfully applied SEO metadata to your post configuration!');
                  setSeoSuggestions(null);
                }
              }}
              className="w-full mt-2 py-2 bg-[#00FF9D] hover:bg-[#00e08a] text-[#111113] text-xs font-bold uppercase tracking-widest rounded-none transition-colors"
            >
              Apply Suggestions to Post
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-[#333333] my-4" />

      {/* Featured Image Prompt Builder */}
      <div className="space-y-3 mb-4 font-mono">
        <label className="text-[10px] font-bold text-[#8A8782] uppercase tracking-widest block">Featured Cover Image Prompt Builder</label>
        <p className="text-[11px] text-[#8A8782] leading-relaxed uppercase">Generate a descriptive creative prompt to use in text-to-image generators (like Imagen) for a bespoke header asset.</p>
        <button
          onClick={handleGenerateImagePrompt}
          disabled={loading || !currentTitle}
          className="w-full py-2.5 bg-transparent hover:bg-[#111113] border border-[#444444] text-[#00FF9D] hover:border-[#00FF9D] disabled:bg-[#333333] disabled:text-[#8A8782] rounded-none text-xs font-bold uppercase tracking-widest cursor-pointer transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-[#00FF9D]" /> : "Draft Custom Image Prompt"}
        </button>

        {imagePrompt && (
          <div className="mt-4 p-4 bg-[#111113] border border-[#333333] rounded-none text-xs space-y-2">
            <span className="font-mono text-[10px] text-[#00FF9D] uppercase tracking-wider block">Imagen/AI Prompt:</span>
            <p className="text-white leading-relaxed italic uppercase">"{imagePrompt}"</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(imagePrompt || '');
                setSuccess('Prompt copied to clipboard! You can paste it into any image generator.');
              }}
              className="w-full mt-2 py-1.5 bg-[#1A1A1C] hover:bg-[#111113] text-white border border-[#333333] rounded-none text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Copy Prompt Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
