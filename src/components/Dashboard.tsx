import React from 'react';
import { 
  FileText, 
  Calendar, 
  Layers, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  Settings,
  Flame,
  Plus
} from 'lucide-react';
import { Post, ActivityLog, DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  recentLogs: ActivityLog[];
  posts: Post[];
  onNavigate: (tab: string) => void;
  onEditPost: (postId: string) => void;
  onNewPost: () => void;
}

export default function Dashboard({
  stats,
  recentLogs,
  posts,
  onNavigate,
  onEditPost,
  onNewPost
}: DashboardProps) {

  // Format countdown for next scheduled post
  const getCountdown = (dateString?: string) => {
    if (!dateString) return 'None';
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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-[#1A1A1C] border border-[#333333] p-8 rounded-none relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-xl">
          <h1 className="font-syne font-extrabold text-3xl md:text-4xl text-white uppercase tracking-tighter">Ghost Dispatch Controller</h1>
          <p className="text-xs md:text-sm text-[#A0A0A0] font-mono uppercase tracking-wider leading-relaxed">
            Manage, optimize with AI agents, and queue high-quality articles with precise local desktop scheduling logic.
          </p>
        </div>
        <div className="mt-6 md:mt-0 flex items-center space-x-4 relative z-10 shrink-0">
          <button
            onClick={() => onNavigate('settings')}
            className="px-4 py-2.5 bg-transparent border border-[#444444] hover:border-[#00FF9D] text-[#EAEAEA] hover:text-[#00FF9D] text-[10px] font-mono uppercase tracking-widest rounded-none transition-all cursor-pointer"
          >
            Connection Settings
          </button>
          <button
            onClick={onNewPost}
            className="px-4 py-2.5 bg-[#00FF9D] hover:bg-[#00e08a] border border-[#00FF9D] text-[#111113] text-[10px] font-mono font-bold uppercase tracking-widest rounded-none transition-all cursor-pointer active:scale-95"
          >
            Create Article
          </button>
        </div>
      </div>

      {/* Grid Stats matching Design HTML */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT 1: Published */}
        <div className="bg-[#1A1A1C] border border-[#333333] p-6 rounded-none">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#EAEAEA] opacity-60 block">Published</span>
          <p className="text-4xl font-syne font-extrabold text-white mt-2 mb-0 leading-none">{stats.publishedCount}</p>
        </div>

        {/* STAT 2: Scheduled */}
        <div className="bg-[#1A1A1C] border border-[#333333] p-6 rounded-none">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#EAEAEA] opacity-60 block">Scheduled</span>
          <p className="text-4xl font-syne font-extrabold text-white mt-2 mb-0 leading-none">{stats.scheduledCount}</p>
        </div>

        {/* STAT 3: Drafts */}
        <div className="bg-[#1A1A1C] border border-[#333333] p-6 rounded-none">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#EAEAEA] opacity-60 block">Drafts</span>
          <p className="text-4xl font-syne font-extrabold text-white mt-2 mb-0 leading-none">{stats.draftCount}</p>
        </div>

        {/* STAT 4: Failed */}
        <div className="bg-[#1A1A1C] border border-[#333333] p-6 rounded-none">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#EAEAEA] opacity-60 block">Failed</span>
          <p className="text-4xl font-syne font-extrabold text-[#FF5F57] mt-2 mb-0 leading-none">{stats.failedCount}</p>
        </div>
      </div>

      {/* Main Dashboard Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Scheduled Post */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Scheduled Action */}
          <div className="bg-[#1A1A1C] border border-[#333333] p-6 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-[#333333] pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#00FF9D]" />
                <h3 className="font-syne font-bold text-base text-white uppercase tracking-wider">Next Scheduled Dispatch</h3>
              </div>
              <span className="px-2.5 py-1 bg-[#111113] border border-[#333333] text-[#00FF9D] rounded-none text-[9px] font-mono uppercase tracking-widest">
                Automated Queue
              </span>
            </div>

            {stats.nextScheduledPost ? (
              <div className="bg-[#111113] p-5 border border-[#333333] rounded-none flex items-start justify-between">
                <div className="space-y-2">
                  <span className="px-2 py-0.5 bg-[#1A1A1C] border border-[#333333] rounded-none text-[9px] text-[#00FF9D] font-mono uppercase tracking-wider">
                    {stats.nextScheduledPost.type}
                  </span>
                  <h4 className="font-syne font-bold text-lg text-white uppercase">{stats.nextScheduledPost.title}</h4>
                  <p className="text-xs text-[#A0A0A0] line-clamp-2 max-w-lg leading-relaxed">
                    {stats.nextScheduledPost.custom_excerpt || "No summary excerpt compiled. Head over to the editor to auto-build one using AI."}
                  </p>
                  <div className="flex items-center space-x-4 text-[10px] text-[#8A8782] font-mono pt-1 uppercase">
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(stats.nextScheduledPost.scheduled_at!).toLocaleString()}</span>
                    </span>
                    <span className="text-[#00FF9D] font-bold">
                      ({getCountdown(stats.nextScheduledPost.scheduled_at)})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onEditPost(stats.nextScheduledPost!.id)}
                  className="p-2 hover:bg-[#1A1A1C] text-[#00FF9D] border border-transparent hover:border-[#333333] transition-colors"
                  title="Open in editor"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="bg-[#111113] p-8 border border-dashed border-[#333333] rounded-none text-center space-y-4">
                <p className="text-xs font-mono uppercase tracking-wider text-[#8A8782]">There are currently no active articles scheduled for future publication.</p>
                <button
                  onClick={() => onNavigate('posts')}
                  className="px-4 py-2 bg-[#1A1A1C] hover:bg-[#333333] border border-[#444] text-[#EAEAEA] text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer"
                >
                  Schedule Your First Article
                </button>
              </div>
            )}

            {/* Scheduler Status indicator */}
            <div className="bg-[#00FF9D]/5 border border-[#00FF9D]/20 p-4 rounded-none flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">Automatic Dispatch Engine Active</span>
                  <span className="text-[9px] text-[#8A8782] font-mono uppercase tracking-tight">Scheduled checks occur transparently in the local background.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick List: Recent Content */}
          <div className="bg-[#1A1A1C] border border-[#333333] p-6 rounded-none space-y-4">
            <div className="flex items-center justify-between border-b border-[#333333] pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#00FF9D]" />
                <h3 className="font-syne font-bold text-base text-white uppercase tracking-wider">Recent Publications & Drafts</h3>
              </div>
              <button
                onClick={() => onNavigate('posts')}
                className="text-xs text-[#00FF9D] hover:text-[#00e08a] font-mono uppercase tracking-widest transition-colors"
              >
                View all content
              </button>
            </div>

            <div className="divide-y divide-[#333333] max-h-64 overflow-y-auto pr-1">
              {posts.slice(0, 4).map((post) => (
                <div key={post.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="space-y-1 pr-4">
                    <h4 
                      className="font-syne font-bold text-sm text-white hover:text-[#00FF9D] cursor-pointer line-clamp-1 transition-colors uppercase" 
                      onClick={() => onEditPost(post.id)}
                    >
                      {post.title}
                    </h4>
                    <div className="flex items-center space-x-3 text-[9px] text-[#8A8782] font-mono uppercase tracking-wider">
                      <span>{post.type}</span>
                      <span>•</span>
                      <span>Updated {new Date(post.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded-none text-[9px] font-mono border uppercase tracking-wider ${
                      post.status === 'published' ? 'bg-[#00FF9D]/10 border-[#00FF9D]/20 text-[#00FF9D]' :
                      post.status === 'scheduled' ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-400' :
                      post.status === 'failed' ? 'bg-red-950/40 border-red-500/20 text-[#FF5F57]' :
                      'bg-[#111113] border-[#333333] text-[#8A8782]'
                    }`}>
                      {post.status}
                    </span>
                    <button
                      onClick={() => onEditPost(post.id)}
                      className="text-[9px] bg-[#111113] hover:bg-[#1A1A1C] border border-[#333] text-[#EAEAEA] px-2.5 py-1.5 rounded-none font-mono uppercase tracking-wider cursor-pointer transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <p className="text-xs text-[#8A8782] font-mono uppercase tracking-wider text-center py-6">No articles available. Create a new draft to begin!</p>
              )}
            </div>
          </div>
        </div>

        {/* Real-Time Logs Panel */}
        <div className="bg-[#1A1A1C] border border-[#333333] p-6 rounded-none flex flex-col h-full max-h-[480px]">
          <div className="flex items-center justify-between border-b border-[#333333] pb-3 mb-4 shrink-0">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#00FF9D]" />
              <h3 className="font-syne font-bold text-base text-white uppercase tracking-wider">Dispatch Logs</h3>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-[10px] text-[#00FF9D] hover:text-[#00e08a] font-mono uppercase tracking-widest"
            >
              See all
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-[10px]">
            {recentLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="p-3 bg-[#111113] border border-[#333333] rounded-none">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-bold uppercase tracking-wider ${
                    log.type === 'success' ? 'text-[#00FF9D]' :
                    log.type === 'error' ? 'text-[#FF5F57]' :
                    log.type === 'warning' ? 'text-amber-500' : 'text-blue-400'
                  }`}>
                    [{log.type}]
                  </span>
                  <span className="text-[#8A8782] text-[9px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[#EAEAEA] font-sans text-xs leading-normal">{log.message}</p>
                {log.details && (
                  <p className="text-[9px] text-[#8A8782] mt-1.5 truncate border-t border-[#333333] pt-1 uppercase tracking-tight">
                    {log.details}
                  </p>
                )}
              </div>
            ))}
            {recentLogs.length === 0 && (
              <p className="text-[#8A8782] font-mono uppercase tracking-widest text-center py-12">No dispatch logs recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
