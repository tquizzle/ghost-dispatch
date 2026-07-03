import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with increased limit for image base64 uploads
app.use(express.json({ limit: "50mb" }));

const DB_FILE = path.join(process.cwd(), "data", "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

// Ensure data storage directories exist
function ensureDirectories() {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      config: {
        apiUrl: "https://your-ghost-blog.com",
        adminApiKey: "",
        isConnected: false
      },
      posts: [
        {
          id: "welcome-post",
          title: "Welcome to your Ghost CMS Desktop Scheduler 🚀",
          html: `<h2>Power Up Your Publishing Workflow</h2><p>This is your advanced content workspace. Here you can write, edit, schedule, and seamlessly post rich articles and pages directly to your Ghost CMS blog.</p><p>We have integrated a powerful <strong>AI Content Assistant</strong> powered by Gemini to help you write high-quality drafts, generate optimized metadata, select popular tags, and create image assets with ease. Click on the <strong>AI Assistant</strong> sidebar on the right to start drafting with intelligence.</p><p>This application is designed to simulate a native cross-platform Electron experience, offering robust offline drafting, instant publish actions, and a reliable background scheduler. When you set a publication time in the future, our local server's background scheduler will actively run checks and publish it precisely on time.</p><h3>Connecting your Ghost CMS</h3><p>To connect to your live Ghost blog, head over to the <strong>Settings</strong> tab, enter your Ghost Blog URL and Admin API Key (which you can generate under the Integrations section of your Ghost Admin Panel), and hit connect. If you do not have a live Ghost instance, you can run the dashboard in <strong>Simulation Mode</strong> to fully test scheduling, image uploads, logs, and layout previews!</p>`,
          featured: true,
          status: "published",
          type: "post",
          tags: ["Guide", "Getting Started"],
          custom_excerpt: "Learn how to make the most of your Ghost CMS Desktop Scheduler, from drafting rich HTML content to configuring active background publishing workflows.",
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          published_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          ghost_id: "sim_welcome_id"
        },
        {
          id: "ai-content-marketing",
          title: "How to Build a High-Converting Content Funnel with Gemini AI",
          html: `<h2>Maximizing Blog ROI with AI-Driven Content</h2><p>Writing high-quality content consistently is one of the biggest hurdles in modern marketing. Headless CMS solutions like Ghost allow publishers to distribute content fast, but drafting remains a bottleneck. By integrating advanced generative AI models directly into your scheduling dashboard, you can multiply your publishing throughput without sacrificing quality.</p><h3>Three Steps to Effective AI Collaboration:</h3><ol><li><strong>Deep Research Drafts:</strong> Prompt the AI with a structured outline, specifying your target audience and core call-to-action. Let it compile the base narrative.</li><li><strong>Human Editing & Polishing:</strong> Never publish raw outputs. Use our rich editor to refine the tone, embed your personal anecdotes, and format headings for readability.</li><li><strong>SEO Metadata Generation:</strong> Generate semantic tags and concise meta descriptions using our integrated SEO tool.</li></ol>`,
          featured: false,
          status: "draft",
          type: "post",
          tags: ["AI", "Content Marketing", "SEO"],
          custom_excerpt: "Discover the exact workflow to blend generative AI with headless publishing for professional, high-impact blog posts.",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "headless-cms-trends",
          title: "The Future of Headless Architecture & Ghost CMS",
          html: `<h2>Why Headless is Winning</h2><p>Traditional monolithic CMS setups are slow, hard to scale, and vulnerable. Headless platforms like Ghost separate your content database from the presentation layer, allowing you to feed multiple channels—websites, mobile apps, newsletters, and desktop portals—from a single API.</p><h3>Key Benefits of Going Headless in 2026:</h3><ul><li><strong>Blazing Fast Performance:</strong> Serve static pages compiled with frameworks like Next.js or Astro.</li><li><strong>Bulletproof Security:</strong> The administration backend sits behind an API, completely decoupled from the public frontend.</li><li><strong>Omnichannel Delivery:</strong> Deliver rich content natively to custom reader apps or smartwatch widgets without duplicate storage.</li></ul>`,
          featured: false,
          status: "scheduled",
          type: "page",
          tags: ["Tech", "Headless CMS", "Ghost"],
          custom_excerpt: "Explore the rapid transition of modern web developers from monolithic layouts to headless content hubs and how Ghost leads the space.",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          scheduled_at: new Date(Date.now() + 3600000 * 2).toISOString() // 2 hours in the future
        }
      ],
      logs: [
        {
          id: "log-1",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          type: "info",
          message: "Ghost CMS Desktop Scheduler initialized in simulation mode.",
          details: "Local storage directory verified at data/ and local configuration loaded."
        },
        {
          id: "log-2",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          type: "success",
          message: "Welcome post generated successfully.",
          details: "Initial guidance content and workspace tutorials loaded into database."
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  }
}

ensureDirectories();

// Serve uploads statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Database helpers
function loadDb() {
  ensureDirectories();
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return { config: { apiUrl: "", adminApiKey: "", isConnected: false }, posts: [], logs: [] };
  }
}

function saveDb(data: any) {
  ensureDirectories();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

function addLog(type: 'info' | 'success' | 'warning' | 'error', message: string, details?: string) {
  const db = loadDb();
  const log = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  };
  db.logs.unshift(log); // newest first
  // cap logs at 200 items to avoid bloated files
  if (db.logs.length > 200) {
    db.logs = db.logs.slice(0, 200);
  }
  saveDb(db);
  console.log(`[LOG] [${type.toUpperCase()}] ${message}`);
}

// Pure Node.js function to sign Ghost Admin API tokens without external JWT dependencies
function createGhostToken(apiKey: string): string {
  const [id, secret] = apiKey.split(":");
  if (!id || !secret) {
    throw new Error("Invalid Admin API Key format. Must be id:secret");
  }

  const header = {
    alg: "HS256",
    typ: "JWT",
    kid: id
  };

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 5 * 60; // 5 mins
  const payload = {
    iat,
    exp,
    aud: "/admin/"
  };

  const base64UrlEncode = (str: string | Buffer): string => {
    const base64 = typeof str === "string" 
      ? Buffer.from(str).toString("base64") 
      : str.toString("base64");
    return base64
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  const hmac = crypto.createHmac("sha256", Buffer.from(secret, "hex"));
  hmac.update(signatureInput);
  const signatureB64 = base64UrlEncode(hmac.digest());

  return `${signatureInput}.${signatureB64}`;
}

// Fetch helper with timeout
async function ghostApiRequest(apiUrl: string, apiKey: string, endpoint: string, method: string = "GET", body?: any) {
  const token = createGhostToken(apiKey);
  const cleanUrl = apiUrl.replace(/\/$/, "");
  const url = `${cleanUrl}/ghost/api/admin/${endpoint}`;

  const headers: Record<string, string> = {
    "Authorization": `Ghost ${token}`,
    "Content-Type": "application/json"
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ghost API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

/**
 * API ENDPOINTS
 */

// Configuration
app.get("/api/config", (req, res) => {
  const db = loadDb();
  // Mask the secret for safe transmission
  const maskedApiKey = db.config.adminApiKey 
    ? `${db.config.adminApiKey.split(":")[0]}:••••••••••••` 
    : "";
  res.json({
    apiUrl: db.config.apiUrl,
    adminApiKey: maskedApiKey,
    hasApiKey: !!db.config.adminApiKey,
    isConnected: db.config.isConnected
  });
});

app.post("/api/config", async (req, res) => {
  const { apiUrl, adminApiKey } = req.body;
  const db = loadDb();

  let finalApiKey = adminApiKey;
  // If the user didn't change the API key (it came back masked)
  if (adminApiKey === `${db.config.adminApiKey.split(":")[0]}:••••••••••••`) {
    finalApiKey = db.config.adminApiKey;
  }

  db.config.apiUrl = apiUrl;
  db.config.adminApiKey = finalApiKey;

  if (!apiUrl) {
    db.config.isConnected = false;
    saveDb(db);
    addLog("warning", "Ghost integration disconnected (empty URL).");
    return res.json({ success: true, isConnected: false });
  }

  // Attempt to test the connection by fetching users or site info
  try {
    addLog("info", `Attempting connection to Ghost CMS Admin API at ${apiUrl}...`);
    // fetch site settings to check connectivity
    const siteData = await ghostApiRequest(apiUrl, finalApiKey, "site/");
    db.config.isConnected = true;
    saveDb(db);
    addLog("success", `Connected to Ghost CMS successfully! Site title: "${siteData.site.title}"`);
    res.json({ success: true, isConnected: true, siteTitle: siteData.site.title });
  } catch (error: any) {
    db.config.isConnected = false;
    saveDb(db);
    addLog("error", `Ghost CMS connection failed: ${error.message}`);
    res.status(400).json({ success: false, isConnected: false, error: error.message });
  }
});

// Stats endpoint
app.get("/api/stats", (req, res) => {
  const db = loadDb();
  const posts = db.posts;

  const totalPosts = posts.filter((p: any) => p.type === "post").length;
  const totalPages = posts.filter((p: any) => p.type === "page").length;
  const publishedCount = posts.filter((p: any) => p.status === "published").length;
  const scheduledCount = posts.filter((p: any) => p.status === "scheduled").length;
  const draftCount = posts.filter((p: any) => p.status === "draft").length;
  const failedCount = posts.filter((p: any) => p.status === "failed").length;

  // Find next scheduled post
  const scheduled = posts
    .filter((p: any) => p.status === "scheduled" && p.scheduled_at)
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  res.json({
    totalPosts,
    totalPages,
    publishedCount,
    scheduledCount,
    draftCount,
    failedCount,
    nextScheduledPost: scheduled[0] || null
  });
});

// Logs API
app.get("/api/logs", (req, res) => {
  const db = loadDb();
  res.json(db.logs);
});

app.post("/api/logs/clear", (req, res) => {
  const db = loadDb();
  db.logs = [
    {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "info",
      message: "Activity log cleared.",
      details: "Database log history reset by user."
    }
  ];
  saveDb(db);
  res.json({ success: true });
});

// Posts / Pages CRUD
app.get("/api/posts", (req, res) => {
  const db = loadDb();
  // Sort by updated_at descending
  const sorted = [...db.posts].sort(
    (a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  res.json(sorted);
});

app.get("/api/posts/:id", (req, res) => {
  const db = loadDb();
  const post = db.posts.find((p: any) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }
  res.json(post);
});

app.post("/api/posts", (req, res) => {
  const db = loadDb();
  const { title, html, featured, status, type, tags, custom_excerpt, scheduled_at } = req.body;

  const id = `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const newPost = {
    id,
    title: title || "Untitled draft",
    html: html || "",
    featured: !!featured,
    status: status || "draft",
    type: type || "post",
    tags: tags || [],
    custom_excerpt: custom_excerpt || "",
    created_at: now,
    updated_at: now,
    scheduled_at: status === "scheduled" ? scheduled_at : undefined,
  };

  db.posts.push(newPost);
  saveDb(db);

  addLog(
    "info", 
    `Created new ${newPost.type}: "${newPost.title}"`,
    `Status: ${newPost.status}${newPost.status === 'scheduled' ? ` (Scheduled for ${scheduled_at})` : ''}`
  );

  res.json(newPost);
});

app.put("/api/posts/:id", (req, res) => {
  const db = loadDb();
  const index = db.posts.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const existingPost = db.posts[index];
  const { title, html, featured, status, type, tags, custom_excerpt, scheduled_at, feature_image } = req.body;

  const updatedPost = {
    ...existingPost,
    title: title !== undefined ? title : existingPost.title,
    html: html !== undefined ? html : existingPost.html,
    featured: featured !== undefined ? !!featured : existingPost.featured,
    status: status !== undefined ? status : existingPost.status,
    type: type !== undefined ? type : existingPost.type,
    tags: tags !== undefined ? tags : existingPost.tags,
    custom_excerpt: custom_excerpt !== undefined ? custom_excerpt : existingPost.custom_excerpt,
    scheduled_at: status === "scheduled" ? (scheduled_at || existingPost.scheduled_at) : undefined,
    feature_image: feature_image !== undefined ? feature_image : existingPost.feature_image,
    updated_at: new Date().toISOString(),
  };

  // If status changed to something other than scheduled, remove scheduled_at
  if (updatedPost.status !== "scheduled") {
    delete updatedPost.scheduled_at;
  }

  db.posts[index] = updatedPost;
  saveDb(db);

  addLog(
    "info", 
    `Updated ${updatedPost.type}: "${updatedPost.title}"`,
    `Fields updated. Status: ${updatedPost.status}`
  );

  res.json(updatedPost);
});

app.delete("/api/posts/:id", (req, res) => {
  const db = loadDb();
  const index = db.posts.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const deleted = db.posts.splice(index, 1)[0];
  saveDb(db);

  addLog("warning", `Deleted ${deleted.type}: "${deleted.title}"`);
  res.json({ success: true, deletedId: req.params.id });
});

// Image upload handling (saves locally and returns a served url)
app.post("/api/upload", (req, res) => {
  const { base64, filename } = req.body;
  if (!base64 || !filename) {
    return res.status(400).json({ error: "Missing base64 data or filename" });
  }

  try {
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 string format" });
    }

    const buffer = Buffer.from(matches[2], "base64");
    const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    fs.writeFileSync(filePath, buffer);
    const relativeUrl = `/uploads/${safeFilename}`;

    addLog("success", `Image file uploaded successfully: ${filename}`, `Saved to disk as ${safeFilename}`);
    res.json({ url: relativeUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to send post to live Ghost CMS or simulate it
async function publishPostToGhost(post: any, config: any): Promise<{ ghostId: string; ghostUrl: string }> {
  if (!config.isConnected || !config.apiUrl || !config.adminApiKey) {
    // Return simulated details
    return {
      ghostId: `sim_${Math.random().toString(36).substr(2, 9)}`,
      ghostUrl: `${config.apiUrl || "https://ghost.io"}/${post.type === "page" ? "" : "blog/"}${post.id}`
    };
  }

  // Format tags into Ghost format
  const ghostTags = post.tags.map((tag: string) => ({ name: tag }));

  // Prepare payload for Ghost CMS Admin API
  // Ghost takes 'posts' or 'pages' array based on the content type
  const isPage = post.type === "page";
  const resource = isPage ? "pages" : "posts";
  
  // Note: For publishing HTML directly, we append `?source=html` in query params
  const payloadKey = isPage ? "pages" : "posts";
  const payload = {
    [payloadKey]: [
      {
        title: post.title,
        html: post.html,
        status: "published", // Set status directly to publish
        featured: !!post.featured,
        custom_excerpt: post.custom_excerpt || "",
        tags: ghostTags,
        // If there's a feature image, send it too. If it is a local upload, send it
        // Note: For absolute production, Ghost CMS requires uploading the image to Ghost first,
        // but it accepts full URL sources if it can fetch them, or relative links if configured
        feature_image: post.feature_image ? (post.feature_image.startsWith("http") ? post.feature_image : `${process.env.APP_URL || ""}${post.feature_image}`) : undefined
      }
    ]
  };

  const endpoint = `${resource}/?source=html`;
  const result = await ghostApiRequest(config.apiUrl, config.adminApiKey, endpoint, "POST", payload);
  
  const responseItem = result[payloadKey][0];
  return {
    ghostId: responseItem.id,
    ghostUrl: responseItem.url || `${config.apiUrl}/${responseItem.slug}`
  };
}

// Publish Now endpoint
app.post("/api/posts/:id/publish-now", async (req, res) => {
  const db = loadDb();
  const index = db.posts.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const post = db.posts[index];
  const isSimulated = !db.config.isConnected || !db.config.apiUrl || !db.config.adminApiKey;

  try {
    addLog("info", `Initiating immediate publishing for ${post.type}: "${post.title}"...`, isSimulated ? "Running in SIMULATION MODE." : "Connecting to active Ghost CMS Admin API.");
    
    // Attempt publish
    const result = await publishPostToGhost(post, db.config);
    
    post.status = "published";
    post.published_at = new Date().toISOString();
    post.ghost_id = result.ghostId;
    post.ghost_url = result.ghostUrl;
    delete post.failure_reason;

    db.posts[index] = post;
    saveDb(db);

    addLog(
      "success", 
      `Successfully published "${post.title}" to Ghost CMS!`,
      `Ghost ID: ${result.ghostId} | Live URL: ${result.ghostUrl}`
    );

    res.json({ success: true, post });
  } catch (error: any) {
    post.status = "failed";
    post.failure_reason = error.message;
    db.posts[index] = post;
    saveDb(db);

    addLog("error", `Failed to publish "${post.title}": ${error.message}`);
    res.status(500).json({ error: error.message, post });
  }
});

// AI Content generation using @google/genai
app.post("/api/ai/generate", async (req, res) => {
  const { action, prompt, title, content, count } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: "Gemini API Key is missing. Please configure it in Settings > Secrets inside the AI Studio UI." 
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    addLog("info", `Gemini AI called for action: "${action}"`, `Prompt details: ${prompt || "N/A"}`);

    if (action === "generate_draft") {
      const modelPrompt = `
        Write a complete, structured HTML blog post draft in professional, engaging tone.
        Topic/Prompt: ${prompt}
        Tone: Professional and informative
        Format guidelines:
        - Use clean headings (<h2>, <h3>)
        - Use paragraphs (<p>)
        - Do not include <html>, <head>, or <body> wrapping, just raw, inner HTML.
        - Provide high quality, comprehensive information.
        - Include some bullet points (<ul>, <li>) or ordered list (<ol>, <li>).
        Output ONLY the HTML content.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: modelPrompt,
      });

      const html = response.text || "";
      return res.json({ result: html.replace(/^```html\s*|\s*```$/gi, "").trim() });
    }

    if (action === "optimize_seo") {
      const modelPrompt = `
        Analyze this blog post and return high-quality SEO suggestions including an optimized title and custom excerpt.
        Title: ${title}
        Content: ${content}
        
        Provide the response as a JSON object matching this schema:
        {
          "optimizedTitle": "A catchy, SEO-friendly version of the title",
          "metaExcerpt": "A concise, high-converting meta description/excerpt under 160 characters",
          "suggestedTags": ["tag1", "tag2", "tag3"]
        }
        Do not wrap the JSON in markdown formatting.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: modelPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              optimizedTitle: { type: Type.STRING },
              metaExcerpt: { type: Type.STRING },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["optimizedTitle", "metaExcerpt", "suggestedTags"]
          }
        }
      });

      return res.json(JSON.parse(response.text || "{}"));
    }

    if (action === "suggest_tags") {
      const modelPrompt = `
        Analyze the title and content, and suggest up to 5 highly relevant taxonomy tags for categorization.
        Title: ${title}
        Content: ${content}
        Return only a JSON array of strings: ["tag1", "tag2", ...]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: modelPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      return res.json({ tags: JSON.parse(response.text || "[]") });
    }

    if (action === "generate_image_prompt") {
      const modelPrompt = `
        Based on the following blog post title and excerpt, write a creative, detailed prompt for a text-to-image generator (like Imagen) to create an eye-catching featured header image. Keep it under 3 sentences.
        Title: ${title}
        Excerpt: ${content}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: modelPrompt,
      });

      return res.json({ prompt: response.text?.trim() });
    }

    res.status(400).json({ error: `Unknown AI action: ${action}` });
  } catch (error: any) {
    addLog("error", `AI content generation failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});


/**
 * BACKGROUND SCHEDULER ENGINE
 * Checks for scheduled posts that are due for publication
 */
async function runSchedulerCheck() {
  const db = loadDb();
  const now = new Date();
  
  const duePosts = db.posts.filter((post: any) => {
    if (post.status !== "scheduled" || !post.scheduled_at) return false;
    const scheduleTime = new Date(post.scheduled_at);
    return scheduleTime <= now;
  });

  if (duePosts.length === 0) return;

  addLog("info", `Scheduler: Found ${duePosts.length} posts due for publication.`);

  for (const post of duePosts) {
    const isSimulated = !db.config.isConnected || !db.config.apiUrl || !db.config.adminApiKey;
    try {
      addLog("info", `Scheduler: Automatically publishing due post/page "${post.title}"...`, isSimulated ? "Running in simulation mode." : "Connecting to active Ghost CMS Admin API.");
      
      const result = await publishPostToGhost(post, db.config);
      
      post.status = "published";
      post.published_at = new Date().toISOString();
      post.ghost_id = result.ghostId;
      post.ghost_url = result.ghostUrl;
      delete post.failure_reason;

      // Find original in DB and update
      const dbIndex = db.posts.findIndex((p: any) => p.id === post.id);
      if (dbIndex !== -1) {
        db.posts[dbIndex] = post;
      }

      addLog(
        "success", 
        `Scheduler: Automatically published "${post.title}" successfully!`,
        `Ghost ID: ${result.ghostId} | Live URL: ${result.ghostUrl}`
      );
    } catch (error: any) {
      post.status = "failed";
      post.failure_reason = `Auto-publish failed: ${error.message}`;
      
      const dbIndex = db.posts.findIndex((p: any) => p.id === post.id);
      if (dbIndex !== -1) {
        db.posts[dbIndex] = post;
      }
      
      addLog("error", `Scheduler: Failed to publish "${post.title}": ${error.message}`);
    }
  }

  saveDb(db);
}

// Run the background scheduler every 10 seconds
setInterval(runSchedulerCheck, 10000);


/**
 * SERVER LIFECYCLE & VITE MIDDLEWARE
 */
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    addLog("info", `Server boot completed. Dashboard accessible at port ${PORT}.`);
  });
}

startServer();
