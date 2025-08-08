// Configuration example for AI Research Assistant
// Copy this file to config.js and fill in your actual API keys

export const config = {
  // API Keys - Get these from the respective services
  apiKeys: {
    // Serper API - Web search service
    // Get from: https://serper.dev
    serper: 'your_serper_api_key_here',
    
    // Groq API - AI analysis service
    // Get from: https://groq.com
    groq: 'your_groq_api_key_here'
  },
  
  // Search Configuration
  search: {
    // Number of results to fetch from each source
    webResults: 10,
    newsResults: 5,
    redditResults: 5,
    
    // Search parameters
    language: 'en',
    country: 'us',
    
    // AI model configuration
    model: 'mixtral-8x7b-32768',
    temperature: 0.3,
    maxTokens: 2000
  },
  
  // UI Configuration
  ui: {
    // Number of recent searches to keep
    maxHistoryItems: 5,
    
    // Loading timeout (in milliseconds)
    loadingTimeout: 30000,
    
    // Animation duration
    animationDuration: 300
  }
};

// Usage in your .env.local file:
// SERPER_API_KEY=your_actual_serper_key
// GROQ_API_KEY=your_actual_groq_key
