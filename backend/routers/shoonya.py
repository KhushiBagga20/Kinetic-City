"""
Kinetic — Shoonya Live Market Data Router
Connects to Finvasia/Shoonya API for real-time stock quotes, search, and OHLCV candles.
Provides a WebSocket bridge: Shoonya WS → backend → all connected frontend clients.

When Shoonya login fails, all endpoints transparently fall back to yfinance data.
When Shoonya is available, it takes priority automatically.
"""

import os
import json
import time
import hashlib
import asyncio
import threading
import logging
from typing import Optional
from datetime import datetime, timedelta

import requests
import websocket as ws_client  # websocket-client library
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from dotenv import load_dotenv

# ── Load env ─────────────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

logger = logging.getLogger("shoonya")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/api/shoonya", tags=["shoonya"])

# ── Credentials ──────────────────────────────────────────────────────────────
SHOONYA_USER   = os.getenv("SHOONYA_USER", "")
SHOONYA_VC     = os.getenv("SHOONYA_VC", "")
SHOONYA_APIKEY = os.getenv("SHOONYA_APIKEY", "")
SHOONYA_IMEI   = os.getenv("SHOONYA_IMEI", "abc1234")
SHOONYA_PWD    = os.getenv("SHOONYA_PWD", "")
SHOONYA_TOTP   = os.getenv("SHOONYA_TOTP", "")

BASE_URL = "https://api.shoonya.com/NorenWClientTP"
WS_URL   = "wss://api.shoonya.com/NorenWSTP/"

# ── Symbol map: Shoonya token → Yahoo Finance ticker ─────────────────────────
SHOONYA_TO_YAHOO = {
    '11630': '^NSEI',        # Nifty 50
    '26000': '^NSEBANK',     # Bank Nifty
    '1':     '^BSESN',       # Sensex
    '2885':  'RELIANCE.NS',
    '1333':  'HDFCBANK.NS',
    '1594':  'INFY.NS',
    '11536': 'TCS.NS',
    '4963':  'ICICIBANK.NS',
    '22':    'AXISBANK.NS',
    '3787':  'KOTAKBANK.NS',
}

# ── Global state ─────────────────────────────────────────────────────────────
susertoken: Optional[str] = None
quotes: dict = {}                         # token_key → quote dict
connected_ws_clients: list[WebSocket] = []
_ws_thread: Optional[threading.Thread] = None
_shoonya_connected = False
shoonya_available: bool = False           # True only when Shoonya login succeeds

# ── Default subscription ─────────────────────────────────────────────────────
SUBSCRIBE_KEYS = "NSE|11630#NSE|26000#NSE|2885#NSE|1594#NSE|1333#NSE|11536#NSE|4963#BSE|1#MCX|234230"


# ═════════════════════════════════════════════════════════════════════════════
#  YFINANCE HELPER FUNCTIONS
# ═════════════════════════════════════════════════════════════════════════════

def yf_get_quote(token: str) -> dict:
    """Get current quote from Yahoo Finance for a given Shoonya token."""
    import yfinance as yf
    ticker_sym = SHOONYA_TO_YAHOO.get(token)
    if not ticker_sym:
        return {}
    try:
        t = yf.Ticker(ticker_sym)
        info = t.fast_info
        prev_close = info.previous_close or 1
        lp = info.last_price
        if not lp:
            return {}
        pc = round(((lp - prev_close) / prev_close) * 100, 2)
        return {
            'stat': 'Ok',
            'tk': token,
            'lp': str(round(lp, 2)),
            'pc': str(pc),
            'o':  str(round(float(info.open or lp), 2)),
            'h':  str(round(float(info.day_high or lp), 2)),
            'l':  str(round(float(info.day_low or lp), 2)),
            'c':  str(round(prev_close, 2)),
            'v':  str(int(info.three_month_average_volume or 0)),
            'source': 'yfinance',
        }
    except Exception as e:
        logger.warning(f"yfinance quote error for {ticker_sym}: {e}")
        return {}


