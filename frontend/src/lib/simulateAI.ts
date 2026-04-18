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

const SYSTEM_INSTRUCTION_OBJECTIVE = "You are an objective, sophisticated financial simulation analyzer. Analyze the inputs from the user's simulation and provide a sharp, data-driven debrief (1-2 paragraphs max). Do not use markdown headers or emojis. Keep it direct and strictly focused on what the mathematical numbers dictate relative to the user's fear profile.";

export async function generateSandboxDebrief(data: {
  year: string;
  allocation: { nifty: number; midcap: number; smallcap: number; debt: number };
  final_values: { nifty: number; midcap: number; smallcap: number; debt: number };
  did_pull_out: boolean;
  pulled_out_month?: number | null;
  fear_type: string;
}): Promise<{ debrief: string }> {
  try {
    const prompt = `
      Simulation Log: Time Machine (Year: ${data.year})
      User Core Fear Index: ${data.fear_type}
      Action Taken: ${data.did_pull_out ? 'Panic sold during month ' + data.pulled_out_month : 'Held the portfolio despite volatility.'}
      Allocation: ${JSON.stringify(data.allocation)}
      Final Growth Result: ${JSON.stringify(data.final_values)}
      
      Generate a sharp debrief explaining the consequences of their action relative to what historically happened in ${data.year}.
    `;
    const debrief = await callGemini(prompt, SYSTEM_INSTRUCTION_OBJECTIVE);
    return { debrief };
  } catch {
    return { debrief: data.did_pull_out 
      ? "By exiting the market out of fear, you locked in your losses and completely missed the recovery. Volatility is the price of admission for long-term growth."
      : "You held your ground. The mathematics of recovery heavily favor those who simply do nothing during a panic." 
    };
  }
}

export async function generateSandboxAdvice(data: {
  year: string;
  user_allocation: { nifty: number; midcap: number; smallcap: number; debt: number };
  optimal_allocation: { nifty: number; midcap: number; smallcap: number; debt: number };
  user_result: number;
  optimal_result: number;
  total_invested: number;
  fear_type: string;
  did_pull_out: boolean;
}): Promise<{ advice: string }> {
  try {
    const prompt = `
      Analyze this outcome for a user prone to '${data.fear_type}':
      Invested: ${data.total_invested}. Their result: ${data.user_result}. Optimal result: ${data.optimal_result}.
      Did they panic sell? ${data.did_pull_out}.
      Provide a comparative piece of advice.
    `;
    const advice = await callGemini(prompt, "You are a quantitative portfolio strategist. Keep responses to exactly two crisp sentences.");
    return { advice };
  } catch {
    return { advice: "Compare your result to the optimal portfolio to understand the exact cost of your decision." };
  }
}

export async function generateInstinctDebrief(data: {
  start_year: number;
  monthly_amount: number;
  did_withdraw: boolean;
  withdraw_month?: number | null;
  fear_type: string;
  final_value: number;
  total_invested: number;
}): Promise<{ debrief: string }> {
  try {
    const prompt = `
      Simulation: Instinct SIP Simulator
      User Fear: ${data.fear_type}
      They invested ${data.monthly_amount} monthly starting ${data.start_year}. Total invested: ${data.total_invested}. Final portfolio value: ${data.final_value}.
      Did they halt their SIP out of panic? ${data.did_withdraw ? 'Yes, at month ' + data.withdraw_month : 'No, they stayed committed.'}
      Write a sharp debrief on how their psychology impacted their final mathematical returns.
    `;
    const debrief = await callGemini(prompt, SYSTEM_INSTRUCTION_OBJECTIVE);
    return { debrief };
  } catch {
    return { debrief: data.did_withdraw ? "Stopping a SIP during a crash guarantees you buy less when things are on sale." : "Consistency beat volatility. You accumulated cheaper units during the downturns." };
  }
}

export async function generateHarvestDebrief(data: {
  era: string;
  era_years: number;
  budget: number;
  style: string;
  allocation: Record<string, number>;
  final_value: number;
  total_invested: number;
  fear_type: string;
}): Promise<{ insights: string }> {
  try {
    const prompt = `
      Simulation: Harvest Era Planning
      User Fear: ${data.fear_type}
      They selected the ${data.era} era (${data.era_years} years) with a budget of ${data.budget} and stylistic approach: ${data.style}.
      Total Invested: ${data.total_invested}. Final Value Projected: ${data.final_value}.
      Provide a highly encouraging but realistic debrief showing how time and compounding are the antidote to their specific fear.
    `;
    const insights = await callGemini(prompt, SYSTEM_INSTRUCTION_OBJECTIVE);
    return { insights };
  } catch {
    return { insights: "Time in the market significantly outperformed trying to time the market. Your compounding curve speaks for itself." };
  }
}

export async function generateHistoricalNews(data: {
  date: string;
  eventName: string;
  severity: string;
}): Promise<{ headline: string, snippet: string }> {
  try {
    const prompt = `
      You are a financial journalist reporting in ${data.date}. 
      A major market event is unfolding: "${data.eventName}". The severity is "${data.severity}".
      Write a dramatic, realistic news headline (max 10 words) and a short 2-sentence snippet (max 30 words) that captures the fear and uncertainty of the moment.
      Format your response exactly as:
      HEADLINE: [Your Headline]
      SNIPPET: [Your Snippet]
    `;
    const response = await callGemini(prompt, "You are a historical financial news generator. Output strictly in the requested format.");
    
    const headlineMatch = response.match(/HEADLINE:\s*(.*)/i);
    const snippetMatch = response.match(/SNIPPET:\s*(.*)/i);
    
    return {
      headline: headlineMatch ? headlineMatch[1].replace(/["*]/g, '').trim() : `${data.eventName} Impacts Markets`,
      snippet: snippetMatch ? snippetMatch[1].replace(/["*]/g, '').trim() : `Investors are reacting strongly to the ongoing developments surrounding the ${data.eventName}.`
    };
  } catch {
    return { 
      headline: `${data.eventName} Hits the Market`, 
      snippet: `Significant market volatility observed as ${data.eventName} unfolds.`
    };
  }
}

export async function askKinuCurriculum(query: string, fearType: string, curriculumSummary: string): Promise<string> {
  try {
    const prompt = `
      User Question: "${query}"
      User Fear Profile: ${fearType}
      
      Available Curriculum Data:
      ${curriculumSummary}
      
      Answer the user's question accurately using only the principles of long-term investing, compounding, and index funds. Tailor the tone to reassure someone with a "${fearType}" fear profile. Keep the answer concise (2-3 sentences max).
    `;
    
    const answer = await callGemini(prompt, "You are Kinu, a supportive and highly intelligent financial AI mentor for the Kinetic City platform.");
    return answer;
  } catch {
    return "I'm having trouble retrieving that information right now, but remember: long-term consistency is your best defense against market noise.";
  }
}
