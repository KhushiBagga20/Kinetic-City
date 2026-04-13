"""
Sandbox FY Time Machine — Gemini-powered debrief endpoints.
POST /api/sandbox-debrief
POST /api/instinct-debrief
"""
import os
from fastapi import APIRouter
from models.schemas import (
    SandboxDebriefRequest, SandboxDebriefResponse,
    InstinctDebriefRequest, InstinctDebriefResponse,
    SandboxAdviceRequest, SandboxAdviceResponse,
)

router = APIRouter()

# ── KINU system prompt (shared) ─────────────────────────────────────────────

KINU_SYSTEM = """You are KINU — Kinetic Intelligence Neural User. You are a calm, precise financial intelligence for young Indians aged 18–28.
Never use jargon without explaining it.
Always give rupee amounts not percentages.
Frame worst cases as survivable and temporary.
You are warm but direct. You never sell anything. You help people understand investing through empathy.
If you don't know something, say so honestly. Never make up financial data.
CRITICAL: Never say "you made a mistake." Never shame the user's choices. Frame everything as learning."""

# ── Fear type context ────────────────────────────────────────────────────────

FEAR_CONTEXT = {
    "loss": "The user fears losing money. Focus on survivability, historical recovery, and worst-case rupee amounts.",
    "jargon": "The user is intimidated by financial terms. Explain everything simply. Use analogies.",
    "scam": "The user suspects financial products may be scams. Validate their skepticism as rational, then show what the data says.",
    "trust": "The user doesn't trust fund managers or apps. Lead with index fund math and historical data. Minimize personality.",
}

# ── FY context for sandbox debriefs ──────────────────────────────────────────

FY_CONTEXT = {
    "FY01": "2001–02 (Dot-com crash): Indian IT sector hammered. Nifty fell 16%.",
    "FY02": "2002–03 (Dot-com aftermath): Post-dot-com recovery. Flat year. Nifty fell 3%.",
    "FY03": "2003–04 (Recovery): Massive recovery. Nifty surged 72%.",
    "FY04": "2004–05 (Election rally): Election surprise. Brief crash then recovery. Nifty +11%.",
    "FY05": "2005–06 (Bull run): Strong bull run begins. Nifty +38%.",
    "FY06": "2006–07 (Bull peak): Peak bull market. Nifty +67%. One of the best years ever.",
    "FY07": "2007–08 (Steady growth): Steady growth. Nifty +12%.",
    "FY08": "2008–09 (Pre-crash): Pre-crash optimism. Nifty +24% but storm coming.",
    "FY09": "2009–10 (Global financial crisis): Lehman collapse. Nifty crashed 36%. Worst year in a generation.",
    "FY10": "2010–11 (Recovery): Historic recovery. Nifty surged 76%. Best recovery year ever.",
    "FY11": "2011–12 (Moderate): Moderate year. Nifty +11%. Steady, not dramatic.",
    "FY12": "2012–13 (Sideways): Sideways to down. Nifty -9%. Testing patience.",
    "FY13": "2013–14 (Gradual recovery): Gradual recovery. Nifty +8%.",
    "FY14": "2014–15 (Modi rally): Modi rally begins. Nifty +18%.",
    "FY15": "2015–16 (Bull run): Strong bull run continuation. Nifty +28%.",
    "FY16": "2016–17 (China scare): China scare, global correction. Nifty -8%.",
    "FY17": "2017–18 (Demonetisation): Demonetisation in Nov 2016. Short-term shock. Nifty +19% overall.",
    "FY18": "2018–19 (Steady): Steady year. Nifty +11%.",
    "FY19": "2019–20 (IL&FS crisis): IL&FS crisis, moderate year. Nifty +15%.",
    "FY20": "2020–21 (COVID): COVID crash in March 2020. Nifty crashed 23% in March alone. Panic everywhere.",
    "FY21": "2021–22 (COVID recovery): COVID recovery. Nifty surged 70%+. Extraordinary year.",
    "FY22": "2022–23 (Russia-Ukraine): Russia-Ukraine war. Post-COVID bull market. Nifty +22%.",
    "FY23": "2023–24 (Global slowdown): Global slowdown, rate hikes. Nifty -1%. Flat year.",
}


@router.post("/api/sandbox-debrief", response_model=SandboxDebriefResponse)
async def sandbox_debrief(req: SandboxDebriefRequest):
    """Message 2: Where the user's instincts were right."""
    try:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return SandboxDebriefResponse(
                debrief=f"Your allocation for {req.year} showed thought. "
                        f"Diversification across asset classes is always the smartest baseline."
            )

        import google.generativeai as genai
        genai.configure(api_key=api_key)

        fear_ctx = FEAR_CONTEXT.get(req.fear_type, "")
        fy_ctx = FY_CONTEXT.get(req.year, f"Financial year {req.year}.")

        pull_out_note = ""
        if req.did_pull_out and req.pulled_out_month:
            pull_out_note = f"The user pulled out in month {req.pulled_out_month}."

        user_message = f"""The user played the Sandbox FY Time Machine for {req.year}.

FY Context: {fy_ctx}

Their allocation of ₹50,000:
- Nifty 50: {req.allocation.get('nifty', 0)}%
- Midcap: {req.allocation.get('midcap', 0)}%
- Smallcap: {req.allocation.get('smallcap', 0)}%
- Debt: {req.allocation.get('debt', 0)}%

Final values:
- Nifty: ₹{req.final_values.get('nifty', 0):,.0f}
- Midcap: ₹{req.final_values.get('midcap', 0):,.0f}
- Smallcap: ₹{req.final_values.get('smallcap', 0):,.0f}
- Debt: ₹{req.final_values.get('debt', 0):,.0f}

{pull_out_note}

YOUR TASK: Find something in their allocation that actually made sense or worked, even if overall result was negative.
- If they had ANY debt allocation during a crash year: praise the cushion it provided.
- If they went heavy equity in a good year: praise the conviction.
- If they pulled out: acknowledge the instinct was human, not wrong.
- If everything went wrong: focus on what the decision to stay/leave reveals about their risk tolerance.

CRITICAL: Never say "you made a mistake." Never. Frame everything as learning.
Max 80 words. Warm, specific."""

        system = f"{KINU_SYSTEM}\n\n{fear_ctx}"

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system,
        )
        response = model.generate_content(
            user_message,
            generation_config=genai.types.GenerationConfig(max_output_tokens=150),
        )

        return SandboxDebriefResponse(debrief=response.text.strip())

    except Exception as e:
        print(f"Sandbox debrief error: {e}")
        return SandboxDebriefResponse(
            debrief=f"Your {req.year} allocation showed you understand something about risk. "
                    f"Every year is different, but the instinct to diversify is always sound."
        )


