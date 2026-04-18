import { getVertexClient } from './firebase';

async function callGemini(prompt: string, systemInstruction: string): Promise<string> {
  const ai = await getVertexClient();
  if (!ai) throw new Error("Firebase AI is not configured.");

  const { getGenerativeModel } = await import('firebase/ai');
  const model = getGenerativeModel(ai, { 
    model: "gemini-2.5-flash",
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }]
    }
  });

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  
  if (!text) throw new Error("Empty response from AI");
  
  return text.replace(/^"|"$|`/g, '').trim();
}

export async function generateFearQuote(data: {
  fear_type: string;
  user_name?: string;
  context?: string;
}): Promise<{ quote: string }> {
  try {
    const system = "You are Kinu, a concise, highly intelligent AI financial mentor. You speak with calm authority, empathy, and absolute clarity. The user is experiencing a specific financial fear (e.g. loss, jargon, scam, trust). Output ONLY a single, highly punchy, empowering quote (1 to 2 sentences max) to directly address this fear. Do not use quotes, hashtags, emojis, or introductory text.";
    const prompt = `
      User Name: ${data.user_name || 'Friend'}
      Core Fear Type: ${data.fear_type}
      Current Context/Action: ${data.context || 'General inquiry'}
      
      Generate a powerful, personalized mentor quote for this user navigating this exact context.
    `;

    const quote = await callGemini(prompt, system);
    return { quote };
  } catch {
    const fallbacks: Record<string, string> = {
      loss: "Market downturns are not losses. They are discounts waiting to be seized.",
      scam: "Skepticism is your armor. Trust only the math, never the promise.",
      jargon: "Complexity is a disguise for high fees. True wealth is built on simple principles.",
      trust: "Nobody cares more about your money than you do. Own your independence."
    };
    return { quote: fallbacks[data.fear_type] || "Take a deep breath. You are in control of your financial destiny." };
  }
}

export async function generateKinuChat(data: {
  message: string;
  fear_type: string;
  context?: string;
  conversation_history: { role: string; content: string }[];
}): Promise<{ reply: string }> {
  try {
    const system = "You are Kinu, a concise AI financial mentor inside the Kinetic City app. You speak with calm authority, empathy, and absolute clarity. The user's core investing fear is: " + data.fear_type + ". Address them directly but keep responses short (2-4 sentences). Do not use markdown headers, hash tags, or emojis. Never overwhelm them with jargon.";
    
    const historyBlock = data.conversation_history.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Kinu'}: ${msg.content}`
    ).join('\n\n');

    let prompt = `Current Context: ${data.context || 'General Chat'}\n\n`;
    if (historyBlock) prompt += `Conversation History:\n${historyBlock}\n\n`;
    prompt += `User: ${data.message}\nKinu:`;

    const reply = await callGemini(prompt, system);
    return { reply };
  } catch {
    return { reply: "I'm currently operating in offline core-mode due to an API quota limit in your region. But remember: mastering your mindset is 90% of investing. What's the biggest investing fear you want to discuss?" };
  }
}
