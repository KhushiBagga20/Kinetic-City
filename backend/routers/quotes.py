"""
Fear Quote Generator — Gemini-powered personalised fear-type quotes.
POST /api/fear-quote
"""
import os
import random
from fastapi import APIRouter
from models.schemas import FearQuoteRequest, FearQuoteResponse

router = APIRouter()

# ── Fallback quotes (used when Gemini is unavailable) ────────────────────────

FALLBACK_QUOTES: dict[str, list[str]] = {
    "loss": [
        "The worst crashes in history lasted 14 months. Your patience lasts a lifetime.",
        "Every rupee you didn't invest out of fear has already lost to inflation.",
        "The market doesn't reward the fearless. It rewards the patient.",
        "Your grandparents survived Harshad Mehta, Lehman, and COVID. The market is still here.",
        "A 40% drop needs a 67% recovery. The Nifty has done it every single time.",
    ],
    "jargon": [
        "You don't need to know what XIRR stands for to start. You just need ₹500.",
        "The financial industry made things confusing on purpose. You're right to be annoyed.",
        "Every expert you see on CNBC started by Googling 'what is a mutual fund?'",
        "Three words: Nifty. Index. Fund. That's it. That's the whole strategy.",
        "Jargon is the moat the financial industry built to keep you out. We're filling it in.",
    ],
    "scam": [
        "SEBI regulation means your mutual fund money sits in a registered custodian. Not with some guy.",
        "Index funds have no fund manager making decisions. The algorithm just copies the top 50.",
        "Your skepticism is a superpower. Directed at verified data, it becomes precision.",
        "Every transaction is tracked by CAMS or KFintech. There's a paper trail for every rupee.",
        "The best investors aren't the most trusting. They're the most thorough.",
    ],
    "trust": [
        "An index fund is a formula, not a person. The Nifty 50 has no ego, no bias, no agenda.",
        "You don't need to trust a fund manager. Algorithms don't take commissions.",
        "The beauty of math: it doesn't need your faith to be correct.",
        "Data doesn't lie. People do. That's why we show you data, not opinions.",
        "Your independence is an edge. Most investors lose money by following the crowd.",
    ],
}

CONTEXT_PROMPTS = {
    "dashboard": "for their main dashboard greeting — warm, brief, forward-looking",
    "profile": "for their fear profile page — reflective, deep, affirming their archetype",
    "card": "for their Fear Fingerprint card — punchy, shareable, badge-worthy",
    "simulation": "for their SIP simulation page — grounding, data-anchored",
    "portfolio": "for their portfolio page — calm, reassuring about their journey",
    "learn": "for their learning page — curious, encouraging exploration",
}


@router.post("/api/fear-quote", response_model=FearQuoteResponse)
async def generate_fear_quote(req: FearQuoteRequest):
    """Generate a personalised one-liner based on fear type + context."""
    try:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("No API key")

        import google.generativeai as genai
        genai.configure(api_key=api_key)

        name_part = f"The user's name is {req.user_name}." if req.user_name else ""
        context_hint = CONTEXT_PROMPTS.get(req.context, "for a general screen")

        prompt = f"""Generate exactly ONE short motivational sentence (max 18 words) for a young Indian investor.

{name_part}
Their fear archetype is: {req.fear_type}
This quote is {context_hint}.

Rules:
- Maximum 18 words
- No quotation marks in your response
- No generic advice like "invest early"
- Must feel personal, warm, and specific to their fear type
- Use Indian context when relevant (rupees, Nifty, etc.)
- Sound like a wise friend, not a financial advisor
- Never start with "Remember" or "Don't worry"
- Make it feel like something they'd screenshot and share
- Do NOT address them by name — keep it universal

Return ONLY the quote, nothing else."""

        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        response = model.generate_content(prompt)
        quote = response.text.strip().strip('"').strip("'").strip('"').strip('"')

        # Sanity check
        if len(quote) > 200 or len(quote) < 10:
            raise ValueError("Bad quote length")

        return FearQuoteResponse(quote=quote)

    except Exception as e:
        print(f"Fear quote error: {e}")
        quotes = FALLBACK_QUOTES.get(req.fear_type, FALLBACK_QUOTES["loss"])
        return FearQuoteResponse(quote=random.choice(quotes))