def yf_get_candles(token: str, interval: str, days: int) -> list:
    """Get OHLCV candles from Yahoo Finance."""
    import yfinance as yf
    ticker_sym = SHOONYA_TO_YAHOO.get(token)
    if not ticker_sym:
        return []
    try:
        # Map Shoonya interval (minutes) to yfinance interval string
        interval_map = {
            '1':   '1m',
            '3':   '5m',
            '5':   '5m',
            '10':  '15m',
            '15':  '15m',
            '30':  '30m',
            '60':  '1h',
            '120': '1h',
            '240': '1d',
        }
        yf_interval = interval_map.get(str(interval), '5m')

        # Pick the smallest period that covers the requested days
        period_map = [
            (1,   '1d'),
            (3,   '5d'),
            (5,   '5d'),
            (7,   '5d'),
            (30,  '1mo'),
            (90,  '3mo'),
            (180, '6mo'),
            (365, '1y'),
        ]
        period = '1mo'
        for d, p in period_map:
            if days <= d:
                period = p
                break

        t = yf.Ticker(ticker_sym)
        hist = t.history(period=period, interval=yf_interval)

        candles = []
        for ts, row in hist.iterrows():
            candles.append({
                'time': int(ts.timestamp()),
                'o': round(float(row['Open']), 2),
                'h': round(float(row['High']), 2),
                'l': round(float(row['Low']), 2),
                'c': round(float(row['Close']), 2),
                'v': int(row['Volume']),
            })
        return candles
    except Exception as e:
        logger.warning(f"yfinance candles error for {ticker_sym}: {e}")
        return []


def yf_get_snapshot() -> dict:
    """Get quotes for all watchlist tokens (synchronous, run in thread)."""
    snapshot = {}
    for token in SHOONYA_TO_YAHOO:
        q = yf_get_quote(token)
        if q:
            snapshot[token] = q
    return snapshot


def yf_search(query: str, exchange: str) -> list:
    """Basic search — match query against known symbols."""
    import yfinance as yf
    suffix = '.NS' if exchange == 'NSE' else '.BO'
    try:
        ticker_sym = query.upper().replace(' ', '') + suffix
        t = yf.Ticker(ticker_sym)
        info = t.fast_info
        if info.last_price:
            return [{'tsym': query.upper(), 'token': ticker_sym,
                     'exch': exchange, 'cname': query.upper()}]
    except Exception:
        pass
    return []


# ═════════════════════════════════════════════════════════════════════════════
#  SHOONYA REST FUNCTIONS
# ═════════════════════════════════════════════════════════════════════════════

