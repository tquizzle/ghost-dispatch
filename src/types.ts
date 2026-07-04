/**
 * Shared Type Definitions for the Ghost CMS Desktop Scheduler
 */

export interface GhostConfig {
  apiUrl: string;
  adminApiKey: string;
  isConnected: boolean;
}

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type ContentType = 'post' | 'page';

export interface Post {
  id: string;
  title: string;
  html: string;
  feature_image?: string;
  featured: boolean;
  status: PostStatus;
  type: ContentType;
  tags: string[];
  custom_excerpt?: string;
  created_at: string;
  updated_at: string;
  scheduled_at?: string; // ISO string when scheduled
  published_at?: string; // ISO string when published
  ghost_id?: string;     // ID assigned by Ghost CMS
  ghost_url?: string;    // URL on Ghost CMS site
  failure_reason?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface DashboardStats {
  totalPosts: number;
  totalPages: number;
  publishedCount: number;
  scheduledCount: number;
  draftCount: number;
  failedCount: number;
  nextScheduledPost?: Post;
}
