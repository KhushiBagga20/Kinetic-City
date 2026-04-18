from fastapi import APIRouter, Query
from typing import List, Optional

router = APIRouter(prefix="/api/news", tags=["news"])

# Static Indian news data for the dashboard (Mocked for now to ensure stability)
NEWS_DATA = [
    {
        "title": "NIFTY 50 holds above 22,000 amid global uncertainty",
        "summary": "Indian benchmark indices remained resilient as domestic institutional buying offset FII outflows.",
        "source": "ET Markets",
        "time": "Today",
        "sentiment": "neutral",
        "category": "market",
        "impact": "SIP investors benefit from continued accumulation at stable levels."
    },
    {
        "title": "RBI keeps repo rate unchanged at 6.5%",
        "summary": "The Monetary Policy Committee voted to hold rates, keeping borrowing costs steady.",
        "source": "RBI",
        "time": "Today",
        "sentiment": "positive",
        "category": "macro",
        "impact": "Stable EMIs; debt fund investors may see steady returns."
    },
    {
        "title": "IT sector outperforms as US tech spending rebounds",
        "summary": "Infosys and TCS led gains in the IT index after positive guidance from US clients.",
        "source": "Moneycontrol",
        "time": "Today",
        "sentiment": "positive",
        "category": "sector",
        "impact": "Tech-heavy portfolios may see near-term tailwinds."
    },
    {
        "title": "Gold prices rise on safe-haven demand",
        "summary": "MCX Gold touched ₹72,000/10g as geopolitical tensions pushed investors toward safety.",
        "source": "CNBC TV18",
        "time": "Today",
        "sentiment": "neutral",
        "category": "commodity",
        "impact": "Gold allocation in portfolios adds stability during volatility."
    },
    {
        "title": "Midcap rally continues; index up 2.3% this week",
        "summary": "Midcap and smallcap indices outperformed the large-cap benchmark indices.",
        "source": "Business Standard",
        "time": "Today",
        "sentiment": "positive",
        "category": "market",
        "impact": "Investors with diversified SIPs are seeing above-average returns."
    }
]

@router.get("")
async def get_news(fear_type: Optional[str] = Query(None)):
    """Return latest financial news."""
    return NEWS_DATA

@router.get("/context")
async def get_news_context():
    """Return news context for AI reasoning."""
    context_str = ". ".join([f"{item['title']}: {item['summary']}" for item in NEWS_DATA])
    return {"context": context_str}
