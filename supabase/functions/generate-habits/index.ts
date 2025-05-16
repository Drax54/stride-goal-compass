import OpenAI from 'npm:openai@4.28.0';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { goals } = await req.json();

    const prompt = `Generate a list of specific, actionable daily or weekly habits that would help achieve these goals: ${goals.join(', ')}. 
    For each goal, provide exactly 2 habits that are:
    1. Specific and measurable
    2. Realistic to maintain
    3. Directly related to the goal
    Format the response as a JSON array of objects with this structure:
    {
      "habits": [
        {
          "goal": "goal name",
          "habits": [
            {
              "name": "habit name",
              "description": "brief description",
              "frequency": "daily or weekly",
              "icon": "emoji representing the habit"
            }
          ]
        }
      ]
    }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a habit formation and goal achievement expert. Provide specific, actionable habits that lead to goal success.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    const habits = JSON.parse(completion.choices[0].message.content);

    return new Response(
      JSON.stringify(habits),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});