"""
Kinetic Finance — FastAPI Backend
Serves personalized portfolio data + AI mentor + auth.
"""
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Union

from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from routers import mentor, auth, sandbox, harvest, quotes

# ── Load environment variables ───────────────────────────────────────────────
load_dotenv()

# ── Load data ────────────────────────────────────────────────────────────────
DATA_PATH = Path(__file__).parent / "data" / "portfolio.json"

def load_data() -> dict:
    with open(DATA_PATH, "r") as f:
        return json.load(f)

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Kinetic Finance API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include routers ─────────────────────────────────────────────────────────
app.include_router(mentor.router)
app.include_router(auth.router)
app.include_router(sandbox.router)
app.include_router(harvest.router)
app.include_router(quotes.router)

# ── Helpers ──────────────────────────────────────────────────────────────────
PERIOD_DAYS = {
    "1W": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "ALL": None,
}

def format_inr(value: Union[int, float]) -> str:
    """Format a number into Indian rupee shorthand."""
    if value >= 1_00_00_000:
        return f"₹{value / 1_00_00_000:.2f}Cr"
    if value >= 1_00_000:
        return f"₹{value / 1_00_000:.2f}L"
    return f"₹{value:,.0f}"


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/api/user")
def get_user():
    """Return user profile and greeting."""
    data = load_data()
    user = data["user"]
    summary = data["portfolio"]["summary"]

    day_pct = summary["dayChangePercent"]
    direction = "up" if day_pct >= 0 else "down"

    return {
        "name": user["name"],
        "greeting": f"Your portfolio is {direction} {abs(day_pct)}% today. Looking sharp.",
        "tip": user["tip"],
    }


@app.get("/api/portfolio/summary")
def get_portfolio_summary():
    """Return the four headline metrics."""
    data = load_data()
    s = data["portfolio"]["summary"]

    return {
        "metrics": [
            {
                "title": "CURRENT VALUE",
                "value": format_inr(s["currentValue"]),
                "subtext": f"+{format_inr(s['dayChange'])} ({s['dayChangePercent']}%)",
                "highlight": True,
            },
            {
                "title": "TOTAL RETURNS",
                "value": f"+{format_inr(s['totalReturns'])}",
                "subtext": f"{s['totalReturnsPercent']}% overall",
                "highlight": False,
            },
            {
                "title": "XIRR",
                "value": f"{s['xirr']}%",
                "subtext": "Outperforming Index",
                "highlight": True,
            },
            {
                "title": "DAY'S P&L",
                "value": f"+{format_inr(s['dayChange'])}",
                "subtext": f"+{s['dayChangePercent']}% today",
                "highlight": False,
            },
        ]
    }


@app.get("/api/portfolio/chart")
def get_portfolio_chart(period: Optional[str] = Query("1Y")):
    """Return time-series data filtered by period."""
    data = load_data()
    chart = data["portfolio"]["chartData"]

    days = PERIOD_DAYS.get(period, None)

    if days is not None and chart:
        last_date = datetime.strptime(chart[-1]["time"], "%Y-%m-%d")
        cutoff = last_date - timedelta(days=days)
        chart = [
            pt for pt in chart
            if datetime.strptime(pt["time"], "%Y-%m-%d") >= cutoff
        ]

    return {"data": chart}


@app.get("/api/portfolio/holdings")
def get_portfolio_holdings():
    """Return holdings for ticker widgets."""
    data = load_data()
    holdings = data["portfolio"]["holdings"]

    hot = next((h for h in holdings if h.get("tag") == "hot"), holdings[0])
    dividend = next((h for h in holdings if h.get("tag") == "dividend"), None)

    result = {
        "hotTicker": {
            "symbol": hot["symbol"],
            "sector": hot["sector"],
            "price": f"₹{hot['currentPrice']:,.2f}",
            "change": f"+{hot['dayChange']}%" if hot["dayChange"] >= 0 else f"{hot['dayChange']}%",
            "positive": hot["dayChange"] >= 0,
            "time": datetime.now().strftime("%H:%M PM"),
        },
        "all": [
            {
                "symbol": h["symbol"],
                "name": h["name"],
                "sector": h["sector"],
                "quantity": h["quantity"],
                "avgPrice": h["avgPrice"],
                "currentPrice": h["currentPrice"],
                "pnl": h["pnl"],
                "dayChange": h["dayChange"],
            }
            for h in holdings
        ],
    }

    if dividend:
        result["dividendAlert"] = {
            "symbol": dividend["symbol"],
            "sector": dividend["sector"],
            "price": f"₹{dividend['currentPrice']:,.2f}",
            "dividendPerShare": f"₹{dividend.get('dividendPerShare', 0):.2f} / share",
            "date": "Today",
        }

    return result


# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "kinetic-api", "version": "2.0.0"}
