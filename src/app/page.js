"use client"
import { useState, useRef } from "react";
import styles from "./page.module.css"
import { FaArrowUp, FaSearch, FaNewspaper, FaGlobe, FaReddit, FaDownload } from "react-icons/fa";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const resultRef = useRef(null);
  const messageRefs = useRef({});

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setError(""); // Clear error when user starts typing
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const question = inputValue.trim();
    setIsLoading(true);
    setError("");
    setInputValue("");

    // Add user question to chat history immediately
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to search");
      }

      // Add AI response to chat history
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.result,
        model: data.model,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, aiMessage]);
      
      // Add to search history
      setSearchHistory(prev => [
        { query: question, timestamp: new Date(), result: data.result },
        ...prev.slice(0, 4) // Keep only last 5 searches
      ]);

    } catch (err) {
      setError(err.message);
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatResult = (text) => {
    if (!text) return "";
    
    // Split by numbered sections and format
    const sections = text.split(/(?=\d+\.)/);
    return sections.map((section, index) => {
      if (index === 0) return section; // First section (before any number)
      
      const lines = section.split('\n');
      const title = lines[0];
      const content = lines.slice(1).join('\n');
      const isDetailed = title?.toLowerCase().includes('detailed analysis');
      
      return (
        <div key={index} className={isDetailed ? styles.sectionPlain : styles.section}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          <div className={styles.sectionContent}>
            {content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      );
    });
  };

  // Capture the exact rendered AI message DOM as a PDF
  const downloadMessageAsPDF = async (messageId) => {
    const node = messageRefs.current[messageId];
    if (!node) return;

    setIsDownloading(true);
    // Hide download buttons inside the node before capture
    const buttons = node.querySelectorAll('[title="Download as PDF"]');
    const prevVisibility = [];
    buttons.forEach((b, i) => { prevVisibility[i] = b.style.visibility; b.style.visibility = 'hidden'; });

    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
      });

      // Restore button visibility
      buttons.forEach((b, i) => { b.style.visibility = prevVisibility[i] || ''; });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      pdf.save(`ai-message-${timestamp}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔍 AI Research Assistant</h1>
      </div>

      {chatHistory.length > 0 && (
        <div className={styles.chatContainer}>
          {chatHistory.map((message, index) => (
            <div key={message.id} className={styles.chatMessage}>
              <div className={styles.messageAvatar}>
                <div className={message.type === 'user' ? styles.userAvatar : styles.aiAvatar}>
                  {message.type === 'user' ? '👤' : '🤖'}
                </div>
              </div>
              <div 
                className={styles.messageContent}
                ref={(el) => {
                  if (message.type === 'ai' && el) {
                    messageRefs.current[message.id] = el;
                    if (index === chatHistory.length - 1) {
                      resultRef.current = el;
                    }
                  }
                }}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageAuthor}>
                    {message.type === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                  <span className={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.type === 'ai' && message.model && (
                    <span className={styles.modelInfo}>Powered by {message.model}</span>
                  )}
                  {message.type === 'ai' && (
                    <button 
                      onClick={() => downloadMessageAsPDF(message.id)}
                      disabled={isDownloading}
                      className={`${styles.downloadButton} ${isDownloading ? styles.loading : ''}`}
                      title="Download as PDF"
                    >
                      {isDownloading ? (
                        <div className={styles.spinner}></div>
                      ) : (
                        <FaDownload />
                      )}
                    </button>
                  )}
                </div>
                <div className={styles.messageText}>
                  {message.type === 'user' ? (
                    message.content
                  ) : (
                    <div>
                      {formatResult(message.content)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.searchContainer}>
        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <div className={styles.inputWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Ask anything" 
              className={styles.searchInput} 
              value={inputValue} 
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className={`${styles.searchButton} ${isLoading ? styles.loading : ''}`} 
            disabled={inputValue.length === 0 || isLoading}
          >
            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              <FaArrowUp />
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>❌ {error}</p>
        </div>
      )}

      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>🔍 Searching across multiple sources...</p>
          <p className={styles.loadingSubtext}>This may take a few moments</p>
        </div>
      )}

     
    </div>
  )
}
