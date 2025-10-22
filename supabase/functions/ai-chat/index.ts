// Supabase Edge Function: ai-chat
// Handles AI chat requests securely (keeps API key on server)
// Deploy with: supabase functions deploy ai-chat

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get OpenAI API key from environment
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get request body
    const { messages, options = {} } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
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
      throw new Error(data.error?.message || 'OpenAI API request failed');
    }

    // Return response
    return new Response(
      JSON.stringify({
        message: data.choices[0].message.content,
        usage: data.usage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

