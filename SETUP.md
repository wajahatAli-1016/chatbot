# 🔧 Setup Guide - Groq API Only

## The Problem
You're getting a **401 Unauthorized error** from the Groq API, which means your Groq API key is not properly configured.

## Solution

### Step 1: Create Environment File
Create a file named `.env.local` in the root directory of your project (`ai-assistant/.env.local`) with the following content:

```env
# Groq API Key - Get from https://groq.com  
GROQ_API_KEY=your_actual_groq_api_key_here
```

### Step 2: Get Your Groq API Key

#### 🤖 Groq API Key (for AI research and analysis)
1. Go to [groq.com](https://groq.com)
2. Create an account
3. Get your API key from the console
4. Replace `your_actual_groq_api_key_here` with your real key

### Step 3: Restart Your Development Server
After creating the `.env.local` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 4: Test Your Setup
Try searching for something simple like "latest news" to test if everything works.

**Note**: The application uses Groq's `llama3-70b-8192` model, which is currently supported and provides excellent research capabilities.

## Common Issues

### ❌ "API key not configured" error
- Make sure you created `.env.local` (not `.env`)
- Make sure the file is in the root directory (`ai-assistant/.env.local`)
- Make sure you restarted the development server

### ❌ "Invalid API key" error
- Double-check your Groq API key is correct
- Make sure there are no extra spaces or characters
- Verify your API key is active in the Groq console

### ❌ "Rate limit exceeded" error
- Wait a few minutes and try again
- Check your API usage limits in the dashboards

## File Structure
Your project should look like this:
```
ai-assistant/
├── .env.local          ← Create this file
├── src/
├── package.json
└── ...
```

## Need Help?
If you're still having issues:
1. Check the browser console for detailed error messages
2. Verify your API keys work by testing them directly
3. Make sure you're using the correct API endpoints

---
**Remember**: Never commit your `.env.local` file to version control - it contains sensitive API keys!