@router.post("/api/sandbox-advice", response_model=SandboxAdviceResponse)
async def sandbox_advice(req: SandboxAdviceRequest):
    """Message 3: What to do differently next time."""
    try:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return SandboxAdviceResponse(
                advice=f"For {req.year}, the optimal allocation leaned heavily into "
                       f"{'debt' if req.optimal_allocation.get('debt', 0) > 50 else 'equity'}. "
                       f"The key principle: diversify always, adjust with conviction."
            )

        import google.generativeai as genai
        genai.configure(api_key=api_key)

        fear_ctx = FEAR_CONTEXT.get(req.fear_type, "")
        fy_ctx = FY_CONTEXT.get(req.year, f"Financial year {req.year}.")

        user_message = f"""The user completed a Sandbox FY simulation for {req.year}.

FY Context: {fy_ctx}

Their allocation: Nifty {req.user_allocation.get('nifty',0)}%, Midcap {req.user_allocation.get('midcap',0)}%, Smallcap {req.user_allocation.get('smallcap',0)}%, Debt {req.user_allocation.get('debt',0)}%
Their result: ₹{req.user_result:,.0f} from ₹{req.total_invested:,.0f} invested

Optimal allocation (hindsight): Nifty {req.optimal_allocation.get('nifty',0)}%, Midcap {req.optimal_allocation.get('midcap',0)}%, Smallcap {req.optimal_allocation.get('smallcap',0)}%, Debt {req.optimal_allocation.get('debt',0)}%
Optimal result: ₹{req.optimal_result:,.0f}

Did they pull out early: {req.did_pull_out}

YOUR TASK: Give actionable portfolio advice. Be specific:
1. One concrete allocation adjustment for similar market conditions
2. Why the optimal allocation worked for this specific FY
3. One principle this year teaches about diversification or timing

CRITICAL: Never shame choices. Frame as learning, not failure.
Max 80 words. Actionable. Not preachy."""

        system = f"""{KINU_SYSTEM}

You are giving actionable portfolio advice after a sandbox simulation.
Be specific about what allocation would have worked better and why.
Never shame the user for their choices.
Frame everything as learning, not failure.
One principle per response.
{fear_ctx}"""

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system,
        )
        response = model.generate_content(
            user_message,
            generation_config=genai.types.GenerationConfig(max_output_tokens=150),
        )

        return SandboxAdviceResponse(advice=response.text.strip())

    except Exception as e:
        print(f"Sandbox advice error: {e}")
        return SandboxAdviceResponse(
            advice=f"The principle from {req.year}: no one predicts the future. "
                   f"The goal isn't to time the market — it's to stay in it long enough "
                   f"that time works for you."
        )


@router.post("/api/instinct-debrief", response_model=InstinctDebriefResponse)
async def instinct_debrief(req: InstinctDebriefRequest):
    """KINU analyses the user's Time Machine instinct — did they stay or pull out."""
    try:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return InstinctDebriefResponse(
                debrief="Your instinct in that moment was real. "
                        "Whether you stayed or pulled out, you now have data "
                        "to make a better decision next time."
            )

        import google.generativeai as genai
        genai.configure(api_key=api_key)

        fear_ctx = FEAR_CONTEXT.get(req.fear_type, "")

        action = "stayed invested through the crash" if not req.did_withdraw else f"withdrew in month {req.withdraw_month or 'unknown'}"
        profit_loss = req.final_value - req.total_invested
        pct = ((req.final_value / req.total_invested) - 1) * 100 if req.total_invested > 0 else 0

        user_message = f"""The user completed the Time Machine simulation.

Starting year: {req.start_year}
Monthly SIP: ₹{req.monthly_amount:,.0f}
Total invested: ₹{req.total_invested:,.0f}
Final value: ₹{req.final_value:,.0f}
Profit/Loss: ₹{profit_loss:,.0f} ({pct:+.1f}%)
Decision: They {action}.
Fear type: {req.fear_type}

Focus on:
- What their decision reveals about their instincts
- Whether that instinct would have served them historically
- One concrete thing they learned about themselves

Max 80 words. Be specific. Be warm. Be honest."""

        system = f"{KINU_SYSTEM}\n\n{fear_ctx}"

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system,
        )
        response = model.generate_content(
            user_message,
            generation_config=genai.types.GenerationConfig(max_output_tokens=200),
        )

        return InstinctDebriefResponse(debrief=response.text.strip())

    except Exception as e:
        print(f"Instinct debrief error: {e}")
        return InstinctDebriefResponse(
            debrief="Your instinct in that moment was real. "
                    "History shows that staying invested through crashes has always recovered. "
                    "Now you know what your gut does under pressure."
        )

