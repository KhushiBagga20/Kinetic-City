import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, type FearType } from '../../../store/useAppStore'

import { Check, ChevronDown, ChevronRight, Search, BookOpen, Map, Zap, Shield, Target } from 'lucide-react'
import FYComparison from '../FYComparison'
import CopyTheMarket from '../CopyTheMarket'
import XIRRExplainer from '../XIRRExplainer'
import MarketExplainer from '../MarketExplainer'
import NewsImpactCard from '../../news/NewsImpactCard'
import {
  TRACK_NAMES,
  type FearTrack,
} from '../../../lib/curriculumData'

// ── GLOSSARY — 40 essential investing terms ─────────────────────────────────

interface GlossaryTerm {
  term: string
  def: string
  analogy: string
  example: string
  category: 'basics' | 'funds' | 'metrics' | 'risk' | 'tax'
}

const GLOSSARY: GlossaryTerm[] = [
  { term: 'SIP', def: 'Systematic Investment Plan — auto-investing a fixed amount every month.', analogy: 'Like a Netflix subscription, but for investing.', example: '₹500/month SIP for 10 years = ₹60,000 invested, grows to ~₹1.6L.', category: 'basics' },
  { term: 'NAV', def: 'Net Asset Value — the price of one unit of a mutual fund.', analogy: 'Like the price tag on one share of a group investment.', example: 'If NAV is ₹50 and you invest ₹500, you get 10 units.', category: 'funds' },
  { term: 'Mutual Fund', def: 'A pool of money from many investors, managed as one.', analogy: 'Like a potluck — everyone brings money, one chef invests it.', example: 'A Nifty 50 fund buys all 50 biggest companies with your ₹500.', category: 'funds' },
  { term: 'Index Fund', def: 'A fund that copies a market index exactly, no human decisions.', analogy: 'Like photocopying the top 50 companies list.', example: 'Nifty 50 Index Fund = owns all 50 Nifty companies. Expense: 0.1%.', category: 'funds' },
  { term: 'CAGR', def: 'Compound Annual Growth Rate — smoothed yearly growth rate.', analogy: 'If your plant grew unevenly, CAGR is the average growth per year.', example: '₹1L growing to ₹2L in 5 years = 14.87% CAGR.', category: 'metrics' },
  { term: 'XIRR', def: 'Extended Internal Rate of Return — your actual returns considering timing.', analogy: 'Like calculating real car speed including traffic stops.', example: 'XIRR of 14% means your money grew at 14%/year on average.', category: 'metrics' },
  { term: 'Expense Ratio', def: 'The annual fee a fund charges, taken from your returns.', analogy: 'Like a management fee your landlord charges on your flat.', example: '0.1% on ₹1L = ₹100/year. 2% = ₹2,000/year. Choose low.', category: 'funds' },
  { term: 'AUM', def: 'Assets Under Management — total money in a fund.', analogy: 'Like the total balance in a shared bank account.', example: 'SBI Nifty 50 Index Fund: AUM ₹5,000 Cr+.', category: 'funds' },
  { term: 'Nifty 50', def: 'Index of India\'s 50 largest companies by market cap.', analogy: 'India\'s stock market scoreboard — the top 50 players.', example: 'Includes Reliance, HDFC, Infosys, TCS, etc.', category: 'basics' },
  { term: 'Sensex', def: 'Index of 30 largest BSE-listed companies.', analogy: 'Like Nifty 50 but with fewer companies.', example: 'When news says "market up 500 points" — they usually mean Sensex.', category: 'basics' },
  { term: 'Lumpsum', def: 'Investing a large amount all at once instead of monthly.', analogy: 'Like paying full fees upfront vs. EMI.', example: '₹1L invested once vs ₹8,333/month for 12 months.', category: 'basics' },
  { term: 'Diversification', def: 'Spreading money across many investments to reduce risk.', analogy: 'Don\'t put all eggs in one basket.', example: 'Index fund = instant diversification across 50 stocks.', category: 'risk' },
  { term: 'Volatility', def: 'How much an investment\'s value goes up and down.', analogy: 'Like waves in the ocean — bigger waves = more volatility.', example: 'Nifty 50: 18% annual volatility, 14% average return.', category: 'risk' },
  { term: 'Returns', def: 'The profit or loss on your investment.', analogy: 'How much your money grew (or shrank).', example: '₹1L invested, now worth ₹1.2L = 20% return.', category: 'metrics' },
  { term: 'Portfolio', def: 'The collection of all your investments.', analogy: 'Like your playlist of songs — but with money.', example: '60% equity funds + 30% debt + 10% gold = a balanced portfolio.', category: 'basics' },
  { term: 'Equity', def: 'Ownership in a company through stocks.', analogy: 'Like owning a tiny piece of a big business.', example: 'Buying 1 share of Reliance = you own a tiny bit of Reliance.', category: 'basics' },
  { term: 'Debt Fund', def: 'A fund that invests in bonds and fixed-income securities.', analogy: 'Like lending money to companies — they pay you interest.', example: 'Debt fund returns: 6-8% vs FD: 6.8%.', category: 'funds' },
  { term: 'FD', def: 'Fixed Deposit — bank savings with guaranteed but low returns.', analogy: 'Like a safe locker that pays you a small rent.', example: '₹1L in FD at 6.8% for 10 years = ₹1.93L. After inflation: ₹1.09L.', category: 'basics' },
  { term: 'Inflation', def: 'The rate at which prices increase, reducing your money\'s value.', analogy: 'Your money\'s superpower slowly weakening over time.', example: '₹100 today buys what ₹60 bought 10 years ago (6% inflation).', category: 'risk' },
  { term: 'Compounding', def: 'Earning returns on your returns — exponential growth.', analogy: 'Like a snowball rolling downhill — gets bigger as it rolls.', example: '₹1L at 14% for 20 years = ₹13.7L. Most growth happens in last 5 years.', category: 'basics' },
  { term: 'Bull Market', def: 'When stock prices are rising steadily.', analogy: 'Like a bull charging upward with its horns.', example: '2017-2018: Nifty went from 8,500 to 11,000 — classic bull run.', category: 'basics' },
  { term: 'Bear Market', def: 'When stock prices fall 20%+ from recent highs.', analogy: 'Like a bear swiping downward with its paws.', example: 'March 2020: COVID crashed Nifty from 12,000 to 8,600 — bear market.', category: 'risk' },
  { term: 'P/E Ratio', def: 'Price-to-Earnings — how expensive a stock is vs its profits.', analogy: 'Like paying ₹20 vs ₹40 for a ₹1 earning dal shop.', example: 'Nifty 50 avg P/E: 22. Above 25 = expensive. Below 18 = cheap.', category: 'metrics' },
  { term: 'Dividend', def: 'Profit shared by a company with its shareholders.', analogy: 'Like getting a bonus from the company you partly own.', example: 'ITC pays ~₹6/share dividend yearly. Hold 100 shares = ₹600/year.', category: 'metrics' },
  { term: 'Liquidity', def: 'How quickly you can convert an investment to cash.', analogy: 'How fast you can sell your phone on OLX.', example: 'Mutual fund redemption: money in your bank in 1-3 days.', category: 'risk' },
  { term: 'Corpus', def: 'The total amount of money you\'ve accumulated.', analogy: 'Your investment piggy bank total.', example: '₹500/month for 20 years at 14% CAGR ≈ ₹9.5L corpus.', category: 'basics' },
  { term: 'KYC', def: 'Know Your Customer — identity verification for investing.', analogy: 'Like showing your ID to open a bank account.', example: 'PAN card + Aadhaar + selfie = KYC done in 10 minutes online.', category: 'basics' },
  { term: 'ELSS', def: 'Equity Linked Savings Scheme — tax-saving mutual fund.', analogy: 'Invest AND save tax — double benefit.', example: '₹1.5L in ELSS = up to ₹46,800 tax saved (30% bracket).', category: 'tax' },
  { term: 'Section 80C', def: 'Income tax deduction up to ₹1.5L for specified investments.', analogy: 'The government\'s "invest & save tax" coupon.', example: 'ELSS, PPF, EPF, NPS — all count under 80C.', category: 'tax' },
  { term: 'LTCG', def: 'Long Term Capital Gains — tax on profits held 1+ year.', analogy: 'Tax on patient investing — lower rate as a reward for holding.', example: 'Equity LTCG above ₹1L: taxed at 10%. ₹2L gain = ₹10,000 tax.', category: 'tax' },
  { term: 'STCG', def: 'Short Term Capital Gains — tax on profits held < 1 year.', analogy: 'Higher tax for impatient selling.', example: 'Equity STCG: taxed at 15%. ₹50,000 gain = ₹7,500 tax.', category: 'tax' },
  { term: 'AMC', def: 'Asset Management Company — the company that runs mutual funds.', analogy: 'Like the restaurant chain that manages all its branches.', example: 'SBI MF, HDFC MF, UTI MF — all are AMCs.', category: 'funds' },
  { term: 'SEBI', def: 'Securities and Exchange Board of India — the market regulator.', analogy: 'Like the traffic police of the stock market.', example: 'SEBI ensures no company can cheat investors. Protects your money.', category: 'basics' },
  { term: 'Demat Account', def: 'Digital account to hold stocks and securities electronically.', analogy: 'Like a digital wallet, but for stocks.', example: 'Open on Zerodha/Groww — takes 15 minutes.', category: 'basics' },
  { term: 'Folio', def: 'Your unique investor ID at a fund house.', analogy: 'Like your bank account number, but for mutual funds.', example: 'One folio can hold multiple schemes from the same AMC.', category: 'funds' },
  { term: 'Redemption', def: 'Selling your fund units to get cash back.', analogy: 'Cashing out your chips at the end of a game.', example: 'Redeem 100 units at NAV ₹50 = ₹5,000 in your bank in 2 days.', category: 'funds' },
  { term: 'SWP', def: 'Systematic Withdrawal Plan — auto-withdraw a fixed amount monthly.', analogy: 'Like a salary from your investments.', example: '₹50L corpus, ₹25,000/month SWP = 16+ years of income.', category: 'funds' },
  { term: 'Rebalancing', def: 'Adjusting your portfolio to maintain target allocation.', analogy: 'Like tuning your guitar — keep things in harmony.', example: 'Target: 70% equity, 30% debt. If equity grows to 80%, move 10% to debt.', category: 'risk' },
  { term: 'Direct Plan', def: 'Buying a fund directly from AMC — no distributor, lower fees.', analogy: 'Buying from the factory vs. a middleman shop.', example: 'Direct plan expense: 0.1%. Regular plan: 1.5%. You save ₹1,400/L/year.', category: 'funds' },
  { term: 'Exit Load', def: 'Fee charged if you redeem a fund before a set period.', analogy: 'Like a cancellation charge on a hotel booking.', example: 'Most equity funds: 1% exit load if redeemed within 1 year.', category: 'funds' },
  { term: 'Primary Market', def: 'Where companies sell shares directly to investors through IPOs.', analogy: 'Buying shoes directly from the Nike factory.', example: 'When Nykaa listed in 2021, investors bought shares from Nykaa directly.', category: 'basics' },
  { term: 'Secondary Market', def: 'Where investors trade shares with each other on stock exchanges.', analogy: 'Buying shoes from someone on OLX.', example: 'When you buy Reliance shares on Zerodha, you buy from another investor.', category: 'basics' },
  { term: 'NFO', def: 'New Fund Offer — when a mutual fund is launched for the first time.', analogy: 'Like a grand opening sale for a new shop.', example: 'During an NFO, units are usually offered at ₹10 each.', category: 'funds' },
  { term: 'Alpha', def: 'The extra return a fund generates over its benchmark index.', analogy: 'The bonus marks you get for studying smarter, not just longer.', example: 'If Nifty gave 10% and your fund gave 12%, your alpha is 2%.', category: 'metrics' },
  { term: 'Beta', def: 'How volatile a fund is compared to the overall market.', analogy: 'How much your boat rocks when the ocean has waves.', example: 'Beta of 1 = moves with market. Beta 1.2 = 20% more volatile.', category: 'risk' },
  { term: 'Tracking Error', def: 'How closely an index fund follows its benchmark.', analogy: 'How well a tribute band copies the original singer.', example: 'Lower tracking error is better. 0.05% is excellent.', category: 'metrics' },
  { term: 'Market Cap', def: 'Total value of all a company\'s shares combined.', analogy: 'The price tag to buy the entire company right now.', example: 'Reliance Market Cap > ₹19 Lakh Crore.', category: 'basics' },
  { term: 'Large Cap', def: 'Top 100 biggest companies in the stock market.', analogy: 'The giant, unsinkable cruise ships of the market.', example: 'TCS, HDFC Bank, Infosys. Stable but slower growth.', category: 'funds' },
  { term: 'Mid Cap', def: 'Companies ranked 101 to 250 by size.', analogy: 'Fast-moving speedboats. Can grow big, but rockier ride.', example: 'Trent, TVS Motor. Higher risk, higher potential return.', category: 'funds' },
  { term: 'Small Cap', def: 'Companies ranked 251st and below.', analogy: 'Tiny rafts. Can cross the ocean or sink quickly.', example: 'Very high volatility. Can double or half in months.', category: 'funds' },
]

