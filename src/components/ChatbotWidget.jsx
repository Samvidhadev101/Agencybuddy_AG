import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', text: "Hi there! I'm your Agency Buddy Assistant. How can I help you manage your agency operations today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { id: Math.random().toString(), text: userMsg, isUser: true }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(r => setTimeout(r, 1200));

    // 1. Search knowledge base in local storage
    const kb = JSON.parse(localStorage.getItem('db_knowledge_base_articles') || '[]');
    const matchingArticle = kb.find(art => 
      userMsg.toLowerCase().includes(art.title.toLowerCase()) || 
      art.tags.some(tag => userMsg.toLowerCase().includes(tag.toLowerCase())) ||
      art.body.toLowerCase().includes(userMsg.toLowerCase())
    );

    let replyText = '';
    if (matchingArticle) {
      replyText = `I found a relevant article in our Help Center: **${matchingArticle.title}**\n\n${matchingArticle.body}\n\nHope this helps!`;
    } else {
      // Gemini mock fallback
      if (userMsg.toLowerCase().includes('token') || userMsg.toLowerCase().includes('billing')) {
        replyText = "To manage tokens or upgrade your subscription, please navigate to the **Billing & Plans** tab in the sidebar. You can purchase token packs (100, 200, or 500) which are instantly credited to your balance via Razorpay.";
      } else if (userMsg.toLowerCase().includes('client')) {
        replyText = "Clients can be managed from the **Clients List** page. You can add new clients, update their integrations, assign team members, and view aggregated SEO/Reputation overview cards.";
      } else if (userMsg.toLowerCase().includes('geo') || userMsg.toLowerCase().includes('fence')) {
        replyText = "In the **Geo-fencing** module, you can draw virtual boundaries on a Leaflet map. Enter triggers push SMS messages to customers dwelling in the zone.";
      } else {
        replyText = "I understand you're asking about that. You can configure active clients in the Topbar, or run automated audits inside the SEO/GBP modules. Let me know if you would like me to link you to the Help Center documentation.";
      }
    }

    setIsTyping(false);
    setMessages(prev => [
      ...prev, 
      { 
        id: Math.random().toString(), 
        text: replyText, 
        isUser: false,
        showFeedback: true 
      }
    ]);
  };

  const handleFeedback = (msgId, isPositive) => {
    setMessages(prev => 
      prev.map(m => m.id === msgId ? { ...m, showFeedback: false, feedbackGiven: isPositive ? 'yes' : 'no' } : m)
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-primary-cyan text-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-primary-cyan-hover transition-transform duration-200 hover:scale-105"
        >
          <MessageSquare size={22} />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[380px] h-[480px] bg-panel-white border border-border-light rounded-lg shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="h-12 bg-panel-white border-b border-border-light flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success-green"></span>
              <span className="font-semibold text-text-primary text-sm">OS Assistant</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-page-bg/40 scrollbar-thin">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[80%] ${msg.isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div 
                  className={`p-3 rounded text-xs leading-relaxed whitespace-pre-line ${
                    msg.isUser 
                      ? 'bg-panel-white text-text-primary border border-border-light' 
                      : 'bg-[#F0FDFA] text-text-primary border border-[#06B6D41A]'
                  }`}
                >
                  {msg.text}
                </div>
                
                {/* Feedback prompt */}
                {!msg.isUser && msg.showFeedback && (
                  <div className="flex items-center gap-2 mt-1.5 px-1">
                    <span className="text-[10px] text-text-muted">Was this helpful?</span>
                    <button 
                      onClick={() => handleFeedback(msg.id, true)}
                      className="p-1 hover:bg-panel-white rounded text-text-secondary hover:text-success-green transition-colors cursor-pointer"
                    >
                      <ThumbsUp size={10} />
                    </button>
                    <button 
                      onClick={() => handleFeedback(msg.id, false)}
                      className="p-1 hover:bg-panel-white rounded text-text-secondary hover:text-error-red transition-colors cursor-pointer"
                    >
                      <ThumbsDown size={10} />
                    </button>
                  </div>
                )}

                {!msg.isUser && msg.feedbackGiven && (
                  <span className="text-[9px] text-text-muted mt-1 px-1 font-mono uppercase">
                    Feedback logged: {msg.feedbackGiven}
                  </span>
                )}
              </div>
            ))}
            
            {/* Typing Loader Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1 bg-[#F0FDFA] border border-[#06B6D41A] p-3 rounded max-w-[40%] mr-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-cyan animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-cyan animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-cyan animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={handleSendMessage}
            className="h-14 border-t border-border-light bg-panel-white flex items-center px-3 gap-2 shrink-0"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 h-9 border border-border-light rounded px-3 text-xs focus:outline-none focus:border-primary-cyan"
            />
            <button 
              type="submit"
              className="w-9 h-9 flex items-center justify-center rounded bg-primary-cyan text-white hover:bg-primary-cyan-hover transition-colors cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
