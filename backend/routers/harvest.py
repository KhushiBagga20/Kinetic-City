"""
Harvest Room — Freeform investment simulator.
POST /api/harvest-debrief
"""
import os
import sys
from fastapi import APIRouter
from models.schemas import HarvestDebriefRequest, HarvestDebriefResponse

# Add parent directory to path so we can import lib
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.groq_pool import generate, is_configured

router = APIRouter()

KINU_SYSTEM = """You are KINU — Kinetic Intelligence Neural User. You are a calm, precise financial intelligence for young Indians aged 18–28.
Never use jargon without explaining it.
Always give rupee amounts not percentages.
Frame worst cases as survivable and temporary.
You are warm but direct. You never sell anything. You help people understand investing through empathy.
CRITICAL: Never say "you made a mistake." Never shame the user's choices. Frame everything as learning."""


@router.post("/api/harvest-debrief", response_model=HarvestDebriefResponse)
async def harvest_debrief(req: HarvestDebriefRequest):
    """Generate KINU's insights for a Harvest Room simulation."""
    try:
        if not is_configured():
            return HarvestDebriefResponse(
                insights=_fallback_insights(req)
            )

        user_message = f"""The user completed a Harvest Room simulation.

Era: {req.era} ({req.era_years} years)
Budget: ₹{req.budget:,.0f}
Investment style: {req.style}
Allocation: {', '.join(f'{k} {v}%' for k, v in req.allocation.items())}
Final value: ₹{req.final_value:,.0f}
Total invested: ₹{req.total_invested:,.0f}
Profit/Loss: ₹{req.final_value - req.total_invested:,.0f} ({((req.final_value / req.total_invested - 1) * 100):+.1f}%)
Fear type: {req.fear_type}

YOUR TASK: Provide three messages:
1. WHAT HAPPENED: A 2-sentence summary of what the market did during this era. Be specific about events.
2. WHAT YOUR ALLOCATION REVEALS: What their allocation says about their instincts. Be specific and warm.
3. THE PRINCIPLE: One concrete takeaway they can apply to real investing. Not generic.

Separate messages with |||
Max 60 words per message. Warm, specific, no jargon."""

        text = generate(
            user_message,
            area="harvest",
            system_instruction=KINU_SYSTEM,
            max_output_tokens=300,
        )

        return HarvestDebriefResponse(insights=text)

    except Exception as e:
        print(f"Harvest debrief error: {e}")
        return HarvestDebriefResponse(
            insights=_fallback_insights(req)
        )


def _fallback_insights(req: HarvestDebriefRequest) -> str:
    profit = req.final_value - req.total_invested
    pct = ((req.final_value / req.total_invested) - 1) * 100 if req.total_invested > 0 else 0
    if profit >= 0:
        return (
            f"Your ₹{req.budget:,.0f} grew to ₹{req.final_value:,.0f} over this period. "
            f"That's a {pct:.1f}% return."
            f"|||Your allocation shows you understand diversification. "
            f"The mix you chose balanced growth with stability."
            f"|||The principle: time in the market beats timing the market. "
            f"The longer you stay invested, the more compounding works for you."
        )
    else:
        return (
            f"Your ₹{req.budget:,.0f} ended at ₹{req.final_value:,.0f} — a {pct:.1f}% return. "
            f"This era included significant market stress."
            f"|||Even experienced investors would have felt this drawdown. "
            f"Your allocation wasn't wrong — the timing was challenging."
            f"|||The principle: every era that ended in loss was followed by recovery. "
            f"The only permanent losses come from selling at the bottom."
        )