const CATEGORY_LABELS: Record<string, string> = {
  basics: 'Basics', funds: 'Funds', metrics: 'Metrics', risk: 'Risk', tax: 'Tax',
}

// ── INVESTING ROADMAP ───────────────────────────────────────────────────────

interface RoadmapStep {
  step: number
  title: string
  description: string
  status: 'locked' | 'current' | 'done'
  icon: typeof Target
}

const ROADMAP_STEPS: Omit<RoadmapStep, 'status'>[] = [
  { step: 1, title: 'Understand your fear', description: 'Complete the Fear Profiler quiz', icon: Shield },
  { step: 2, title: 'Learn the basics', description: 'Kill 10 jargon words from the glossary', icon: BookOpen },
  { step: 3, title: 'See the math', description: 'Run your first SIP simulation', icon: Zap },
  { step: 4, title: 'Survive a crash', description: 'Complete the Time Machine experience', icon: Target },
  { step: 5, title: 'Ask your doubts', description: 'Have your first conversation with KINU', icon: Map },
  { step: 6, title: 'Start investing', description: 'Open a demat account → Start ₹500 SIP', icon: Target },
]

// ── FEAR-SPECIFIC MODULES ───────────────────────────────────────────────────

export interface Module {
  id: string
  title: string
  readTime: string
  content: React.ReactNode
}

