"""
Kinetic Finance — Live Market Data Router
Fetches real-time Indian market data from Yahoo Finance via yfinance.
Includes a 5-minute in-memory cache to prevent rate-limiting.
"""
import time
from typing import Optional
from fastapi import APIRouter

router = APIRouter(prefix="/api/market", tags=["market"])

# ── In-memory cache ──────────────────────────────────────────────────────────
_cache: dict = {"data": None, "ts": 0}
CACHE_TTL = 300  # 5 minutes


def _fetch_market_data() -> dict:
    """Fetch latest market data from Yahoo Finance."""
    import yfinance as yf

    tickers = {
        "NIFTY 50": "^NSEI",
        "SENSEX": "^BSESN",
        "BANK NIFTY": "^NSEBANK",
        "MIDCAP": "NIFTYMIDCAP150.NS",
        "SMALLCAP": "NIFTYSMLCAP250.NS",
        "RELIANCE": "RELIANCE.NS",
        "TCS": "TCS.NS",
        "HDFC BANK": "HDFCBANK.NS",
        "INFOSYS": "INFY.NS",
        "ICICI BANK": "ICICIBANK.NS",
        "GOLD": "GC=F",
        "SILVER": "SI=F",
        "CRUDE OIL": "CL=F",
        "USD/INR": "INR=X",
        "10Y BOND": "^TNX",
    }

    results = []
    
    # First, fetch USD/INR so we can convert Gold correctly
    usd_inr = 83.0 # Fallback
    try:
        inr_hist = yf.Ticker("INR=X").history(period="1d")
        if not inr_hist.empty:
            usd_inr = inr_hist["Close"].iloc[-1]
    except Exception:
        pass

    # Tickers where "up" is bad for Indian investors
    INVERSE_SENTIMENT = {"USD/INR", "CRUDE OIL"}

    for label, symbol in tickers.items():
        try:
            tk = yf.Ticker(symbol)
            hist = tk.history(period="2d")
            if hist.empty or len(hist) < 1:
                continue

            close = hist["Close"].iloc[-1]
            prev = hist["Close"].iloc[-2] if len(hist) >= 2 else close
            change_pct = ((close - prev) / prev) * 100 if prev else 0

            # Format price
            if label == "GOLD":
                # Convert USD/oz to INR/g  (1 Troy Oz = 31.1035g)
                inr_per_gram = (close * usd_inr) / 31.1034768
                price_str = f"₹{inr_per_gram:,.0f}/g"
            elif label == "SILVER":
                # Convert USD/oz to INR/g
                inr_per_gram = (close * usd_inr) / 31.1034768
                price_str = f"₹{inr_per_gram:,.0f}/g"
            elif label == "CRUDE OIL":
                # Convert USD/barrel to INR/barrel
                inr_per_bbl = close * usd_inr
                price_str = f"₹{inr_per_bbl:,.0f}/bbl"
            elif label == "USD/INR":
                price_str = f"{close:.2f}"
            elif label == "10Y BOND":
                price_str = f"{close:.1f}%"
            elif label in ("RELIANCE", "TCS", "HDFC BANK", "INFOSYS", "ICICI BANK"):
                price_str = f"₹{close:,.0f}"
            else:
                price_str = f"{close:,.0f}"

            import math
            change_val = float(round(change_pct, 1))
            if math.isnan(change_val):
                change_val = 0.0

            results.append({
                "label": label,
                "price": price_str,
                "change": change_val,
                "direction": "up" if change_pct >= 0 else "down",
                "inverse": label in INVERSE_SENTIMENT,
            })
        except Exception:
            # Skip any ticker that fails
            continue

    return {"items": results, "fetched_at": int(time.time())}


@router.get("/latest")
def get_latest_market_data():
    """Return latest market data with 5-minute cache."""
    now = time.time()
    if _cache["data"] and (now - _cache["ts"]) < CACHE_TTL:
        return _cache["data"]

    data = _fetch_market_data()
    _cache["data"] = data
    _cache["ts"] = time.time()
    return data
