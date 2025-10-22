import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Sparkles,
  User,
  Bot,
  RefreshCw,
  Minimize2,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import {
  chatWithAI,
  getQuickSuggestions,
  formatAIResponse,
} from '../services/aiChatService';
import './AIChat.css';

/**
 * AIChat Component
 * Free AI assistant for salary, tax, and career questions
 */
const AIChat = ({ user, translate, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: translate?.(
        'aiChat.welcome',
        "Hi! I'm your AI career assistant. I can help you with:\n\n• Swiss salary expectations\n• Tax information\n• Job descriptions and career advice\n• Interview preparation\n• Work culture in Switzerland\n\nWhat would you like to know?"
      ),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Load suggestions based on user type
    const userType = user?.type || 'student';
    setSuggestions(getQuickSuggestions(userType));
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText = null) => {
    const text = messageText || input.trim();
    
    if (!text || isLoading) return;

    // Add user message
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert messages to API format
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      conversationHistory.push({
        role: 'user',
        content: text,
      });

      // Get AI response
      const { message: aiResponse, error } = await chatWithAI(conversationHistory);

      if (error) {
        throw new Error(error);
      }

      // Add AI response
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: translate?.(
          'aiChat.error',
          "I'm sorry, I'm having trouble right now. Please try again in a moment."
        ),
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    // Remove emoji and send
    const text = suggestion.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');
    handleSendMessage(text);
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: translate?.(
          'aiChat.welcome',
          "Hi! I'm your AI career assistant. What would you like to know?"
        ),
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Chat Widget */}
      <div className={`ssc__ai-chat ${isOpen ? 'ssc__ai-chat--open' : ''} ${isExpanded ? 'ssc__ai-chat--expanded' : ''}`}>
        {isOpen && (
          <div className="ssc__ai-chat__container">
            {/* Header */}
            <div className="ssc__ai-chat__header">
              <div className="ssc__ai-chat__header-info">
                <div className="ssc__ai-chat__bot-avatar">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3>{translate?.('aiChat.title', 'AI Career Assistant')}</h3>
                  <p className="ssc__ai-chat__status">
                    <span className="ssc__ai-chat__status-dot"></span>
                    {translate?.('aiChat.online', 'Online & Free')}
                  </p>
                </div>
              </div>
              
              <div className="ssc__ai-chat__header-actions">
                <button
                  type="button"
                  className="ssc__ai-chat__header-btn"
                  onClick={handleReset}
                  title={translate?.('aiChat.reset', 'New conversation')}
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  type="button"
                  className="ssc__ai-chat__header-btn"
                  onClick={toggleExpand}
                  title={translate?.('aiChat.expand', 'Expand')}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  className="ssc__ai-chat__header-btn"
                  onClick={toggleChat}
                  title={translate?.('aiChat.close', 'Close')}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="ssc__ai-chat__messages">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`ssc__ai-chat__message ssc__ai-chat__message--${message.role} ${
                    message.isError ? 'ssc__ai-chat__message--error' : ''
                  }`}
                >
                  <div className="ssc__ai-chat__message-avatar">
                    {message.role === 'user' ? (
                      <User size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>
                  <div className="ssc__ai-chat__message-content">
                    <div
                      className="ssc__ai-chat__message-text"
                      dangerouslySetInnerHTML={{
                        __html: formatAIResponse(message.content),
                      }}
                    />
                    <div className="ssc__ai-chat__message-time">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="ssc__ai-chat__message ssc__ai-chat__message--assistant">
                  <div className="ssc__ai-chat__message-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="ssc__ai-chat__message-content">
                    <div className="ssc__ai-chat__typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length <= 2 && suggestions.length > 0 && (
              <div className="ssc__ai-chat__suggestions">
                <p className="ssc__ai-chat__suggestions-title">
                  {translate?.('aiChat.tryAsking', 'Try asking:')}
                </p>
                <div className="ssc__ai-chat__suggestions-grid">
                  {suggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="ssc__ai-chat__suggestion-btn"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="ssc__ai-chat__input-container">
              <textarea
                ref={inputRef}
                className="ssc__ai-chat__input"
                placeholder={translate?.('aiChat.placeholder', 'Ask me anything...')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                rows={1}
              />
              <button
                type="button"
                className="ssc__ai-chat__send-btn"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} />
              </button>
            </div>

            {/* Footer */}
            <div className="ssc__ai-chat__footer">
              <Sparkles size={12} />
              {translate?.('aiChat.footer', 'AI-powered • Free for all users')}
            </div>
          </div>
        )}
      </div>

      {/* Floating Button */}
      {!isOpen && (
        <button
          type="button"
          className="ssc__ai-chat__fab"
          onClick={toggleChat}
          title={translate?.('aiChat.open', 'Ask AI Assistant')}
        >
          <MessageCircle size={24} />
          <span className="ssc__ai-chat__fab-badge">
            <Sparkles size={12} />
          </span>
        </button>
      )}
    </>
  );
};

export default AIChat;

