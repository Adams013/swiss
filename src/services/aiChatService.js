/**
 * AI Chat Service
 * Handles AI-powered chat for salary, tax, and job advice
 * 
 * Setup:
 * 1. Add REACT_APP_OPENAI_API_KEY to .env.local
 * 2. Or use Supabase Edge Function for secure API calls
 */

import { supabase } from '../supabaseClient';
import { BRAND_NAME } from '../config/branding';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * System prompt for the AI assistant
 */
const SYSTEM_PROMPT = `You are a helpful career assistant for ${BRAND_NAME}, a job platform connecting students with Swiss startups.

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
    const canUseEdgeFunction = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

    if (canUseEdgeFunction) {
      return await chatViaEdgeFunction(messages, options);
    }

    if (IS_PRODUCTION) {
      throw new Error(
        'Direct OpenAI access is disabled in production. Configure the Supabase Edge Function instead.'
      );
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
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase Edge Function is not fully configured');
    }

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
const parseInlineSegments = (value) => {
  const text = typeof value === 'string' ? value : value == null ? '' : String(value);
  const segments = [];
  const pattern = /(\*\*|\*)([^*]+?)\1/;
  let remaining = text;

  while (remaining.length) {
    const match = remaining.match(pattern);

    if (!match) {
      segments.push({ type: 'text', content: remaining });
      break;
    }

    const [matchedText, marker, content] = match;
    const matchIndex = match.index ?? 0;

    if (matchIndex > 0) {
      segments.push({ type: 'text', content: remaining.slice(0, matchIndex) });
    }

    segments.push({
      type: marker === '**' ? 'strong' : 'em',
      content,
    });

    remaining = remaining.slice(matchIndex + matchedText.length);
  }

  if (!segments.length) {
    return [{ type: 'text', content: '' }];
  }

  return segments;
};

export const formatAIResponse = (text) => {
  const input = typeof text === 'string' ? text : text == null ? '' : String(text);
  const blocks = [];
  let currentList = null;
  let currentParagraph = null;

  const flushList = () => {
    if (currentList) {
      blocks.push({ type: 'list', items: currentList });
      currentList = null;
    }
  };

  const flushParagraph = () => {
    if (currentParagraph) {
      blocks.push({ type: 'paragraph', content: currentParagraph });
      currentParagraph = null;
    }
  };

  const lines = input.split(/\r?\n/);

  lines.forEach((rawLine) => {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      flushParagraph();
      return;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      flushParagraph();
      if (!currentList) {
        currentList = [];
      }

      const itemText = trimmed.replace(/^[-*•]\s+/, '');
      currentList.push(parseInlineSegments(itemText));
      return;
    }

    flushList();
    if (!currentParagraph) {
      currentParagraph = [];
    } else {
      currentParagraph.push({ type: 'br' });
    }

    currentParagraph.push(...parseInlineSegments(trimmed));
  });

  flushList();
  flushParagraph();

  if (!blocks.length) {
    return [{ type: 'paragraph', content: [{ type: 'text', content: '' }] }];
  }

  return blocks;
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

