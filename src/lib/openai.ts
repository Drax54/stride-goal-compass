import OpenAI from 'openai';

// Use either the environment variable or the hardcoded API key for development
// const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const API_KEY = "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"


if (!API_KEY) {
  const errorMessage = "CRITICAL ERROR: VITE_OPENAI_API_KEY is not set. The application will not be able to generate habits using OpenAI. Please ensure this environment variable is configured.";
  console.error(errorMessage);
  // In a real application, you might want to throw an error here
  // or display a more user-friendly message in the UI.
  // For now, logging to console and allowing fallback mechanisms to take over.
  // throw new Error(errorMessage); 
} else {
  console.log("🔑 OpenAI API Key is available.");
}

const openai = new OpenAI({
  apiKey: API_KEY, // Will be undefined if not set, leading to OpenAI client errors
  dangerouslyAllowBrowser: true
});

export interface GeneratedHabit {
  name: string;
  description: string;
  icon?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
}

export async function generateHabitsForGoal(goalName: string): Promise<GeneratedHabit[]> {
  console.log(`🧠 Generating habits for goal: "${goalName}"`);
  if (!API_KEY) {
    console.warn(`🧠 OpenAI API Key not available. Skipping OpenAI call for goal "${goalName}". Returning fallback habits.`);
    // Return fallback habits directly if API key is missing
    return [
      {
        name: `Daily progress on ${goalName}`,
        description: `Track your daily progress towards ${goalName}`,
        icon: "📊",
        frequency: "daily"
      },
      {
        name: `Weekly reflection on ${goalName}`,
        description: `Reflect on your weekly progress towards ${goalName}`,
        icon: "🤔",
        frequency: "weekly"
      }
    ];
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a habit formation expert. Generate 2 specific, actionable daily habits that will help achieve a given goal. Each habit should have a name, description, and a relevant emoji icon."
        },
        {
          role: "user",
          content: `Generate 2 daily habits for the goal: "${goalName}". 
          Format the response as a JSON array with objects containing:
          - name: short, action-oriented habit name
          - description: one-line description explaining how this habit helps achieve the goal
          - icon: a single relevant emoji
          - frequency: either "daily", "weekly", or "monthly"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error('🧠 No content received from OpenAI');
      throw new Error('No content received from OpenAI');
    }

    console.log(`🧠 Received OpenAI response for "${goalName}"`, content);
    
    try {
      const result = JSON.parse(content);
      console.log(`🧠 Successfully parsed habits for "${goalName}"`, result);
      return result.habits || [];
    } catch (parseError) {
      console.error('🧠 Error parsing OpenAI response:', parseError, 'Raw content:', content);
      throw new Error('Failed to parse OpenAI response');
    }
  } catch (error: unknown) {
    console.error('🧠 Error generating habits:', error);
    
    // Provide detailed error information
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response: { status: number; data: unknown } };
      console.error(`🧠 OpenAI API error - Status: ${apiError.response.status}`);
      console.error('🧠 Response data:', apiError.response.data);
    } else if (error instanceof Error) {
      console.error('🧠 Error message:', error.message);
    }
    
    // Return fallback habits instead of throwing
    return [
      {
        name: `Daily progress on ${goalName}`,
        description: `Track your daily progress towards ${goalName}`,
        icon: "📊",
        frequency: "daily"
      },
      {
        name: `Weekly reflection on ${goalName}`,
        description: `Reflect on your weekly progress towards ${goalName}`,
        icon: "🤔",
        frequency: "weekly"
      }
    ];
  }
} 