def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def shoonya_login(retry: bool = True) -> bool:
    """Authenticate with Shoonya QuickAuth. Stores susertoken globally."""
    global susertoken, shoonya_available

    if not SHOONYA_USER or not SHOONYA_PWD:
        logger.warning("Shoonya credentials not configured — falling back to yfinance")
        shoonya_available = False
        return False

    pwd_hash = _sha256(SHOONYA_PWD)
    appkey = _sha256(f"{SHOONYA_USER}|{SHOONYA_APIKEY}")

    payload = {
        "apkversion": "1.0.0",
        "uid": SHOONYA_USER,
        "pwd": pwd_hash,
        "factor2": SHOONYA_TOTP,
        "vc": SHOONYA_VC,
        "appkey": appkey,
        "imei": SHOONYA_IMEI,
        "source": "API",
    }

    try:
        resp = requests.post(
            f"{BASE_URL}/QuickAuth",
            data="jData=" + json.dumps(payload),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        data = resp.json()

        if data.get("stat") == "Ok":
            susertoken = data["susertoken"]
            shoonya_available = True
            logger.info("Shoonya login successful")
            return True
        else:
            logger.error(f"Shoonya login failed: {data.get('emsg', 'unknown')} — falling back to yfinance")
    except Exception as e:
        logger.error(f"Shoonya login error: {e} — falling back to yfinance")

    # Retry once after 3s
    if retry:
        logger.info("Retrying Shoonya login in 3s…")
        time.sleep(3)
        return shoonya_login(retry=False)

    shoonya_available = False
    return False


def _post_shoonya(endpoint: str, jdata: dict) -> Optional[dict]:
    """Generic Shoonya REST POST with jData + jKey pattern."""
    if not susertoken:
        if not shoonya_login():
            return None

    payload_str = "jData=" + json.dumps(jdata) + "&jKey=" + susertoken
    try:
        resp = requests.post(
            f"{BASE_URL}/{endpoint}",
            data=payload_str,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        return resp.json()
    except Exception as e:
        logger.error(f"Shoonya {endpoint} error: {e}")
        return None


def get_quotes(exchange: str, token: str) -> Optional[dict]:
    """Fetch a single quote via GetQuotes REST call."""
    data = _post_shoonya("GetQuotes", {
        "uid": SHOONYA_USER,
        "exch": exchange,
        "token": token,
    })
    return data


def search_scrip(exchange: str, search_text: str) -> list:
    """Search for scrips matching text."""
    data = _post_shoonya("SearchScrip", {
        "uid": SHOONYA_USER,
        "exch": exchange,
        "stext": search_text,
    })
    if isinstance(data, dict) and data.get("stat") == "Ok":
        values = data.get("values", [])
        return [
            {"tsym": v.get("tsym"), "token": v.get("token"),
             "exch": v.get("exch"), "cname": v.get("cname", "")}
            for v in values[:10]
        ]
    return []


def get_time_series(exchange: str, token: str, interval: str, days: int) -> list:
    """Fetch OHLCV candle data via TPSeries."""
    now = int(time.time())
    start = now - (days * 86400)

    data = _post_shoonya("TPSeries", {
        "uid": SHOONYA_USER,
        "exch": exchange,
        "token": token,
        "st": str(start),
        "et": str(now),
        "intrv": interval,
    })

    if not isinstance(data, list):
        return []

    candles = []
    for c in data:
        try:
            # Shoonya returns time as "DD-MM-YYYY HH:MM:SS" or epoch
            time_str = c.get("time", c.get("ssboe", ""))
            if isinstance(time_str, str) and "-" in time_str:
                dt = datetime.strptime(time_str, "%d-%m-%Y %H:%M:%S")
                epoch = int(dt.timestamp())
            else:
                epoch = int(time_str) if time_str else 0

            candles.append({
                "time": epoch,
                "o": float(c.get("into", c.get("o", 0))),
                "h": float(c.get("inth", c.get("h", 0))),
                "l": float(c.get("intl", c.get("l", 0))),
                "c": float(c.get("intc", c.get("c", 0))),
                "v": int(float(c.get("intv", c.get("v", 0)))),
            })
        except (ValueError, TypeError):
            continue

    # Sort chronologically
    candles.sort(key=lambda x: x["time"])
    return candles


# ═════════════════════════════════════════════════════════════════════════════
#  SHOONYA WEBSOCKET (server-side, connects to broker)
# ═════════════════════════════════════════════════════════════════════════════

def _broadcast_tick(tick_data: dict):
    """Queue a tick broadcast to all connected frontend WS clients."""
    tk = tick_data.get("tk", "")
    if tk:
        quotes[tk] = {**quotes.get(tk, {}), **tick_data}


def _on_ws_open(ws):
    global _shoonya_connected
    logger.info("Shoonya WS opened — sending auth")
    auth_msg = json.dumps({
        "t": "c",
        "uid": SHOONYA_USER,
        "actid": SHOONYA_USER,
        "susertoken": susertoken,
        "source": "API",
    })
    ws.send(auth_msg)


def _on_ws_message(ws, message):
    global _shoonya_connected
    try:
        data = json.loads(message)
    except json.JSONDecodeError:
        return

    msg_type = data.get("t")

    if msg_type == "ck":
        # Connection confirmed — subscribe to tokens
        _shoonya_connected = True
        logger.info("Shoonya WS authenticated — subscribing tokens")
        sub_msg = json.dumps({"t": "t", "k": SUBSCRIBE_KEYS})
        ws.send(sub_msg)

    elif msg_type == "tf" or msg_type == "tk":
        # Tick update — merge into global quotes
        _broadcast_tick(data)


def _on_ws_error(ws, error):
    logger.error(f"Shoonya WS error: {error}")


def _on_ws_close(ws, close_status, close_msg):
    global _shoonya_connected
    _shoonya_connected = False
    logger.warning(f"Shoonya WS closed ({close_status}) — reconnecting in 5s")
    time.sleep(5)
    _start_shoonya_ws()


def _start_shoonya_ws():
    """Start Shoonya WebSocket in current thread (blocking)."""
    if not susertoken:
        logger.warning("No susertoken — cannot start Shoonya WS")
        return

    ws = ws_client.WebSocketApp(
        WS_URL,
        on_open=_on_ws_open,
        on_message=_on_ws_message,
        on_error=_on_ws_error,
        on_close=_on_ws_close,
    )
    ws.run_forever(ping_interval=30, ping_timeout=10)


def start_shoonya_daemon():
    """Launch the Shoonya WS connection in a daemon thread."""
    global _ws_thread
    if _ws_thread and _ws_thread.is_alive():
        return

    _ws_thread = threading.Thread(target=_start_shoonya_ws, daemon=True)
    _ws_thread.start()
    logger.info("Shoonya WS daemon thread started")


# ═════════════════════════════════════════════════════════════════════════════
#  FASTAPI ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/snapshot")
async def snapshot():
    """Return current quotes dict (all subscribed tokens) with data source indicator."""
    if shoonya_available:
        return {
            "source": "shoonya",
            "data": quotes,
            "connected": _shoonya_connected,
        }
    else:
        # Run all yfinance fetches concurrently to avoid serial blocking
        tasks = [asyncio.to_thread(yf_get_quote, token) for token in SHOONYA_TO_YAHOO]
        results = await asyncio.gather(*tasks)
        yf_snapshot = {}
        for token, q in zip(SHOONYA_TO_YAHOO.keys(), results):
            if q:
                yf_snapshot[token] = q
        return {
            "source": "yfinance",
            "data": yf_snapshot,
            "connected": False,
        }


@router.get("/quote")
async def quote(exchange: str = Query("NSE"), token: str = Query("11630")):
    """Return a single quote — Shoonya if available, else yfinance."""
    if shoonya_available:
        data = await asyncio.to_thread(get_quotes, exchange, token)
        if data and data.get("stat") == "Ok":
            return {**data, "source": "shoonya"}
        return {"error": "Failed to fetch quote", "raw": data}
    else:
        q = await asyncio.to_thread(yf_get_quote, token)
        if q:
            return q
        return {"error": f"yfinance could not fetch quote for token {token}"}


@router.get("/search")
async def search(q: str = Query("RELIANCE"), exchange: str = Query("NSE")):
    """Search scrips — Shoonya if available, else yfinance symbol lookup."""
    if shoonya_available:
        results = await asyncio.to_thread(search_scrip, exchange, q)
        return {"results": results, "source": "shoonya"}
    else:
        results = await asyncio.to_thread(yf_search, q, exchange)
        return {"values": results, "source": "yfinance"}


@router.get("/candles")
async def candles(
    exchange: str = Query("NSE"),
    token: str = Query("11630"),
    interval: str = Query("5"),
    days: int = Query(1),
):
    """Return OHLCV candle data — Shoonya if available, else yfinance."""
    if shoonya_available:
        data = await asyncio.to_thread(get_time_series, exchange, token, interval, days)
        return {"candles": data, "source": "shoonya"}
    else:
        data = await asyncio.to_thread(yf_get_candles, token, interval, days)
        return {"candles": data, "source": "yfinance"}


# ═════════════════════════════════════════════════════════════════════════════
#  FRONTEND WEBSOCKET BRIDGE
# ═════════════════════════════════════════════════════════════════════════════

@router.websocket("/ws")
async def websocket_bridge(websocket: WebSocket):
    """
    Frontend WebSocket endpoint.
    On connect: sends current snapshot (Shoonya ticks or yfinance poll).
    Shoonya mode: pushes ticks from the global quotes dict every 200ms.
    yfinance mode: polls all tokens every 15s and pushes updates.
    """
    await websocket.accept()
    connected_ws_clients.append(websocket)

    # ── Send initial snapshot immediately ────────────────────────────────────
    try:
        if shoonya_available:
            initial_snapshot = quotes
        else:
            # Fetch concurrently so client gets data fast
            tasks = [asyncio.to_thread(yf_get_quote, token) for token in SHOONYA_TO_YAHOO]
            results = await asyncio.gather(*tasks)
            initial_snapshot = {}
            for token, q in zip(SHOONYA_TO_YAHOO.keys(), results):
                if q:
                    initial_snapshot[token] = q

        await websocket.send_json({
            "t": "snapshot",
            "data": initial_snapshot,
            "source": "shoonya" if shoonya_available else "yfinance",
            "connected": _shoonya_connected,
        })
    except Exception:
        connected_ws_clients.remove(websocket)
        return

    # ── Branch: Shoonya live ticks vs yfinance polling ───────────────────────
    try:
        if shoonya_available:
            # Shoonya mode: watch for quote dict changes and push diffs
            last_sent = json.dumps(quotes, sort_keys=True)
            while True:
                current = json.dumps(quotes, sort_keys=True)
                if current != last_sent:
                    last_sent = current
                    await websocket.send_json({"t": "update", "data": quotes, "source": "shoonya"})

                try:
                    msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.2)
                    if msg == "ping":
                        await websocket.send_json({"t": "pong"})
                except asyncio.TimeoutError:
                    pass
        else:
            # yfinance mode: poll every 15 seconds
            while True:
                await asyncio.sleep(15)
                # Fetch all tokens concurrently
                tasks = [asyncio.to_thread(yf_get_quote, token) for token in SHOONYA_TO_YAHOO]
                results = await asyncio.gather(*tasks)
                for token, q in zip(SHOONYA_TO_YAHOO.keys(), results):
                    if q:
                        try:
                            await websocket.send_json({**q, "source": "yfinance"})
                        except Exception:
                            return  # client disconnected

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Frontend WS error: {e}")
    finally:
        if websocket in connected_ws_clients:
            connected_ws_clients.remove(websocket)


# ═════════════════════════════════════════════════════════════════════════════
#  STARTUP — Login + start WS daemon
# ═════════════════════════════════════════════════════════════════════════════

@router.on_event("startup")
async def _startup():
    """Login to Shoonya and start WebSocket daemon on server boot."""
    success = await asyncio.to_thread(shoonya_login)
    if success:
        start_shoonya_daemon()
        logger.info("Shoonya live data active")
    else:
        logger.warning("Shoonya login failed — all endpoints will serve yfinance data transparently")
