/**
 * AI Chat Service
 * Handles AI-powered chat for salary, tax, and job advice
 * 
 * Setup:
 * 1. Add REACT_APP_OPENAI_API_KEY to .env.local
 * 2. Or use Supabase Edge Function for secure API calls
 */

import { supabase } from '../supabaseClient';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * System prompt for the AI assistant
 */
const SYSTEM_PROMPT = `You are a helpful career assistant for Swiss Startup Connect, a job platform connecting students with Swiss startups.

Your expertise includes:
- Swiss salary expectations and ranges for different roles
- Swiss tax system and deductions
- Job descriptions and career advice
- Interview preparation tips
- Swiss work culture and expectations
- Startup equity and compensation
- Visa and work permit information for Switzerland

Guidelines:
- Be professional, friendly, and concise
- Provide specific salary ranges in CHF when asked
- Explain Swiss tax rates (federal, cantonal, communal)
- Give practical, actionable advice
- Mention that salaries vary by canton and city
- Reference Swiss-specific information (13th month salary, vacation days, etc.)
- If you don't know something, be honest and suggest resources
- Keep responses under 300 words unless more detail is requested

Swiss Salary Ranges (2024, approximate):
- Junior Software Engineer: 75,000 - 95,000 CHF
- Mid-level Software Engineer: 95,000 - 120,000 CHF
- Senior Software Engineer: 120,000 - 160,000 CHF
- Product Manager: 90,000 - 130,000 CHF
- UX/UI Designer: 70,000 - 100,000 CHF
- Data Scientist: 85,000 - 130,000 CHF
- Marketing Manager: 80,000 - 110,000 CHF

Swiss Tax Info:
- Federal tax: Progressive, 0-11.5%
- Cantonal/Communal tax: Varies widely (Zug ~15%, Geneva ~25%)
- Social security: ~6.4% (AHV/IV/EO)
- Unemployment insurance: ~1.1%
- Average total tax burden: 20-35% depending on canton and income`;

/**
 * Chat with AI using OpenAI API (client-side - for development only)
 * For production, use Edge Function to keep API key secure
 */
export const chatWithAI = async (messages, options = {}) => {
  try {
    // Use Edge Function for production (recommended)
    if (SUPABASE_URL && !OPENAI_API_KEY) {
      return await chatViaEdgeFunction(messages, options);
    }

    // Direct OpenAI call (development only - exposes API key)
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini', // Cost-effective model
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'AI request failed');
    }

    return {
      message: data.choices[0].message.content,
      usage: data.usage,
      error: null,
    };
  } catch (error) {
    console.error('AI Chat error:', error);
    return {
      message: null,
      error: error.message,
    };
  }
};

/**
 * Chat via Supabase Edge Function (recommended for production)
 */
const chatViaEdgeFunction = async (messages, options = {}) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        messages,
        options,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'AI chat request failed');
    }

    return {
      message: data.message,
      usage: data.usage,
      error: null,
    };
  } catch (error) {
    console.error('AI Chat via Edge Function error:', error);
    return {
      message: null,
      error: error.message,
    };
  }
};

/**
 * Save chat conversation to database
 */
export const saveChatConversation = async (userId, conversation, topic = null) => {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        messages: conversation,
        topic,
      })
      .select()
      .single();

    if (error) throw error;

    return { conversation: data, error: null };
  } catch (error) {
    console.error('Error saving conversation:', error);
    return { conversation: null, error };
  }
};

/**
 * Get chat history for user
 */
export const getChatHistory = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { conversations: data || [], error: null };
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return { conversations: [], error };
  }
};

/**
 * Generate quick suggestions based on context
 */
export const getQuickSuggestions = (userType = 'student') => {
  const studentSuggestions = [
    '💰 What salary should I expect as a junior developer in Zurich?',
    '📊 How much tax will I pay in Switzerland?',
    '📝 How do I write a good cover letter for Swiss startups?',
    '🎯 What are the most in-demand skills in Swiss tech?',
    '🏠 What is the cost of living in Zurich vs Geneva?',
    '💼 How does equity work in Swiss startups?',
  ];

  const employerSuggestions = [
    '💰 What is the market rate for a senior engineer in Zurich?',
    '📊 What benefits do Swiss employees expect?',
    '📝 How do I write an attractive job description?',
    '🎯 What perks attract top talent in Switzerland?',
    '🌍 How do I hire international talent in Switzerland?',
    '💼 What is a competitive equity package?',
  ];

  return userType === 'employer' ? employerSuggestions : studentSuggestions;
};

/**
 * Detect if message is asking about salary
 */
export const isSalaryQuestion = (message) => {
  const salaryKeywords = [
    'salary', 'salaire', 'gehalt', 'pay', 'compensation',
    'wage', 'income', 'earning', 'chf', 'how much',
  ];
  return salaryKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
};

/**
 * Detect if message is asking about tax
 */
export const isTaxQuestion = (message) => {
  const taxKeywords = [
    'tax', 'taxe', 'steuer', 'deduction', 'net salary',
    'take home', 'ahv', 'social security',
  ];
  return taxKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
};

/**
 * Format AI response with markdown-like styling
 */
export const formatAIResponse = (text) => {
  // Convert **bold** to <strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert line breaks
  text = text.replace(/\n/g, '<br>');
  
  // Convert bullet points
  text = text.replace(/^- (.+)/gm, '• $1');
  
  return text;
};

export default {
  chatWithAI,
  saveChatConversation,
  getChatHistory,
  getQuickSuggestions,
  isSalaryQuestion,
  isTaxQuestion,
  formatAIResponse,
};

