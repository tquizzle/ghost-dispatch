import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Layers, 
  Calendar, 
  Activity, 
  Settings, 
  LayoutDashboard, 
  FileText, 
  Search, 
  Plus, 
  RefreshCw, 
  Loader2, 
  Compass, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Post, ActivityLog, DashboardStats, GhostConfig } from './types';
import Dashboard from './components/Dashboard';
import SchedulesView from './components/SchedulesView';
import LogsView from './components/LogsView';
import SettingsView from './components/SettingsView';
import EditorView from './components/EditorView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [posts, setPosts] = useState<Post[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalPages: 0,
    publishedCount: 0,
    scheduledCount: 0,
    draftCount: 0,
    failedCount: 0
  });
  const [ghostConfig, setGhostConfig] = useState<GhostConfig>({
    apiUrl: '',
    adminApiKey: '',
    isConnected: false
  });

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Search & Filters for Posts tab
  const [postSearch, setPostSearch] = useState<string>('');
  const [postTypeFilter, setPostTypeFilter] = useState<string>('all');
  const [postStatusFilter, setPostStatusFilter] = useState<string>('all');

  // Load all foundational data
  const loadAllData = async () => {
    try {
      const postsRes = await fetch('/api/posts');
      const postsData = await postsRes.json();
      setPosts(postsData);

      const logsRes = await fetch('/api/logs');
      const logsData = await logsRes.json();
      setLogs(logsData);

      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      const configRes = await fetch('/api/config');
      const configData = await configRes.json();
      setGhostConfig({
        apiUrl: configData.apiUrl,
        adminApiKey: configData.adminApiKey,
        isConnected: configData.isConnected
      });
    } catch (err) {
      console.error('Error synchronizing dashboard database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    
    // Set up rapid polling interval for scheduled timeline updates (every 6 seconds)
    const interval = setInterval(() => {
      loadAllData();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    await loadAllData();
    setTimeout(() => setSyncing(false), 500);
  };

  const handleCreatePost = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Article Draft',
          html: '<h2>A new beginning</h2><p>Start writing your high-quality content draft here...</p>',
          status: 'draft',
          type: 'post',
          tags: ['AI']
        })
      });
      const newPost = await res.json();
      // Add to state and launch directly in Editor
      setPosts(prev => [newPost, ...prev]);
      setSelectedPost(newPost);
      setActiveTab('editor');
    } catch (err) {
      console.error('Failed to create new draft:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePostInEditor = async (updatedFields: Partial<Post>): Promise<Post> => {
    if (!selectedPost) throw new Error('No post active in editor');
    
    const res = await fetch(`/api/posts/${selectedPost.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update article.');
    }

    const saved = await res.json();
    
    // Update local lists
    setPosts(prev => prev.map(p => p.id === saved.id ? saved : p));
    setSelectedPost(saved);
    
    // Refresh stats
    const statsRes = await fetch('/api/stats');
    const statsData = await statsRes.json();
    setStats(statsData);

    return saved;
  };

  const handlePublishNowInEditor = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/publish-now`, {
      method: 'POST'
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Publish transaction failed.');
    }

    const data = await res.json();
    
    // Update posts state
    setPosts(prev => prev.map(p => p.id === postId ? data.post : p));
    setSelectedPost(data.post);
    
    // Sync statistics
    const statsRes = await fetch('/api/stats');
    const statsData = await statsRes.json();
    setStats(statsData);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setSelectedPost(null);
        setActiveTab('posts');
        loadAllData();
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear log history?')) return;
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      loadAllData();
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const handleOpenEditPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setActiveTab('editor');
    }
  };

  // Filter posts list for 'posts' library tab
  const filteredPostsList = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(postSearch.toLowerCase()) ||
                          post.tags.some(tag => tag.toLowerCase().includes(postSearch.toLowerCase()));
    const matchesType = postTypeFilter === 'all' || post.type === postTypeFilter;
    const matchesStatus = postStatusFilter === 'all' || post.status === postStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-[#111113] font-sans text-[#EAEAEA] overflow-hidden select-none">
      {/* Visual Desktop Sidebar Navigation */}
      <aside className="w-68 bg-[#1A1A1C] border-r border-[#333333] flex flex-col justify-between shrink-0 h-full">
        <div className="space-y-8 p-6">
          {/* Top Window Dots (Luxury Cyberpunk Feel) */}
          <div className="flex items-center space-x-1.5 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] opacity-80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] opacity-80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF9D] opacity-80" />
          </div>

          {/* Brand Logo Header */}
          <div>
            <h2 className="font-syne font-extrabold text-3xl tracking-tight text-white leading-none">GD_</h2>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#EAEAEA] opacity-60 block mt-1">Ghost Dispatch 1.0</span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-3">
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedPost(null); }}
              className={`w-full text-left px-4 py-3 border text-[11px] font-mono uppercase tracking-widest cursor-pointer transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-transparent border-[#00FF9D] text-[#00FF9D]' 
                  : 'bg-transparent border-[#333333] text-[#EAEAEA] hover:border-[#00FF9D] hover:text-[#00FF9D]'
              }`}
            >
              Dashboard Overview
            </button>

            <button
              onClick={() => { setActiveTab('posts'); setSelectedPost(null); }}
              className={`w-full text-left px-4 py-3 border text-[11px] font-mono uppercase tracking-widest cursor-pointer transition-all ${
                activeTab === 'posts' || activeTab === 'editor'
                  ? 'bg-transparent border-[#00FF9D] text-[#00FF9D]' 
                  : 'bg-transparent border-[#333333] text-[#EAEAEA] hover:border-[#00FF9D] hover:text-[#00FF9D]'
              }`}
            >
              Content Library
            </button>

            <button
              onClick={() => { setActiveTab('schedules'); setSelectedPost(null); }}
              className={`w-full text-left px-4 py-3 border text-[11px] font-mono uppercase tracking-widest cursor-pointer transition-all ${
                activeTab === 'schedules' 
                  ? 'bg-transparent border-[#00FF9D] text-[#00FF9D]' 
                  : 'bg-transparent border-[#333333] text-[#EAEAEA] hover:border-[#00FF9D] hover:text-[#00FF9D]'
              }`}
            >
              Publishing Timeline
            </button>

            <button
              onClick={() => { setActiveTab('logs'); setSelectedPost(null); }}
              className={`w-full text-left px-4 py-3 border text-[11px] font-mono uppercase tracking-widest cursor-pointer transition-all ${
                activeTab === 'logs' 
                  ? 'bg-transparent border-[#00FF9D] text-[#00FF9D]' 
                  : 'bg-transparent border-[#333333] text-[#EAEAEA] hover:border-[#00FF9D] hover:text-[#00FF9D]'
              }`}
            >
              Controller Logs
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setSelectedPost(null); }}
              className={`w-full text-left px-4 py-3 border text-[11px] font-mono uppercase tracking-widest cursor-pointer transition-all ${
                activeTab === 'settings' 
                  ? 'bg-transparent border-[#00FF9D] text-[#00FF9D]' 
                  : 'bg-transparent border-[#333333] text-[#EAEAEA] hover:border-[#00FF9D] hover:text-[#00FF9D]'
              }`}
            >
              Settings Portal
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Integration Connection Status */}
        <div className="p-6 border-t border-[#333333] bg-[#111113]/50 space-y-2">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#EAEAEA] opacity-60 block">SYSTEM STATUS</span>
          {ghostConfig.isConnected ? (
            <p className="font-mono text-[11px] text-[#00FF9D] flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-pulse" />
              RUNNING: ACTIVE LINK
            </p>
          ) : (
            <p className="font-mono text-[11px] text-[#FF5F57] flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-[#FF5F57] rounded-full animate-pulse" />
              RUNNING: OFFLINE
            </p>
          )}
          <p className="text-[9px] text-[#8A8782] leading-relaxed font-mono uppercase tracking-tight">
            {ghostConfig.isConnected && ghostConfig.apiUrl ? "SECURE CONNECTION" : "LOCAL SIMULATION MODE ACTIVE"}
          </p>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#111113]">
        {/* Workspace Top Toolbar */}
        <header className="h-20 border-b border-[#333333] bg-[#1A1A1C] px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-bold text-[#00FF9D] uppercase tracking-widest font-mono">SYS_CONTROL</span>
            <span className="text-[#333333]">/</span>
            <span className="text-xs font-syne font-bold text-white uppercase tracking-wider">{activeTab === 'editor' ? 'Editor Portal' : activeTab}</span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Sync Refresh Button */}
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className={`px-4 py-2 border text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
                syncing 
                  ? 'border-[#00FF9D] text-[#00FF9D]' 
                  : 'border-[#444444] text-[#EAEAEA] hover:border-[#00FF9D] hover:text-[#00FF9D]'
              }`}
              title="Sync Database Now"
            >
              {syncing ? 'SYNCING...' : 'SYNC_DB'}
            </button>
            <div className="text-right hidden md:block">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#EAEAEA] opacity-60 block">LOCAL SYSTEM TIME</span>
              <span className="font-mono text-xs text-[#EAEAEA] font-medium">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Workspace Client Views */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="w-full h-64 flex flex-col items-center justify-center space-y-4 text-[#8A8782]">
              <Loader2 className="w-8 h-8 animate-spin text-[#00FF9D]" />
              <p className="text-xs font-mono uppercase tracking-widest">SYNCHRONIZING SYSTEM REGISTERS...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  stats={stats}
                  recentLogs={logs}
                  posts={posts}
                  onNavigate={setActiveTab}
                  onEditPost={handleOpenEditPost}
                  onNewPost={handleCreatePost}
                />
              )}

              {activeTab === 'schedules' && (
                <SchedulesView
                  posts={posts}
                  onEditPost={handleOpenEditPost}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'logs' && (
                <LogsView
                  logs={logs}
                  onRefresh={handleSyncNow}
                  onClear={handleClearLogs}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  onConfigChanged={loadAllData}
                />
              )}

              {activeTab === 'editor' && selectedPost && (
                <EditorView
                  post={selectedPost}
                  ghostConfig={ghostConfig}
                  onSave={handleSavePostInEditor}
                  onPublishNow={handlePublishNowInEditor}
                  onDelete={handleDeletePost}
                  onClose={() => { setActiveTab('posts'); setSelectedPost(null); }}
                />
              )}

              {activeTab === 'posts' && (
                <div className="space-y-8">
                  {/* Content Library Header */}
                  <div className="border-b border-[#333333] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div>
                      <h1 className="font-syne font-extrabold text-4xl text-white uppercase tracking-tighter">
                        CONTENT LIBRARY
                      </h1>
                      <p className="text-xs text-[#8A8782] mt-1.5 font-mono uppercase tracking-wider">
                        FILTER, EDIT, AND COMPOSE ARTICLES FOR ACTIVE DEPLOYMENT
                      </p>
                    </div>
                    <button
                      onClick={handleCreatePost}
                      className="px-5 py-3 bg-[#00FF9D] hover:bg-[#00e08a] text-[#111113] border border-[#00FF9D] text-xs font-mono font-bold uppercase tracking-widest flex items-center space-x-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-[#111113]" />
                      <span>NEW ARTICLE</span>
                    </button>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#8A8782] absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={postSearch}
                        onChange={(e) => setPostSearch(e.target.value)}
                        placeholder="SEARCH BY TITLE, TAGS, OR EXCERPTS..."
                        className="w-full bg-[#1A1A1C] border border-[#333333] pl-11 pr-4 py-3 text-xs text-[#EAEAEA] placeholder-[#5A5A5C] focus:outline-none focus:border-[#00FF9D] font-mono uppercase tracking-wider"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* Type filter */}
                      <select
                        value={postTypeFilter}
                        onChange={(e) => setPostTypeFilter(e.target.value)}
                        className="bg-[#1A1A1C] border border-[#333333] px-4 py-3 text-xs text-[#EAEAEA] focus:outline-none focus:border-[#00FF9D] font-mono uppercase tracking-wider cursor-pointer"
                      >
                        <option value="all">ALL CONTENT TYPES</option>
                        <option value="post">BLOG POSTS</option>
                        <option value="page">STATIC PAGES</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={postStatusFilter}
                        onChange={(e) => setPostStatusFilter(e.target.value)}
                        className="bg-[#1A1A1C] border border-[#333333] px-4 py-3 text-xs text-[#EAEAEA] focus:outline-none focus:border-[#00FF9D] font-mono uppercase tracking-wider cursor-pointer"
                      >
                        <option value="all">ALL STATUSES</option>
                        <option value="draft">DRAFTS</option>
                        <option value="scheduled">SCHEDULED</option>
                        <option value="published">PUBLISHED</option>
                        <option value="failed">FAILED</option>
                      </select>
                    </div>
                  </div>

                  {/* Posts Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPostsList.map((post) => (
                      <div 
                        key={post.id} 
                        onClick={() => handleOpenEditPost(post.id)}
                        className="bg-[#1A1A1C] border border-[#333333] hover:border-[#00FF9D] p-6 cursor-pointer transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-4">
                          {/* Feature Image thumbnail if exists */}
                          {post.feature_image ? (
                            <img
                              src={post.feature_image}
                              alt="Header Preview"
                              className="w-full h-40 object-cover border border-[#333333]"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-12 bg-[#111113] border border-dashed border-[#333333] flex items-center justify-center text-[#8A8782]">
                              <ImageIconThumb />
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 bg-[#111113] border border-[#333333] text-[9px] font-mono text-[#00FF9D] uppercase tracking-widest">
                              {post.type}
                            </span>
                            <span className={`px-2.5 py-1 text-[9px] font-mono border uppercase tracking-widest ${
                              post.status === 'published' ? 'bg-[#00FF9D]/10 border-[#00FF9D]/30 text-[#00FF9D]' :
                              post.status === 'scheduled' ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-400' :
                              post.status === 'failed' ? 'bg-red-950/40 border-red-500/40 text-[#FF5F57]' :
                              'bg-[#111113] border-[#333333] text-[#8A8782]'
                            }`}>
                              {post.status}
                            </span>
                          </div>

                          <h3 className="font-syne font-bold text-lg text-white line-clamp-2 leading-tight group-hover:text-[#00FF9D] transition-colors uppercase">
                            {post.title}
                          </h3>

                          <p className="text-xs text-[#A0A0A0] line-clamp-2 leading-relaxed">
                            {post.custom_excerpt || "DRAFT AN ELEGANT SUMMARY AND SCHEDULE THIS POST USING AI ASSISTANTS."}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-[#333333] flex items-center justify-between text-[10px] text-[#8A8782] font-mono uppercase tracking-wider">
                          <span>UPDATED {new Date(post.updated_at).toLocaleDateString()}</span>
                          <div className="flex gap-1.5">
                            {post.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-[#111113] border border-[#333333] text-[9px] text-[#EAEAEA] font-mono uppercase">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredPostsList.length === 0 && (
                      <div className="col-span-full py-20 text-center text-[#8A8782] space-y-3 bg-[#1A1A1C] border border-[#333333]">
                        <p className="text-sm font-mono uppercase tracking-widest">NO DISPATCH RECORDS FOUND</p>
                        <p className="text-xs text-[#666]">Adjust filter criteria or compose a new content draft above.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Extra light graphic component for card thumbnail fallback
function ImageIconThumb() {
  return (
    <div className="flex items-center space-x-1">
      <FileText className="w-3.5 h-3.5" />
      <span className="text-[10px] font-mono">No header graphic</span>
    </div>
  );
}