import {
  VideoConcept, QuizModule, ChecklistModule, AppFeatureTour,
  CrashTimeline, SipSimulator, FDTrapInteractive, FirstHundred,
  SebiProtection, MoneyFlow, DueDiligenceChecklist,
  IndexFundExplainer, ActiveVsPassive, FeeCalculator, IndiaGrowth,
  SipExplainer, FundFactSheet,
} from '../../personalized/modules/RichModules'

export function getModulesForFear(fearType: FearType): Module[] {
  // Shared interactive setups so we don't repeat massive blocks
  const lossQuiz = [
    { q: '"My portfolio dropped 5%. I need to sell before it goes lower."', a: false, reason: 'Selling in a dip locks in temporary drops as permanent losses. That is exactly what your biology wants, but math forbids it.' },
    { q: '"I will wait for the market to crash, then invest a lump sum."', a: false, reason: 'Timing the market is statistically impossible. SIP investors who bought through the peak and the trough won.' },
    { q: '"My FD gives 7%. The market gives 14%, but FD feels safer."', a: false, reason: 'After 6.5% inflation, your FD yields 0.5% real return. The "safe" choice makes you poorer safely.' }
  ]
  const patternQuiz = [
    { q: '"WhatsApp group promising 100% returns in 3 months"', a: false, reason: 'Guaranteed massive returns are mathematically impossible. This is a ponzi.' },
    { q: '"SEBI registered index fund with total transparency"', a: true, reason: 'Regulated, audited, and transparent. The only boring way to build wealth.' },
    { q: '"This private algo-trading bot offers fixed daily payouts"', a: false, reason: 'Fixed payouts from dynamic markets via unregulated bots is the definition of a scam.' }
  ]
  const trustQuiz = [
    { q: '"A human fund manager carrying 2.5% fees will always beat the machine."', a: false, reason: 'Data proves 84% of active funds fail to beat the index. You pay 2.5% for underperformance.' },
    { q: '"An automated index fund simply buys the top 50 companies and charges 0.1%."', a: true, reason: 'No humans. Pure math. You keep the 2.4% difference.' }
  ]
  const jargonQuiz = [
    { q: '"I need to understand XIRR, CAGR, Alpha, and Beta before I invest my first ₹500."', a: false, reason: 'You just need to understand \'Index Fund\' and \'SIP\'. The rest is noise designed to make simple math seem complicated.' }
  ]

  switch (fearType) {
    case 'loss': return [
      { id: 'loss-1', title: 'Your Brain on Losses', readTime: '5 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" title="The Loss Aversion Bias" stats={[{label:'Pain multiplier',value:'2.5×'},{label:'Nifty 50 CAGR',value:'14%'},{label:'Crashes recovered',value:'100%'}]} content={<div className="space-y-3"><p>You were diagnosed with <strong className="text-white">Loss Aversion</strong> — you feel the pain of a ₹1,000 loss 2.5× more intensely than the joy of a ₹1,000 gain. Kahneman and Tversky proved this in 1979.</p><p>This trait kept your ancestors alive — running from a lion is more important than chasing a deer. But in the market, every instinct to <em>flee</em> during a crash is your biology costing you a decade of wealth.</p><p>The Nifty 50 has crashed over 20% exactly six times since 2000. It has recovered to new highs every single time.</p></div>} insight="Every time you want to sell during a red day, it's chemistry, not logic. Your amygdala fires before your prefrontal cortex can calculate recovery timelines." /> },
      { id: 'loss-2', title: 'Every Crash in History', readTime: '6 min', content: <CrashTimeline /> },
      { id: 'loss-3', title: 'The Market Rebound', readTime: '5 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" title="COVID-19: The 38% Crash" stats={[{label:'Peak drop',value:'−38%'},{label:'Recovery time',value:'6 mo'},{label:'SIP investor gain',value:'+68%'}]} content={<div className="space-y-3"><p>March 2020: the Nifty 50 fell from 12,000 to 7,500 in 40 days. Every news channel declared the end of the economy.</p><p>Investors who panic-sold locked in a 38% loss permanently. Investors with a ₹5,000/month SIP bought units at the cheapest price ever recorded — then watched those units triple in 18 months.</p><p>The SIP investor didn't need to time the bottom. The automation did it for them, every single month, without emotion.</p></div>} insight="A ₹5,000/month SIP started in Jan 2020 was worth ₹10.8L by Dec 2022 — on just ₹1.8L invested." /> },
      { id: 'loss-4', title: 'The SIP Engine', readTime: '5 min', content: <SipSimulator /> },
      { id: 'loss-5', title: 'Kinetic: Backtest the Fear', readTime: '4 min', content: <AppFeatureTour featureName="The Time Machine" explanation="Kinetic has a built-in time machine. It lets you simulate exactly what would have happened if you started investing at the absolute worst possible day in recent history. Run the 2008 crash. See what happened." steps={["Go to your Dashboard", "Tap 'Time Machine'", "Select '2008 Global Financial Crisis'", "Watch the SIP investor outperform the panic-seller by 340%"]} /> },
      { id: 'loss-6', title: 'The FD Trap', readTime: '8 min', content: <FDTrapInteractive /> },
      { id: 'loss-7', title: 'Your 10,000 Futures', readTime: '4 min', content: <AppFeatureTour featureName="Monte Carlo Fan Chart" explanation="Our AI simulates 10,000 possible futures based on historical variance — bull markets, crashes, and flat periods. The Fan Chart on your dashboard shows the 95% confidence band. Even the worst-case band shows significant profit over 15 years." steps={["Open an Active Goal on your dashboard", "Toggle 'Simulation Mode' on", "Observe the green band — your 95% worst-case", "The lowest line is still ~8× your investment at year 20"]} /> },
      { id: 'loss-8', title: 'Final Boss: Myth Buster', readTime: '4 min', content: <QuizModule questions={lossQuiz} /> },
      { id: 'loss-9', title: 'Your Defensive Protocol', readTime: '3 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" title="The Loss Avoider's Shield" stats={[{label:'Rule 1',value:'No panic'},{label:'Rule 2',value:'Stay SIP'},{label:'Rule 3',value:'Log out'}]} content={<div className="space-y-3"><p>Your defensive protocol is three rules: <strong className="text-white">No panic. Stay in SIP. Log out when red.</strong></p><p>When the market is bleeding, your only job is to ensure your bank account has enough balance for the SIP mandate to auto-trigger. That's it. The algorithm does the rest.</p><p>Delete market-tracking apps from your home screen. Check your portfolio quarterly, not daily. Every notification is an invitation to make a bad decision.</p></div>} insight="Studies show investors who check portfolios daily underperform those who check quarterly by 1.5% per year — purely due to emotional micro-decisions." /> },
      { id: 'loss-10', title: 'The Initiation', readTime: '2 min', content: <ChecklistModule items={["I understand that dips are discounts, not disasters", "I accept that 20 years of historical data beats my gut feeling", "I will never sell during a crash", "Ready to activate my ₹500 automated SIP"]} /> },
    ]
    
    // Provide structured paths for all other fears utilizing the customized prompts
    case 'scam': return [
      { id: 'pattern-1', title: 'The Pattern of Deception', readTime: '5 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" title="Pattern Recognition" stats={[{label:'Indians scammed/yr',value:'₹1,000Cr+'},{label:'SEBI registered funds',value:'44 AMCs'},{label:'Scam red flags',value:'5 signs'}]} content={<div className="space-y-3"><p>You were diagnosed as a <strong className="text-white">Pattern Detector</strong>. You saw people get burned by 12% guaranteed return schemes, and correctly pulled back. That instinct is correct.</p><p>But there is a massive difference between an unregulated Telegram bot promising fixed daily returns and the tightly regulated structure of the NSE, SEBI, and BSE Star MF clearing system.</p><p>The 5 scam red flags: ① guaranteed returns ② unlisted / unregistered ③ pressure to act fast ④ multi-level referrals ⑤ no withdrawal option.</p></div>} insight="Skepticism is your superpower. We will use it to verify the truth rather than avoid it." /> },
      { id: 'pattern-2', title: 'The SEBI Shield', readTime: '6 min', content: <SebiProtection /> },
      { id: 'pattern-3', title: 'Where Your Money Actually Goes', readTime: '5 min', content: <MoneyFlow /> },
      { id: 'pattern-4', title: 'The Scam-Proof Checklist', readTime: '4 min', content: <DueDiligenceChecklist /> },
      { id: 'pattern-5', title: 'Kinetic: Verify Everything', readTime: '4 min', content: <AppFeatureTour featureName="Live Market Verification" explanation="You don't need to trust Kinetic. Every NAV, every fund fact, every fee is pulled directly from SEBI-mandated AMFI feeds. You can cross-check every single number against public amfiindia.com data right from inside the app." steps={["Open any fund card in your portfolio", "Scroll to 'Data Source' at the bottom", "Tap the AMFI verification link", "Confirm the NAV matches the public registry"]} /> },
      { id: 'pattern-6', title: 'Boring Math, Extraordinary Results', readTime: '8 min', content: <FirstHundred /> },
      { id: 'pattern-7', title: 'Kinetic: The Fee X-Ray', readTime: '4 min', content: <AppFeatureTour featureName="Fee X-Ray" explanation="We hate hidden fees as much as you do. Every rupee lost to an expense ratio is shown to you clearly — across 5, 10, and 20-year compounded loss projections." steps={["Go to your holdings screen", "Tap 'Analyze Fees'", "See the full rupee cost of every middleman", "Compare vs index fund alternative"]} /> },
      { id: 'pattern-8', title: 'Final Boss: Scam Detector', readTime: '4 min', content: <QuizModule questions={patternQuiz} /> },
      { id: 'pattern-9', title: 'Your Defensive Protocol', readTime: '3 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" title="The Scam Detector Code" stats={[{label:'Not SEBI reg?',value:'Walk away'},{label:'Guaranteed %?',value:'Run'},{label:'Feels urgent?',value:'Its a scam'}]} content={<div className="space-y-3"><p>Your three-word defense: <strong className="text-white">Verify. Then verify again.</strong></p><p>If it is not SEBI registered it does not exist. If it guarantees a fixed return it is either lying or illegal. If someone is pressuring you to invest fast that is a manipulation tactic designed to bypass your pattern detection.</p><p>The boring index fund needs no urgency, no exclusivity, no Telegram group. It is open, public, and available tomorrow too.</p></div>} insight={"The best investment opportunity never needs you to act immediately. Real compounding rewards patience, not speed."} /> },
      { id: 'pattern-10', title: 'The Initiation', readTime: '2 min', content: <ChecklistModule items={["I can check SEBI registration at amfiindia.com", "I will never invest in anything with guaranteed returns", "I understand that true wealth is boring and slow", "Ready to activate my verified SIP"]} /> },
    ]

    case 'trust': return [
      { id: 'trust-1', title: 'The Human Failure', readTime: '5 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" title="Independence Guardian" stats={[{label:'Active funds beat index',value:'16%'},{label:'Extra fees charged',value:'1.9%/yr'},{label:'20yr wealth gap',value:'5.7x'}]} content={<div className="space-y-3"><p>You were diagnosed as an <strong className="text-white">Independence Guardian</strong>. You distrust giving your money to a third-party manager. Your instinct is statistically correct.</p><p>84% of actively managed funds underperform the Nifty 50 Index over a 10-year period. The remaining 16% that do beat it rarely do so consistently in the next decade.</p><p>Worse: they charge you 1.5 to 2.5% per year for this underperformance. On 10L over 20 years, that fee compounded costs you 57L in lost returns.</p></div>} insight={"Trusting a human with your money is not just philosophically wrong — it is mathematically catastrophic over time."} /> },
      { id: 'trust-2', title: 'The Autonomous Index', readTime: '6 min', content: <IndexFundExplainer /> },
      { id: 'trust-3', title: 'Active vs Passive: 20-Year Race', readTime: '5 min', content: <ActiveVsPassive /> },
      { id: 'trust-4', title: 'Kinetic: Zero-Touch Mode', readTime: '4 min', content: <AppFeatureTour featureName="Zero-Touch Automation" explanation="Kinetic is built for people who want zero human middlemen. You set the rules once. A UPI mandate executes directly with BSE Star MF — bypassing every human touchpoint. No agent. No advisor. No hidden commissions." steps={["Link your bank via a direct UPI mandate", "Set your index fund and monthly amount", "Kinetic authorizes directly with BSE Star MF clearing", "No humans touch your money — ever"]} /> },
      { id: 'trust-5', title: 'The Fee Drain Calculator', readTime: '8 min', content: <FeeCalculator /> },
      { id: 'trust-6', title: "Buy India's GDP", readTime: '8 min', content: <IndiaGrowth /> },
      { id: 'trust-7', title: 'Kinetic: Prove It Yourself', readTime: '4 min', content: <AppFeatureTour featureName="The Time Machine" explanation="Don't take our word for it. Run the historical backtest yourself. Select any passive index fund, set any 15-year window, and compare it against the average active fund from the same period." steps={["Select 'Time Machine' from the dashboard", "Choose 'Nifty 50 Index Fund (Passive)'", "Compare vs 'Large Cap Active Funds (Avg)'", "See the compound difference for yourself"]} /> },
      { id: 'trust-8', title: 'Final Boss: Independence Test', readTime: '4 min', content: <QuizModule questions={trustQuiz} /> },
      { id: 'trust-9', title: 'Your Autonomous Protocol', readTime: '3 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" title="The Algorithm Manifesto" stats={[{label:'Human fund managers',value:'Avoid'},{label:'Index algorithms',value:'Trust'},{label:'Fee threshold',value:'≤0.5%'}]} content={<div className="space-y-3"><p>Your investment strategy in one line: <strong className="text-white">Buy the index. Pay minimum fees. Never talk to an agent.</strong></p><p>The Nifty 50 index rebalances quarterly. It automatically kicks out companies that weaken and adds those that strengthen — with zero emotion, zero bias, zero commissions.</p><p>Every rupee you save in fees is a rupee that compounds at 14% for 20 years. A 1% fee saved on ₹5L is ₹19L by retirement.</p></div>} insight="Algorithms don't have bad days. They don't take commissions. They don't panic. They are objectively more trustworthy than any human portfolio manager." /> },
      { id: 'trust-10', title: 'The Initiation', readTime: '2 min', content: <ChecklistModule items={["I will never pay more than 0.5% expense ratio", "I only invest in direct growth plan index funds", "I have deleted my broker's number", "Ready to activate my fully autonomous ₹500 SIP"]} /> },
    ]

    case 'jargon': return [
      { id: 'clarity-1', title: 'The Illusion of Complexity', readTime: '5 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" title="Clarity Seeker" stats={[{label:'Words you actually need',value:'2'},{label:'Finance jargon terms',value:'300+'},{label:'Nifty 50 avg return',value:'14%'}]} content={<div className="space-y-3"><p>You were diagnosed as a <strong className="text-white">Clarity Seeker</strong>. The industry throws 'Alpha', 'Beta', 'XIRR', 'Sharpe Ratio', and 'Arbitrage' at you — and you froze.</p><p>That was intentional. Complex language creates dependency on "experts" who charge you for decoding it. The dirty secret: you need exactly two concepts to build life-changing wealth.</p><p><strong className="text-white">1. Index Fund.</strong> <strong className="text-white">2. SIP.</strong> Everything else is noise designed to extract your money.</p></div>} insight="Every extra word of jargon between you and investing is money that didn't compound for another year." /> },
      { id: 'clarity-2', title: 'Only 2 Words Matter', readTime: '6 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" title="The 2-Word Formula" stats={[{label:'Word 1',value:'Index Fund'},{label:'Word 2',value:'SIP'},{label:'Everything else',value:'Ignore'}]} content={<div className="space-y-4"><p><strong className="text-white">Index Fund:</strong> A basket that automatically owns the top 50 biggest companies in India. No human picks. No emotions. Pure market ownership.</p><p><strong className="text-white">SIP (Systematic Investment Plan):</strong> Buying a tiny, fixed piece of that basket every single month automatically — like a subscription, but you get back multi-fold.</p><p>That combination, started at ₹500/month, has turned into lakhs for ordinary Indians over 15 years. No MBA required.</p></div>} insight="Warren Buffett — the world's greatest investor — recommends index funds for 99% of people. That includes you." /> },
      { id: 'clarity-3', title: 'How Your ₹500 SIP Actually Works', readTime: '5 min', content: <SipExplainer /> },
      { id: 'clarity-4', title: 'The Power of ₹100/Month', readTime: '8 min', content: <FirstHundred /> },
      { id: 'clarity-5', title: 'Kinetic: Jargon-Free Mode', readTime: '4 min', content: <AppFeatureTour featureName="KINU AI Mentor" explanation="KINU is programmed to never use financial jargon. Ask him anything and he'll explain it with analogies from cricket, chai, or Bollywood. He's the anti-broker — designed to demystify, not confuse." steps={["Tap the green 'K' bubble anywhere in the app", "Ask 'What is NAV?' or 'What is XIRR?'", "Get an explanation using pizza, cricket, or chai analogies", "Ask follow-ups until it's crystal clear"]} /> },
      { id: 'clarity-6', title: 'Reading a Fund Sheet: 3 Numbers', readTime: '8 min', content: <FundFactSheet /> },
      { id: 'clarity-7', title: 'Kinetic: Your Clean Dashboard', readTime: '4 min', content: <AppFeatureTour featureName="The Clean Dashboard" explanation="Your dashboard shows exactly three things: what you put in, what it grew to, and when you'll hit your goal. No red-green ticker chaos. No confusing percentages. Just your money, growing." steps={["Open your Dashboard", "See the Net Worth growth circle", "Check your 'Goal Timeline' — one number, one date", "That's all you need to know"]} /> },
      { id: 'clarity-8', title: 'Final Boss: Jargon Buster', readTime: '4 min', content: <QuizModule questions={jargonQuiz} /> },
      { id: 'clarity-9', title: 'Your Clarity Protocol', readTime: '3 min', content: <VideoConcept videoSrc="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" title="The Clarity Manifesto" stats={[{label:'Decision rule',value:'1 sentence'},{label:'Funds needed',value:'1 index'},{label:'Action needed',value:'1 SIP'}]} content={<div className="space-y-3"><p>Your rule for life: <strong className="text-white">If you can't explain it in one sentence, don't invest in it.</strong></p><p>"I invest ₹500/month into a Nifty 50 Index Fund via SIP." That is a complete, valid, world-class investment strategy. Nothing more needed.</p><p>Anyone who tells you otherwise is selling you something — either a product with high fees, or their own sense of superiority.</p></div>} insight="The most profitable investors are often the ones who do the least — because they resisted the urge to complicate a simple system." /> },
      { id: 'clarity-10', title: 'The Initiation', readTime: '2 min', content: <ChecklistModule items={["I will ignore all financial jargon on TV and YouTube", "I know Index Fund + SIP is all I need", "I can explain my entire investment strategy in one sentence", "Ready to activate my ₹500 monthly SIP"]} /> },
    ]
  }
}




// ── MAIN LEARN PAGE ─────────────────────────────────────────────────────────

export default function LearnPage() {
  const navigate = useNavigate()
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const completedModules = useAppStore(s => s.completedModules)
  const simulationResult = useAppStore(s => s.simulationResult)
  const timeMachineResult = useAppStore(s => s.timeMachineResult)

  const [activeTab, setActiveTab] = useState<'roadmap' | 'glossary' | 'modules'>('modules')
  const [search, setSearch] = useState('')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState<string>('all')

  const trackName = TRACK_NAMES[fearType as FearTrack] || 'Your Track'

  // Glossary search + filter
  const filteredGlossary = useMemo(() => {
    let list = GLOSSARY
    if (catFilter !== 'all') list = list.filter(t => t.category === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q))
    }
    return list
  }, [search, catFilter])

  // Roadmap status
  const roadmap: RoadmapStep[] = ROADMAP_STEPS.map(s => ({
    ...s,
    status: s.step === 1 ? 'done'
      : s.step === 2 ? ((completedModules || []).length >= 10 ? 'done' : 'current')
        : s.step === 3 ? (simulationResult ? 'done' : 'current')
          : s.step === 4 ? (timeMachineResult ? 'done' : simulationResult ? 'current' : 'locked')
            : s.step <= 3 ? 'locked' : 'locked',
  }))

  const tabs = [
    { id: 'modules' as const, label: `${trackName} Track`, icon: Target },
    { id: 'roadmap' as const, label: 'Roadmap', icon: Map },
    { id: 'glossary' as const, label: 'Glossary', icon: BookOpen },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      {/* News Impact Card */}
      <div className="mb-6">
        <NewsImpactCard context="learn" fearType={fearType} />
      </div>

      {/* 3D Roadmap Explorer Portal */}
      <button 
        onClick={() => navigate('/dashboard/roadmap')}
        className="w-full relative overflow-hidden rounded-[32px] p-8 border text-left mb-6 transition-[transform,border-color] duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-xl group cursor-pointer"
        style={{ 
          background: 'var(--surface)', 
          borderColor: 'rgba(255,255,255,0.08)',
          backgroundImage: 'linear-gradient(to bottom right, rgba(192,241,142,0.05), transparent)'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
             <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center border border-white/10 shadow-inner" style={{ background: 'rgba(255,255,255,0.03)' }}>
               <span className="text-xl">🗺️</span>
             </div>
             <h2 className="font-display font-semibold text-2xl text-white tracking-tight mb-2">Explore the 3D Curriculum Track</h2>
             <p className="font-sans text-white/50 text-sm max-w-md">Embark on your financial journey through an immersive isometric roadmap. Play modules natively inside the 3D interface.</p>
           </div>
           
           <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/5 transition-colors bg-black/20 self-end md:self-auto">
             <ChevronRight className="w-5 h-5 text-white/70" />
           </div>
        </div>
      </button>

      {/* Calculator Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard/compare')}
          className="rounded-2xl p-5 border text-left transition-all duration-200 hover:border-white/12 group"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(55,138,221,0.08)' }}>
              <span className="text-sm">📊</span>
            </div>
            <h3 className="font-sans text-sm font-medium text-white/70 group-hover:text-white transition-colors">SIP vs FD vs Lumpsum</h3>
          </div>
          <p className="font-sans text-xs text-white/30">Compare 14% Nifty CAGR against fixed deposits. Interactive chart.</p>
        </button>
        <button
          onClick={() => navigate('/dashboard/calculators')}
          className="rounded-2xl p-5 border text-left transition-all duration-200 hover:border-white/12 group"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.08)' }}>
              <span className="text-sm">🧮</span>
            </div>
            <h3 className="font-sans text-sm font-medium text-white/70 group-hover:text-white transition-colors">SIP & SWP Calculators</h3>
          </div>
          <p className="font-sans text-xs text-white/30">Plan your wealth building. Step-up SIP, withdrawal planning, breakeven rates.</p>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-200 border shrink-0"
              style={{
                background: isActive ? 'rgba(192,241,142,0.07)' : 'var(--surface)',
                borderColor: isActive ? 'rgba(192,241,142,0.18)' : 'var(--border)',
                color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── ROADMAP TAB ──────────────────────────────────────────────── */}
        {activeTab === 'roadmap' && (
          <motion.div key="roadmap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="font-display font-semibold text-xl text-white mb-2">Your Investing Roadmap</h2>
            <p className="font-sans text-sm text-white/40 mb-8">6 steps from zero to your first SIP.</p>

            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-5 top-8 bottom-8 w-[2px]" style={{ background: 'var(--border)' }} />

              {roadmap.map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="relative flex items-start gap-5 pb-8"
                  >
                    {/* Dot */}
                    <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border" style={{
                      background: step.status === 'done' ? 'rgba(29,158,117,0.12)' : step.status === 'current' ? 'rgba(192,241,142,0.10)' : 'var(--surface)',
                      borderColor: step.status === 'done' ? 'rgba(29,158,117,0.3)' : step.status === 'current' ? 'rgba(192,241,142,0.25)' : 'var(--border)',
                    }}>
                      {step.status === 'done' ? <Check className="w-4 h-4" style={{ color: 'var(--teal)' }} /> : <Icon className="w-4 h-4" style={{ color: step.status === 'current' ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }} />}
                    </div>
                    {/* Content */}
                    <div className="rounded-2xl p-5 border flex-1" style={{
                      background: step.status === 'current' ? 'rgba(192,241,142,0.04)' : 'var(--surface)',
                      borderColor: step.status === 'current' ? 'rgba(192,241,142,0.12)' : 'var(--border)',
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold" style={{ color: step.status === 'done' ? 'var(--teal)' : step.status === 'current' ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}>STEP {step.step}</span>
                        {step.status === 'done' && <span className="text-[9px] font-sans px-2 py-0.5 rounded-full" style={{ background: 'rgba(29,158,117,0.1)', color: 'var(--teal)' }}>Done</span>}
                        {step.status === 'current' && <span className="text-[9px] font-sans px-2 py-0.5 rounded-full" style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>Current</span>}
                      </div>
                      <p className="font-display font-medium text-sm text-white mb-1">{step.title}</p>
                      <p className="font-sans text-xs text-white/35">{step.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── GLOSSARY TAB ─────────────────────────────────────────────── */}
        {activeTab === 'glossary' && (
          <motion.div key="glossary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="font-display font-semibold text-xl text-white mb-2">The Glossary</h2>
            <p className="font-sans text-sm text-white/40 mb-6">{GLOSSARY.length} essential terms. Search or browse by category.</p>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search terms..."
                className="w-full bg-transparent border rounded-xl pl-11 pr-4 py-3 font-sans text-sm text-white outline-none placeholder:text-white/20 focus:border-[var(--border-bright)] transition-[border-color] duration-200"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['all', 'basics', 'funds', 'metrics', 'risk', 'tax'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-sans font-medium border transition-[background-color,border-color,color] duration-200"
                  style={{
                    background: catFilter === cat ? 'rgba(192,241,142,0.07)' : 'transparent',
                    borderColor: catFilter === cat ? 'rgba(192,241,142,0.18)' : 'var(--border)',
                    color: catFilter === cat ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Results count */}
            <p className="font-sans text-xs text-white/25 mb-4">{filteredGlossary.length} terms</p>

            {/* Term list */}
            <div style={{ height: '480px', overflowY: 'scroll', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }} className="space-y-1 pr-2">
              {filteredGlossary.map(t => {
                const isOpen = expandedTerm === t.term
                return (
                  <div key={t.term}>
                    <button
                      onClick={() => setExpandedTerm(isOpen ? null : t.term)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border transition-[background-color,border-color] duration-200"
                      style={{
                        background: isOpen ? 'rgba(192,241,142,0.04)' : 'var(--surface)',
                        borderColor: isOpen ? 'rgba(192,241,142,0.12)' : 'var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display font-semibold text-sm text-white">{t.term}</span>
                        <span className="text-[9px] font-sans px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>
                          {CATEGORY_LABELS[t.category]}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-white/20 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 ml-4 border-l-2 space-y-2" style={{ borderColor: 'var(--accent)' }}>
                            <p className="font-sans text-sm text-white/60">{t.def}</p>
                            <p className="font-sans text-xs text-white/35"><span style={{ color: 'var(--accent)' }}>Analogy:</span> {t.analogy}</p>
                            <p className="font-sans text-xs text-white/35"><span style={{ color: 'var(--teal)' }}>Example:</span> {t.example}</p>
                            {t.term === 'XIRR' && (
                              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}><XIRRExplainer /></div>
                            )}
                            {(t.term === 'Primary Market' || t.term === 'Secondary Market') && (
                              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}><MarketExplainer /></div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
              {filteredGlossary.length === 0 && <p className="font-sans text-sm text-white/30 text-center py-8">No terms match your search.</p>}
            </div>
          </motion.div>
        )}

        {/* ── MODULES TAB ──────────────────────────────────────────────── */}
        {activeTab === 'modules' && (
          <motion.div key="modules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* FY Comparison Card */}
            <FYComparison />

            {/* Copy the Market */}
            <CopyTheMarket />

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
