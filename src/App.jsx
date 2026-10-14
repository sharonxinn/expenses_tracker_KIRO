import { useState, useEffect, useMemo } from 'react'
import {
  PlusCircle, Trash2, TrendingUp, TrendingDown, Wallet,
  ChevronLeft, ChevronRight, Search, LayoutDashboard,
  Receipt, BarChart3, Sparkles
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

// ── Constants ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'expenses_tracker_react_v1'
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']

const CATEGORIES = {
  food:           { icon: '🍔', label: 'Food',           color: '#f59e0b', type: 'expense' },
  transport:      { icon: '🚗', label: 'Transport',      color: '#3b82f6', type: 'expense' },
  housing:        { icon: '🏠', label: 'Housing',        color: '#8b5cf6', type: 'expense' },
  health:         { icon: '💊', label: 'Health',         color: '#ef4444', type: 'expense' },
  entertainment:  { icon: '🎬', label: 'Entertainment',  color: '#ec4899', type: 'expense' },
  shopping:       { icon: '🛍️', label: 'Shopping',       color: '#f97316', type: 'expense' },
  utilities:      { icon: '💡', label: 'Utilities',      color: '#06b6d4', type: 'expense' },
  education:      { icon: '📚', label: 'Education',      color: '#10b981', type: 'expense' },
  other:          { icon: '📦', label: 'Other',          color: '#6b7280', type: 'expense' },
  salary:         { icon: '💼', label: 'Salary',         color: '#22c55e', type: 'income' },
  freelance:      { icon: '🖥️', label: 'Freelance',      color: '#34d399', type: 'income' },
  investment:     { icon: '📈', label: 'Investment',     color: '#a3e635', type: 'income' },
  gift:           { icon: '🎁', label: 'Gift',           color: '#fb7185', type: 'income' },
  'other-income': { icon: '💵', label: 'Other Income',   color: '#4ade80', type: 'income' },
}

const DEMO_DATA = (y, m) => [
  { id: '1', desc: 'Monthly Salary',       amount: 3500,  category: 'salary',       type: 'income',  date: new Date(y,m,1).toISOString() },
  { id: '2', desc: 'Grocery Shopping',     amount: 148,   category: 'food',         type: 'expense', date: new Date(y,m,3).toISOString() },
  { id: '3', desc: 'Netflix',              amount: 15.99, category: 'entertainment',type: 'expense', date: new Date(y,m,5).toISOString() },
  { id: '4', desc: 'Grab to Office',       amount: 22,    category: 'transport',    type: 'expense', date: new Date(y,m,7).toISOString() },
  { id: '5', desc: 'Freelance Project',    amount: 800,   category: 'freelance',    type: 'income',  date: new Date(y,m,8).toISOString() },
  { id: '6', desc: 'Electricity Bill',     amount: 85,    category: 'utilities',    type: 'expense', date: new Date(y,m,10).toISOString() },
  { id: '7', desc: 'Team Lunch',           amount: 38,    category: 'food',         type: 'expense', date: new Date(y,m,12).toISOString() },
  { id: '8', desc: 'Online Course',        amount: 49,    category: 'education',    type: 'expense', date: new Date(y,m,13).toISOString() },
  { id: '9', desc: 'Gym Membership',       amount: 45,    category: 'health',       type: 'expense', date: new Date(y,m,15).toISOString() },
  { id:'10', desc: 'Amazon Shopping',      amount: 120,   category: 'shopping',     type: 'expense', date: new Date(y,m,18).toISOString() },
]

function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon: Icon, color, glow, trend }) {
  return (
    <div className={`glass rounded-2xl p-5 flex flex-col gap-3 ${glow}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight" style={{ color: trend }}>{value}</div>
    </div>
  )
}

function TransactionItem({ tx, onDelete }) {
  const meta = CATEGORIES[tx.category] || { icon: '📦', label: tx.category, color: '#6b7280' }
  const date = new Date(tx.date)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="glass glass-hover rounded-xl px-4 py-3 flex items-center gap-4 group transition-all duration-200">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: meta.color + '22' }}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-slate-200 truncate">{tx.desc}</div>
        <div className="text-xs text-slate-500 mt-0.5">{meta.label} · {dateStr}</div>
      </div>
      <div className={`font-bold text-sm flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
      </div>
      <button
        onClick={() => onDelete(tx.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400 flex-shrink-0 ml-1"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 text-xs">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const now = new Date()
  const [transactions, setTransactions] = useState([])
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')

  // form state
  const [desc, setDesc]     = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [txType, setTxType] = useState('expense')
  const [errors, setErrors] = useState({})

  // load + seed
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.transactions?.length > 0) {
          setTransactions(saved.transactions)
          return
        }
      }
    } catch(e) {}
    setTransactions(DEMO_DATA(now.getFullYear(), now.getMonth()))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions }))
  }, [transactions])

  // derived
  const monthTx = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() === month
    }), [transactions, year, month])

  const income  = useMemo(() => monthTx.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0), [monthTx])
  const expense = useMemo(() => monthTx.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0), [monthTx])
  const balance = income - expense
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  const visible = useMemo(() => {
    let list = [...monthTx]
    if (filter !== 'all') list = list.filter(t => t.type === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.desc.toLowerCase().includes(q) ||
        (CATEGORIES[t.category]?.label || '').toLowerCase().includes(q)
      )
    }
    return list.sort((a,b) => new Date(b.date) - new Date(a.date))
  }, [monthTx, filter, search])

  // pie chart data
  const pieData = useMemo(() => {
    const byCategory = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
    })
    return Object.entries(byCategory)
      .map(([cat, value]) => ({ name: CATEGORIES[cat]?.label || cat, value, color: CATEGORIES[cat]?.color || '#6b7280' }))
      .sort((a,b) => b.value - a.value)
      .slice(0,6)
  }, [monthTx])

  // 6-month trend
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      let m = month - (5 - i)
      let y = year
      if (m < 0) { m += 12; y-- }
      const txs = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getFullYear() === y && d.getMonth() === m
      })
      return {
        month: MONTHS[m],
        Income: txs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0),
        Expenses: txs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0),
      }
    })
  }, [transactions, year, month])

  // month nav
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // add
  const handleAdd = () => {
    const errs = {}
    if (!desc.trim()) errs.desc = true
    if (!amount || parseFloat(amount) <= 0) errs.amount = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setTransactions(prev => [...prev, {
      id: crypto.randomUUID(),
      desc: desc.trim(),
      amount: parseFloat(amount),
      category,
      type: txType,
      date: new Date().toISOString(),
    }])
    setDesc(''); setAmount('')
  }

  const handleDelete = (id) => setTransactions(prev => prev.filter(t => t.id !== id))

  const expCategories = Object.entries(CATEGORIES).filter(([,v]) => v.type === 'expense')
  const incCategories = Object.entries(CATEGORIES).filter(([,v]) => v.type === 'income')

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="gradient-text">Expenses</span>
              <span className="text-slate-200"> Tracker</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage your finances with clarity</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="glass w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-200 min-w-[120px] text-center">
              {MONTHS_FULL[month]} {year}
            </span>
            <button onClick={nextMonth} className="glass w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        {/* Tab nav */}
        <nav className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'transactions', icon: Receipt, label: 'Transactions' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Total Income"  value={fmt(income)}  icon={TrendingUp}   color="bg-emerald-500/20 text-emerald-400" glow="glow-income"  trend="#4ade80" />
              <SummaryCard label="Total Expenses" value={fmt(expense)} icon={TrendingDown} color="bg-red-500/20 text-red-400"         glow="glow-expense" trend="#f87171" />
              <SummaryCard label="Net Balance"    value={fmt(balance)} icon={Wallet}       color="bg-indigo-500/20 text-indigo-400"   glow="glow-accent"  trend={balance >= 0 ? '#4ade80' : '#f87171'} />
              <SummaryCard label="Savings Rate"   value={`${savingsRate}%`} icon={Sparkles} color="bg-purple-500/20 text-purple-400"  glow=""             trend="#c084fc" />
            </div>

            {/* Add form */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Add Transaction</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-1">
                  <input
                    className={`input-field w-full rounded-xl px-4 py-3 text-sm ${errors.desc ? 'border-red-500' : ''}`}
                    placeholder="Description"
                    value={desc}
                    onChange={e => { setDesc(e.target.value); setErrors(p => ({...p, desc: false})) }}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    className={`input-field w-full rounded-xl px-4 py-3 text-sm ${errors.amount ? 'border-red-500' : ''}`}
                    placeholder="Amount ($)"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setErrors(p => ({...p, amount: false})) }}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    min="0.01" step="0.01"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="input-field flex-1 rounded-xl px-3 py-3 text-sm"
                    value={txType}
                    onChange={e => { setTxType(e.target.value); setCategory(e.target.value === 'expense' ? 'food' : 'salary') }}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <select
                    className="input-field flex-1 rounded-xl px-3 py-3 text-sm"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {(txType === 'expense' ? expCategories : incCategories).map(([k,v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAdd}
                  className="btn-primary text-white rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <PlusCircle size={16} /> Add Transaction
                </button>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Recent Transactions</h2>
              {visible.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No transactions this month. Add one above!</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                  {visible.slice(0,8).map(tx => (
                    <TransactionItem key={tx.id} tx={tx} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {/* Add form */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Add Transaction</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  className={`input-field rounded-xl px-4 py-3 text-sm ${errors.desc ? 'border-red-500' : ''}`}
                  placeholder="Description"
                  value={desc}
                  onChange={e => { setDesc(e.target.value); setErrors(p => ({...p, desc: false})) }}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <input
                  type="number"
                  className={`input-field rounded-xl px-4 py-3 text-sm ${errors.amount ? 'border-red-500' : ''}`}
                  placeholder="Amount ($)"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setErrors(p => ({...p, amount: false})) }}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  min="0.01" step="0.01"
                />
                <div className="flex gap-2">
                  <select className="input-field flex-1 rounded-xl px-3 py-3 text-sm" value={txType} onChange={e => { setTxType(e.target.value); setCategory(e.target.value === 'expense' ? 'food' : 'salary') }}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <select className="input-field flex-1 rounded-xl px-3 py-3 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
                    {(txType === 'expense' ? expCategories : incCategories).map(([k,v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleAdd} className="btn-primary text-white rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2">
                  <PlusCircle size={16} /> Add
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              {['all','income','expense'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filter === f ? 'bg-indigo-600 text-white' : 'glass text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <div className="relative ml-auto">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="input-field rounded-full pl-9 pr-4 py-2 text-sm w-48"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* List */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">All Transactions</h2>
                <span className="text-xs text-slate-500 glass px-3 py-1 rounded-full">{visible.length} items</span>
              </div>
              {visible.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">No transactions found.</div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
                  {visible.map(tx => (
                    <TransactionItem key={tx.id} tx={tx} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* 6-month trend */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">6-Month Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '$'+v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Income"   stroke="#22c55e" strokeWidth={2} fill="url(#gIncome)"  />
                  <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie + breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-5">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Spending by Category</h2>
                {pieData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">No expense data this month.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'12px', color:'#e2e8f0' }} />
                      <Legend formatter={(v) => <span style={{color:'#94a3b8',fontSize:'12px'}}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="glass rounded-2xl p-5">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Category Breakdown</h2>
                {pieData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">No data.</div>
                ) : (
                  <div className="space-y-3">
                    {pieData.map(item => {
                      const pct = expense > 0 ? Math.round((item.value / expense) * 100) : 0
                      return (
                        <div key={item.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-300">{item.name}</span>
                            <span className="text-slate-400">{fmt(item.value)} <span className="text-slate-600">({pct}%)</span></span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: item.color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Month summary */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Month Summary — {MONTHS_FULL[month]} {year}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{fmt(income)}</div>
                  <div className="text-xs text-slate-500 mt-1">Total Income</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{fmt(expense)}</div>
                  <div className="text-xs text-slate-500 mt-1">Total Expenses</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(balance)}</div>
                  <div className="text-xs text-slate-500 mt-1">Net Balance</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{savingsRate}%</div>
                  <div className="text-xs text-slate-500 mt-1">Savings Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
