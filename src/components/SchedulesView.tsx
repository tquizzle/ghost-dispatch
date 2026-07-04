import React from 'react';
import { Calendar, Clock, CheckCircle, ArrowRight, CalendarDays, Edit, AlertCircle } from 'lucide-react';
import { Post } from '../types';

interface SchedulesViewProps {
  posts: Post[];
  onEditPost: (postId: string) => void;
  onNavigate: (tab: string) => void;
}

export default function SchedulesView({ posts, onEditPost, onNavigate }: SchedulesViewProps) {
  // Filter scheduled posts and sort chronologically
  const scheduledPosts = posts
    .filter(p => p.status === 'scheduled' && p.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

  // Filter published posts
  const recentlyPublished = posts
    .filter(p => p.status === 'published' && p.published_at)
    .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())
    .slice(0, 5);

  const getCountdown = (dateString?: string) => {
    if (!dateString) return '';
    const diff = new Date(dateString).getTime() - Date.now();
    if (diff <= 0) return 'Publishing now...';
    
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h ${mins % 60}m remaining`;
    return `${mins}m remaining`;
  };

  return (
    <div className="space-y-6 text-[#EAEAEA]">
      {/* Header */}
      <div className="border-b border-[#333333] pb-4">
        <h1 className="font-syne font-extrabold text-4xl text-white uppercase tracking-tighter flex items-center space-x-3">
          <CalendarDays className="w-6 h-6 text-[#00FF9D]" />
          <span>Automated Publishing Timeline</span>
        </h1>
        <p className="text-xs text-[#8A8782] mt-1.5 font-mono uppercase tracking-wider">
          Review, reschedule, and audit active queue pipelines designed for precise Ghost deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled Publications Timeline (Main block) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A8782] flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#00FF9D]" />
            <span>Active Scheduled Queue ({scheduledPosts.length})</span>
          </h3>

          <div className="space-y-4">
            {scheduledPosts.map((post, index) => (
              <div 
                key={post.id} 
                className="bg-[#1A1A1C] border border-[#333333] rounded-none p-5 relative overflow-hidden group flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 hover:border-[#00FF9D] transition-all"
              >
                {/* Timeline vertical bar connector simulation */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00FF9D]" />

                <div className="space-y-2 max-w-lg pl-3">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 bg-[#111113] border border-[#333333] text-[9px] font-mono text-[#00FF9D] uppercase tracking-widest">
                      {post.type}
                    </span>
                    <span className="text-[#00FF9D] font-mono text-[11px] font-semibold flex items-center space-x-1 uppercase">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{getCountdown(post.scheduled_at)}</span>
                    </span>
                  </div>

                  <h4 className="font-syne font-bold text-lg text-white group-hover:text-[#00FF9D] cursor-pointer transition-colors uppercase" onClick={() => onEditPost(post.id)}>
                    {post.title}
                  </h4>
                  <p className="text-xs text-[#A0A0A0] line-clamp-2 leading-relaxed">
                    {post.custom_excerpt || "No excerpt loaded. Edit this post to append brief summaries and metadata details."}
                  </p>

                  <div className="flex items-center space-x-2 text-[10px] text-[#8A8782] font-mono uppercase tracking-wider">
                    <span>Target Time:</span>
                    <span className="text-white font-semibold">{new Date(post.scheduled_at!).toLocaleString()}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-2 pl-3">
                  <button
                    onClick={() => onEditPost(post.id)}
                    className="px-4 py-2 bg-transparent hover:border-[#00FF9D] hover:text-[#00FF9D] border border-[#444] text-[#EAEAEA] text-[10px] font-mono uppercase tracking-widest rounded-none transition-all cursor-pointer flex items-center space-x-1.5"
                    title="Edit publication parameters"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </button>
                </div>
              </div>
            ))}

            {scheduledPosts.length === 0 && (
              <div className="bg-[#1A1A1C] border border-dashed border-[#333333] p-8 text-center rounded-none space-y-4">
                <Calendar className="w-8 h-8 text-[#8A8782] mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-mono uppercase tracking-widest text-white">No publications currently on the schedule.</p>
                  <p className="text-xs text-[#8A8782] font-mono uppercase tracking-wider">Draft articles in the workspace and click "Schedule" to arrange active launches.</p>
                </div>
                <button
                  onClick={() => onNavigate('posts')}
                  className="px-4 py-2 bg-[#00FF9D] hover:bg-[#00e08a] text-[#111113] rounded-none text-xs font-mono font-bold uppercase tracking-widest cursor-pointer transition-all mt-2"
                >
                  Create Scheduled Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recently Published History (Sidebar log) */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8A8782] flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#00FF9D]" />
            <span>Recently Published ({recentlyPublished.length})</span>
          </h3>

          <div className="bg-[#1A1A1C] border border-[#333333] p-5 rounded-none space-y-4">
            {recentlyPublished.map((post) => (
              <div key={post.id} className="space-y-2 border-b border-[#333333] last:border-b-0 pb-3.5 last:pb-0">
                <span className="text-[9px] text-[#8A8782] font-mono block uppercase">
                  {new Date(post.published_at!).toLocaleDateString()} at {new Date(post.published_at!).toLocaleTimeString()}
                </span>
                <h4 
                  onClick={() => onEditPost(post.id)}
                  className="font-syne font-bold text-sm text-white hover:text-[#00FF9D] cursor-pointer transition-colors line-clamp-1 uppercase"
                >
                  {post.title}
                </h4>
                {post.ghost_url && (
                  <a 
                    href={post.ghost_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-[10px] text-[#00FF9D] hover:text-[#00e08a] font-mono uppercase tracking-wider"
                  >
                    <span>View live article</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}

            {recentlyPublished.length === 0 && (
              <p className="text-xs text-[#8A8782] font-mono uppercase tracking-wider text-center py-6">No publications completed yet.</p>
            )}
          </div>

          {/* Guide info */}
          <div className="p-5 bg-[#1A1A1C] border border-[#333333] rounded-none space-y-3 text-xs text-[#A0A0A0] leading-normal">
            <div className="flex items-center space-x-2 text-white font-syne font-bold text-sm mb-1 uppercase">
              <AlertCircle className="w-4 h-4 text-[#00FF9D]" />
              <span>How Local Scheduling Works</span>
            </div>
            <p className="text-[11px] leading-relaxed font-mono uppercase tracking-wide text-xs">
              This software runs an active local orchestration handler that evaluates targets every 6 seconds in the background.
            </p>
            <p className="text-[11px] leading-relaxed font-mono uppercase tracking-wide text-xs">
              When a post matches the `scheduled` status and its designated deployment timeline is reached, the controller publishes the payload directly to your connected Ghost CMS database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
