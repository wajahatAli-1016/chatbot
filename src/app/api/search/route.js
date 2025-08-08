// /pages/api/search.js (Next.js 13 Pages Router) or /app/api/search/route.js (App Router)

export async function POST(req) {
  try {
    const { query } = await req.json();
    
    if (!query) {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return Response.json({ 
        error: "Groq API key not configured. Please add GROQ_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    // 1) Retrieve information from multiple public sources (no Serper)
    const clean = (text) =>
      (text || "")
        .replace(/\s+/g, " ")
        .replace(/[\r\n]+/g, " ")
        .trim()
        .slice(0, 500);

    // Detect URLs in the query
    const extractUrls = (text) => {
      const matches = [...(text || "").matchAll(/https?:\/\/[^\s)]+/gi)];
      return Array.from(new Set(matches.map((m) => m[0])));
    };

    // StackOverflow profile (Stack Exchange API)
    const fetchStackOverflowProfile = async (url) => {
      try {
        const u = new URL(url);
        if (!/stackoverflow\.com$/i.test(u.hostname)) return null;
        const m = u.pathname.match(/\/users\/(\d+)/);
        if (!m) return null;
        const userId = m[1];
        const key = process.env.STACKEXCHANGE_KEY; // optional
        const base = "https://api.stackexchange.com/2.3";
        const userRes = await fetch(`${base}/users/${userId}?site=stackoverflow${key ? `&key=${key}` : ""}`);
        if (!userRes.ok) return null;
        const userJson = await userRes.json();
        const user = userJson.items?.[0];
        if (!user) return null;
        const ansRes = await fetch(`${base}/users/${userId}/answers?order=desc&sort=votes&pagesize=5&site=stackoverflow${key ? `&key=${key}` : ""}`);
        const ansJson = ansRes.ok ? await ansRes.json() : { items: [] };
        const answers = ansJson.items || [];
        const ansSummary = answers.map((a, i) => `- Top Answer #${i + 1} (score: ${a.score})`).join("\n");
        const snippet = `Display Name: ${user.display_name}\nReputation: ${user.reputation}\nBadges: gold ${user.badge_counts?.gold || 0}, silver ${user.badge_counts?.silver || 0}, bronze ${user.badge_counts?.bronze || 0}\nLocation: ${user.location || ""}\nTop Answers:\n${ansSummary}`;
        return { source: "StackOverflow", title: `StackOverflow Profile of ${user.display_name}`, snippet: clean(snippet).slice(0, 1200), url };
      } catch { return null; }
    };

    // Twitter/X profile via API v2 if token provided; else fallback
    const fetchTwitterProfile = async (url) => {
      try {
        const u = new URL(url);
        if (!/(?:twitter|x)\.com$/i.test(u.hostname)) return null;
        const parts = u.pathname.split('/').filter(Boolean);
        const username = parts[0];
        if (!username || username.toLowerCase() === 'i' || username.toLowerCase() === 'home') return null;
        const token = process.env.X_BEARER_TOKEN;
        if (!token) return null; // require token for reliable results
        const userRes = await fetch(`https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,description,location,verified`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!userRes.ok) return null;
        const user = (await userRes.json()).data;
        if (!user?.id) return null;
        const tweetsRes = await fetch(`https://api.twitter.com/2/users/${user.id}/tweets?max_results=5&tweet.fields=public_metrics,created_at`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tweetsJson = tweetsRes.ok ? await tweetsRes.json() : { data: [] };
        const tweets = tweetsJson.data || [];
        const tweetLines = tweets.map(t => `- ${new Date(t.created_at).toISOString().slice(0,10)} (${t.public_metrics.like_count || 0}❤): ${clean(t.text)}`).join("\n");
        const snippet = `Name: @${user.username}${user.verified ? " (verified)" : ""}\nBio: ${clean(user.description)}\nLocation: ${user.location || ""}\nFollowers: ${user.public_metrics?.followers_count || 0}, Following: ${user.public_metrics?.following_count || 0}\nRecent Tweets:\n${tweetLines}`;
        return { source: "Twitter", title: `Twitter Profile @${user.username}`, snippet: clean(snippet).slice(0, 1200), url };
      } catch { return null; }
    };

    // Facebook Page/Profile (requires Graph token; best-effort for public pages)
    const fetchFacebookProfile = async (url) => {
      const token = process.env.FB_GRAPH_TOKEN;
      if (!token) return null;
      try {
        const u = new URL(url);
        if (!/facebook\.com$/i.test(u.hostname)) return null;
        const slug = u.pathname.split('/').filter(Boolean)[0];
        if (!slug) return null;
        // Try page lookup by username/ID
        const base = 'https://graph.facebook.com/v19.0';
        const pageRes = await fetch(`${base}/${encodeURIComponent(slug)}?fields=name,about,fan_count,followers_count,link&access_token=${encodeURIComponent(token)}`);
        if (!pageRes.ok) return null;
        const page = await pageRes.json();
        const postsRes = await fetch(`${base}/${encodeURIComponent(slug)}/posts?fields=message,created_time,permalink_url&limit=5&access_token=${encodeURIComponent(token)}`);
        const postsJson = postsRes.ok ? await postsRes.json() : { data: [] };
        const posts = postsJson.data || [];
        const postLines = posts.map(p => `- ${new Date(p.created_time).toISOString().slice(0,10)}: ${clean(p.message)}`).join('\n');
        const snippet = `Name: ${page.name}\nFollowers: ${page.followers_count || page.fan_count || ''}\nAbout: ${clean(page.about)}\nRecent Posts:\n${postLines}`;
        return { source: 'Facebook', title: `Facebook Page ${page.name}`, snippet: clean(snippet).slice(0, 1200), url };
      } catch { return null; }
    };

    const fetchReadableFromUrl = async (rawUrl) => {
      try {
        // Prefer domain-specific handlers
        const so = await fetchStackOverflowProfile(rawUrl); if (so) return so;
        const tw = await fetchTwitterProfile(rawUrl); if (tw) return tw;
        const fb = await fetchFacebookProfile(rawUrl); if (fb) return fb;
        // Fallback readability proxy (works for many public pages)
        const encoded = encodeURIComponent(rawUrl);
        const readerUrl = `https://r.jina.ai/http://${encoded.replace(/^https?:\/\//i, "")}`;
        const res = await fetch(readerUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) return null;
        const text = await res.text();
        const cleaned = clean(text).slice(0, 1200);
        if (!cleaned) return null;
        const host = (() => { try { return new URL(rawUrl).hostname; } catch { return "link"; } })();
        return { source: host, title: `Content from ${host}`, snippet: cleaned, url: rawUrl };
      } catch { return null; }
    };

    const fetchReddit = async () => {
      try {
        const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5&sort=relevance`);
        if (!res.ok) return [];
        const data = await res.json();
        const children = data?.data?.children || [];
        return children.map((c) => {
          const p = c.data || {};
          return {
            source: "Reddit",
            title: p.title,
            snippet: clean(p.selftext || p.title),
            url: p.permalink ? `https://reddit.com${p.permalink}` : p.url,
          };
        });
      } catch {
        return [];
      }
    };

    const fetchHN = async () => {
      try {
        const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`);
        if (!res.ok) return [];
        const data = await res.json();
        const hits = data?.hits || [];
        return hits.map((h) => ({
          source: "Hacker News",
          title: h.title,
          snippet: clean(h.story_text || h.title || h.url),
          url: h.url || (h.objectID ? `https://news.ycombinator.com/item?id=${h.objectID}` : undefined),
        }));
      } catch {
        return [];
      }
    };

    const fetchWikipedia = async () => {
      try {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
        if (!res.ok) return [];
        const data = await res.json();
        const results = data?.query?.search || [];
        return results.slice(0, 5).map((r) => ({
          source: "Wikipedia",
          title: r.title,
          snippet: clean(r.snippet?.replace(/<[^>]+>/g, "")),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
        }));
      } catch {
        return [];
      }
    };

    const fetchYouTube = async () => {
      const key = process.env.YOUTUBE_API_KEY;
      if (!key) return [];
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=5&type=video&key=${key}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        const items = data?.items || [];
        return items.map((it) => ({
          source: "YouTube",
          title: it.snippet?.title,
          snippet: clean(it.snippet?.description),
          url: `https://www.youtube.com/watch?v=${it.id?.videoId}`,
        }));
      } catch {
        return [];
      }
    };

    const fetchNewsApi = async () => {
      const key = process.env.NEWS_API_KEY; // Optional
      if (!key) return [];
      try {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=5&sortBy=publishedAt&language=en`;
        const res = await fetch(url, { headers: { "X-Api-Key": key } });
        if (!res.ok) return [];
        const data = await res.json();
        const arts = data?.articles || [];
        return arts.map((a) => ({
          source: "News",
          title: a.title,
          snippet: clean(a.description || a.content || a.title),
          url: a.url,
        }));
      } catch {
        return [];
      }
    };

    const urlsInQuery = extractUrls(query);
    const directProfiles = (await Promise.all(urlsInQuery.map(fetchReadableFromUrl))).filter(Boolean);

    const [reddit, hn, wiki, yt, news] = await Promise.all([
      fetchReddit(),
      fetchHN(),
      fetchWikipedia(),
      fetchYouTube(),
      fetchNewsApi(),
    ]);

    const allSources = [...directProfiles, ...reddit, ...hn, ...wiki, ...yt, ...news].filter((s) => s.title && s.url);

    // 2) Build a compact, cleaned corpus for the LLM
    const sourcesText = allSources
      .slice(0, 25) // keep prompt compact
      .map((s, i) => `- (${s.source}) ${s.title}\n  ${s.snippet}\n  Link: ${s.url}`)
      .join("\n\n");

    // 3) Ask Groq to synthesize with specific structure
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are a professional research assistant. Read the provided multi-source notes and respond in a concise, well-structured format that is easy to scan. Do not produce any empty or placeholder bullet points. If information is unavailable, omit that bullet rather than writing an empty bullet.",
          },
          {
            role: "user",
            content: `Research Topic: ${query}\n\nYou are given cleaned notes from multiple sources (news, blogs, Reddit, Wikipedia, YouTube).\nUse ONLY the provided notes to answer. If the notes don't contain something, say so.\n\nNotes:\n${sourcesText}\n\nFormat your answer EXACTLY as (use section numbers with a dot, and use dash bullets "- " for items):\n\n1. Detailed Analysis\n- A thorough, well-structured narrative that synthesizes the notes.\n- Use short paragraphs and subheadings if helpful.\n- Where relevant, mention the source names inline (e.g., Reddit/Wikipedia/News).\n\n2. Executive Summary\n- 2 to 4 short bullets that capture the most important takeaways. No empty bullets.\n\n3. Key Facts\n- 5 to 10 concise bullets with numbers, dates, names as available. No empty bullets or placeholders.\n\n4. Social Media Opinions\n- Summarize notable opinions/patterns from social sources. No empty bullets.\n\n5. Source Links\n- Bullet list with title and URL for the top links (e.g., "- Title - URL").\n\nRules:\n- Provide the Detailed Analysis BEFORE the Executive Summary.\n- Never include an item like "1)" or "-" without content.\n- Omit bullets you cannot substantiate from the notes.\n- Do a final pass to remove any empty list items before returning.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });
    
    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error('Groq API Error Details:', errorText);
      
      if (groqRes.status === 401) {
        throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY in .env.local file');
      } else if (groqRes.status === 429) {
        throw new Error('Groq API rate limit exceeded. Please try again later');
      } else {
        throw new Error(`Groq API error (${groqRes.status}): ${errorText}`);
      }
    }

    const groqData = await groqRes.json();
    let analysis = groqData.choices?.[0]?.message?.content || "";

    // 4) Post-process to remove any stray empty bullets/placeholders
    const sanitizeLLMOutput = (text) => {
      const lines = text.split(/\r?\n/);
      const cleaned = lines
        // remove lines that are only numbering or empty bullets
        .filter((l) => !/^\s*(?:-\s*|\d+[\.)]\s*)?$/.test(l.trim()))
        // trim excessive blank lines
        .reduce((acc, l) => {
          if (l.trim() === "" && (acc.length === 0 || acc[acc.length - 1].trim() === "")) {
            return acc; // skip consecutive blanks
          }
          acc.push(l);
          return acc;
        }, [])
        .join("\n");
      return cleaned;
    };

    analysis = sanitizeLLMOutput(analysis);

    return Response.json({
      result: analysis,
      sources: allSources.slice(0, 25),
      counts: {
        reddit: reddit.length,
        hackerNews: hn.length,
        wikipedia: wiki.length,
        youtube: yt.length,
        news: news.length,
        total: allSources.length,
      },
      query,
      timestamp: new Date().toISOString(),
      model: "llama3-70b-8192",
    });

  } catch (error) {
    console.error('Search API Error:', error);
    return Response.json({ 
      error: "Failed to process search request",
      details: error.message 
    }, { status: 500 });
  }
}

