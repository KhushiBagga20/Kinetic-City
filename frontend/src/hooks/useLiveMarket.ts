/**
 * useLiveMarket — WebSocket hook for live market data.
 *
 * Connects to the backend WS bridge at /api/shoonya/ws.
 * On "snapshot": sets all quotes at once and records data source.
 * On "update"/"tf": merges single tick into quotes state.
 * Falls back to REST polling if WS disconnects.
 *
 * Exposes: { quotes, connected, dataSource, fetchCandles, searchScrip, fetchQuote }
 * dataSource: 'shoonya' | 'yfinance' | 'offline'
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ───────────────────────────────────────────────────────────────────

export interface QuoteData {
  tk?: string    // token
  lp?: string    // last price
  pc?: string    // percent change
  o?: string     // open
  h?: string     // high
  l?: string     // low
  c?: string     // close / prev close
  v?: string     // volume
  ap?: string    // average price
  ts?: string    // trading symbol
  source?: string
  [key: string]: string | undefined
}

export interface CandleData {
  time: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

export type DataSource = 'shoonya' | 'yfinance' | 'offline'

// ── API base ────────────────────────────────────────────────────────────────

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
const WS_BASE = API_BASE.replace(/^http/, 'ws')

// ── Hook ────────────────────────────────────────────────────────────────────

export function useLiveMarket() {
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({})
  const [connected, setConnected] = useState(false)
  const [dataSource, setDataSource] = useState<DataSource>('offline')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  // ── WebSocket connection ────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(`${WS_BASE}/api/shoonya/ws`)
      wsRef.current = ws

      ws.onopen = () => {
        if (mountedRef.current) setConnected(true)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const msg = JSON.parse(event.data)

          if (msg.t === 'snapshot' || msg.t === 'update') {
            // Full or partial quote update — merge
            const data = msg.data as Record<string, QuoteData>
            setQuotes(prev => ({ ...prev, ...data }))
            if (msg.connected !== undefined) setConnected(msg.connected)
            // Track data source from snapshot/update messages
            if (msg.source) {
              setDataSource(msg.source as DataSource)
            }
          } else if (msg.t === 'tf' || msg.t === 'tk') {
            // Single tick from Shoonya live feed
            const tk = msg.tk || msg.data?.tk
            if (tk) {
              setQuotes(prev => ({
                ...prev,
                [tk]: { ...prev[tk], ...msg },
              }))
              setDataSource('shoonya')
            }
          } else if (msg.source) {
            // yfinance polling tick (no 't' field, just quote fields + source)
            const tk = msg.tk
            if (tk) {
              setQuotes(prev => ({ ...prev, [tk]: { ...prev[tk], ...msg } }))
              setDataSource(msg.source as DataSource)
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        setDataSource('offline')
        // Reconnect after 3s
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      // WS construction failed — retry
      setDataSource('offline')
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect()
      }, 3000)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()

    // Keep-alive ping every 25s
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
      }
    }, 25_000)

    return () => {
      mountedRef.current = false
      clearInterval(pingInterval)
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // prevent reconnect on intentional close
        wsRef.current.close()
      }
    }
  }, [connect])

  // ── REST helpers ────────────────────────────────────────────────────────

  const fetchCandles = useCallback(
    async (exchange: string, token: string, interval: string, days: number): Promise<CandleData[]> => {
      try {
        const params = new URLSearchParams({ exchange, token, interval, days: String(days) })
        const resp = await fetch(`${API_BASE}/api/shoonya/candles?${params}`)
        const json = await resp.json()
        return json.candles || []
      } catch {
        return []
      }
    },
    []
  )

  const searchScrip = useCallback(
    async (query: string, exchange: string = 'NSE'): Promise<Array<{ tsym: string; token: string; exch: string; cname: string }>> => {
      try {
        const params = new URLSearchParams({ q: query, exchange })
        const resp = await fetch(`${API_BASE}/api/shoonya/search?${params}`)
        const json = await resp.json()
        return json.results || json.values || []
      } catch {
        return []
      }
    },
    []
  )

  const fetchQuote = useCallback(
    async (exchange: string, token: string): Promise<QuoteData | null> => {
      try {
        const params = new URLSearchParams({ exchange, token })
        const resp = await fetch(`${API_BASE}/api/shoonya/quote?${params}`)
        const json = await resp.json()
        if (json.error) return null
        // Merge fetched quote into state so watchlist items show live data
        const tk = json.tk || token
        setQuotes(prev => ({ ...prev, [tk]: { ...prev[tk], ...json } }))
        return json
      } catch {
        return null
      }
    },
    []
  )

  return { quotes, connected, dataSource, fetchCandles, searchScrip, fetchQuote }
}
