"""
KINU AI Mentor — Azure OpenAI (GPT-4o) powered financial intelligence router.
POST /api/mentor
"""
import os
import sys
from fastapi import APIRouter
from models.schemas import MentorRequest, MentorResponse

# Add parent directory to path so we can import lib
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.groq_pool import get_chat_model, generate, is_configured

router = APIRouter()

# ── System prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are KINU — Kinetic Intelligence Neural User. You are a calm, precise financial intelligence built into the Kinetic app. You lead with data, then meaning, then action. Every response has three internal layers even if they flow together: the fact, what it means for this person, and what they can do about it. You never use financial jargon without explaining it. You always give rupee amounts. You frame worst cases as survivable. You are not warm or brotherly — you are quietly confident and always specific. Maximum 60 words unless asked for more.

Adapt your response based on the user's fear type:
- loss → focus on survivability, historical recovery, worst-case rupee amounts
- jargon → use simple analogies, explain every term inline, no shortcuts
- scam → cite SEBI regulations, data sources, show regulatory proof
- trust → lead with mathematical proofs, index fund data, minimize personality

You never sell anything. You help people understand investing through precision and empathy.
If you don't know something, say so honestly. Never make up financial data."""


# ── Fear type routing ────────────────────────────────────────────────────────

FEAR_CONTEXT = {
    "loss": "The user fears losing money. Always show worst-case rupee amounts first, then show median recovery. Frame losses as temporary and survivable.",
    "jargon": "The user is intimidated by financial terms. Wrap every term in a simple explanation. Use analogies. Never assume they know anything.",
    "scam": "The user suspects all financial products may be scams. Always cite SEBI, AMFI, or RBI regulations. Show data source links. Build trust through transparency.",
    "trust": "The user doesn't trust fund managers or financial apps. Lead with index fund math and historical data. Minimize your personality — let the numbers speak.",
}


@router.post("/api/mentor", response_model=MentorResponse)
async def mentor_chat(req: MentorRequest):
    """Handle a chat message to KINU, the AI financial intelligence."""
    try:
        if not is_configured():
            return MentorResponse(
                reply="I'm not fully connected yet — the AZURE_OPENAI_API_KEY hasn't been set in the backend .env file. "
                      "Once it's configured, I'll be able to have a real conversation with you. "
                      "In the meantime, check out the Learn section for answers to common questions."
            )

        fear_context = FEAR_CONTEXT.get(req.fear_type, "")
        metaphor_note = f"The user prefers a '{req.metaphor_style}' communication style." if req.metaphor_style != "generic" else ""

        full_system = f"{SYSTEM_PROMPT}\n\n{fear_context}\n{metaphor_note}"

        # Build conversation history
        history = []
        for msg in req.conversation_history[:-1]:  # exclude the latest user message
            history.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [msg.content],
            })

        chat = get_chat_model(
            area="mentor",
            system_instruction=full_system,
            history=history,
        )

        # Prepend app context if provided
        full_message = f"[User app context: {req.app_context}]\n{req.message}" if req.app_context else req.message
        response = chat.send_message(full_message)

        return MentorResponse(reply=response.text)

    except Exception as e:
        print(f"Mentor API error: {e}")
        return MentorResponse(
            reply="I'm having a bit of trouble right now. Please try again in a moment. "
                  "If this keeps happening, check if the AZURE_OPENAI_API_KEY in the backend .env file is valid."
        )


# ── Session cache for term lookups ──────────────────────────────────────────

_term_cache: dict[str, dict] = {}


@router.post("/api/kinu-term")
async def explain_term(req: dict):
    """AI-powered jargon lookup for terms not in the local dictionary."""
    term = req.get("term", "")
    fear_type = req.get("fear_type", "")

    if not term:
        return {"error": "No term provided"}

    # Check cache first
    cache_key = term.lower().strip()
    if cache_key in _term_cache:
        return _term_cache[cache_key]

    try:
        if not is_configured():
            return {
                "term": term,
                "plain": "KINU is not connected yet. Set AZURE_OPENAI_API_KEY in backend .env.",
                "analogy": "",
                "whyItMatters": "",
                "fromKINU": True,
            }

        import json as json_lib

        prompt = f"""Explain the financial term "{term}" for a young Indian investor.
Return ONLY a JSON object with these exact keys:
- plain: one sentence, plain English, max 25 words
- analogy: one relatable Indian analogy, max 25 words
- whyItMatters: one sentence on why this matters for their investing, max 25 words
No preamble. No markdown. Just the JSON object."""

        text = generate(prompt, area="term")

        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3].strip()
        if text.startswith("json"):
            text = text[4:].strip()

        data = json_lib.loads(text)
        result = {
            "term": term,
            "plain": data.get("plain", ""),
            "analogy": data.get("analogy", ""),
            "whyItMatters": data.get("whyItMatters", ""),
            "fromKINU": True,
        }

        _term_cache[cache_key] = result
        return result

    except Exception as e:
        print(f"KINU term lookup error: {e}")
        return {
            "term": term,
            "plain": f"Could not look up '{term}' right now.",
            "analogy": "",
            "whyItMatters": "",
            "fromKINU": True,
        }
