# 🔍 AI Research Assistant

A comprehensive AI-powered research assistant that searches across multiple sources including news websites, social media platforms, blogs, and Reddit to provide detailed, well-structured research responses.

## ✨ Features

- **Multi-Source Search**: Searches across web, news, and social media platforms
- **Comprehensive Analysis**: AI-powered analysis with structured responses
- **Source Attribution**: Clear links to all sources used in research
- **Real-time Results**: Fast search and analysis with loading states
- **Search History**: Track your recent research queries
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: Robust error handling and user feedback

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for external services

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Serper API Key (for web search)
   SERPER_API_KEY=your_serper_api_key_here
   
   # Groq API Key (for AI analysis)
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 API Keys Setup

### Serper API (Web Search)
1. Visit [serper.dev](https://serper.dev)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env.local` file

### Groq API (AI Analysis)
1. Visit [groq.com](https://groq.com)
2. Create an account
3. Get your API key from the console
4. Add it to your `.env.local` file

## 📋 Usage

1. **Enter your research question** in the search bar
   - Examples: "latest developments in AI", "climate change news", "crypto market trends"

2. **Click the search button** or press Enter

3. **Wait for analysis** - The system will:
   - Search multiple sources simultaneously
   - Collect and analyze information
   - Generate a comprehensive response

4. **Review results** including:
   - Executive summary
   - Key facts and findings
   - Social media opinions
   - News coverage
   - Source links

## 🏗️ Architecture

### Frontend
- **Next.js 15** with App Router
- **React 19** with modern hooks
- **CSS Modules** for styling
- **React Icons** for UI elements

### Backend
- **Next.js API Routes** for serverless functions
- **Serper API** for web search
- **Groq API** for AI analysis
- **Error handling** and response formatting

### Search Sources
- **General Web Search**: Broad internet search
- **News Search**: Recent news articles
- **Reddit Search**: Social media discussions
- **Blog Search**: Blog posts and articles

## 🎨 Customization

### Styling
Modify `src/app/page.module.css` to customize the appearance:
- Color scheme
- Layout spacing
- Typography
- Responsive breakpoints

### Search Sources
Edit `src/app/api/search/route.js` to:
- Add new search sources
- Modify search parameters
- Change AI analysis prompts

### AI Analysis
Customize the AI system prompt in the API route to:
- Change response structure
- Modify analysis depth
- Adjust tone and style

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Project Structure

```
ai-assistant/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── search/
│   │   │       └── route.js          # Search API endpoint
│   │   ├── globals.css               # Global styles
│   │   ├── layout.js                 # Root layout
│   │   ├── page.js                   # Main page component
│   │   └── page.module.css           # Page-specific styles
│   └── ...
├── public/                           # Static assets
├── package.json                      # Dependencies
└── README.md                         # This file
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your API keys are correct
3. Ensure all dependencies are installed
4. Check the network tab for API call failures

## 🔮 Future Enhancements

- [ ] Add more search sources (Twitter, LinkedIn, etc.)
- [ ] Implement search filters and categories
- [ ] Add export functionality (PDF, Word)
- [ ] Create user accounts and saved searches
- [ ] Add advanced search operators
- [ ] Implement search result caching
- [ ] Add multi-language support

---

**Built with ❤️ using Next.js, React, and modern web technologies**
