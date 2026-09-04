'use client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users2, Building2, Briefcase, ListChecks, FileText,
  ShieldAlert, Package, Handshake, CalendarClock, BarChart3, Sparkles,
  Search, Bell, Menu, ChevronLeft, Plus, TrendingUp, Target, DollarSign,
  Award, FileCheck2, Clock, AlertTriangle, ShieldCheck, Activity as ActIcon,
  X, Send, Loader2, Filter, MoreHorizontal
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const STAGES = ['Prospecting','Discovery','Consultative Meeting','Solution Design','Proposal Submitted','Negotiation','PO/SPK','Implementation','Closed Won','Closed Lost'];
const STAGE_COLORS = {
  'Prospecting':'bg-slate-100 text-slate-700 border-slate-300',
  'Discovery':'bg-sky-50 text-sky-700 border-sky-200',
  'Consultative Meeting':'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Solution Design':'bg-violet-50 text-violet-700 border-violet-200',
  'Proposal Submitted':'bg-blue-50 text-blue-700 border-blue-200',
  'Negotiation':'bg-amber-50 text-amber-700 border-amber-200',
  'PO/SPK':'bg-orange-50 text-orange-700 border-orange-200',
  'Implementation':'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Closed Won':'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Closed Lost':'bg-rose-50 text-rose-700 border-rose-200'
};
const INDUSTRIES = ['Healthcare','Military','Government','Education','Industrial Estate','BUMN','Private Enterprise'];
const PRODUCTS = ['SIMRS Digicare','IFMS Enterprise','ERP Enterprise Platform','Smart Manufacturing Platform','Smart Campus Platform','Command Center','GIS Platform','Network Infrastructure','CCTV AI Surveillance','IoT Platform','RFID System','API Gateway','Mobile Super App'];
const PARTNERS = ['Huawei','Cisco','Fortinet','Mikrotik','Dell','HPE','Lenovo','Local Distributor'];

const CHART_COLORS = ['#2563EB','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899'];

function fmtIDR(n) {
  if (n == null) return '-';
  if (n >= 1e9) return `Rp ${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `Rp ${(n/1e6).toFixed(1)}M`;
  return `Rp ${n.toLocaleString()}`;
}

function NAV_ITEMS() { return [
  { key: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { key: 'crm', label: 'CRM Pipeline', icon: Briefcase },
  { key: 'orgs', label: 'Organizations', icon: Building2 },
  { key: 'stakeholders', label: 'Stakeholders', icon: Users2 },
  { key: 'projects', label: 'Project Intelligence', icon: ListChecks },
  { key: 'activities', label: 'Activity Timeline', icon: CalendarClock },
  { key: 'proposals', label: 'Proposal Center', icon: FileText },
  { key: 'risks', label: 'Risk Register', icon: ShieldAlert },
  { key: 'products', label: 'Product Catalog', icon: Package },
  { key: 'partners', label: 'Partnerships', icon: Handshake },
  { key: 'reports', label: 'Reporting Center', icon: BarChart3 },
]; }

function Sidebar({ collapsed, setCollapsed, current, setCurrent }) {
  return (
    <aside className={`gradient-navy text-slate-200 flex flex-col transition-all duration-200 ${collapsed?'w-16':'w-64'} shrink-0`}>
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shrink-0">
          <span className="text-white font-bold">D</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-semibold text-sm leading-tight">DIGICARE</div>
            <div className="text-[10px] text-slate-400 leading-tight">BDIP Enterprise</div>
          </div>
        )}
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS().map(item => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <button key={item.key} onClick={()=>setCurrent(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active?'bg-blue-600/20 text-white border-l-2 border-blue-400':'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-2 border-t border-white/10">
        <button onClick={()=>setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white text-xs py-2 rounded-lg hover:bg-white/5">
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed?'rotate-180':''}`} />
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  );
}

function TopBar({ onMenu, onAI, onSearch }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30">
      <button className="md:hidden text-slate-600" onClick={onMenu}><Menu className="w-5 h-5"/></button>
      <div className="flex-1 max-w-xl relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <Input placeholder="Search opportunities, organizations, activities…" className="pl-9 bg-slate-50 border-slate-200 h-10" onChange={e=>onSearch?.(e.target.value)}/>
      </div>
      <Button variant="outline" size="sm" onClick={onAI} className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
        <Sparkles className="w-4 h-4"/> AI Assistant
      </Button>
      <button className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center">
        <Bell className="w-4 h-4 text-slate-600"/>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full"/>
      </button>
      <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
        <Avatar className="w-8 h-8"><AvatarFallback className="bg-blue-600 text-white text-xs">EX</AvatarFallback></Avatar>
        <div className="hidden md:block">
          <div className="text-sm font-semibold text-slate-900 leading-tight">Exec Demo</div>
          <div className="text-[11px] text-slate-500 leading-tight">Super Admin</div>
        </div>
      </div>
    </header>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tone='blue' }) {
  const tones = {
    blue:'from-blue-500 to-blue-600 bg-blue-50 text-blue-600',
    emerald:'from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-600',
    orange:'from-orange-500 to-orange-600 bg-orange-50 text-orange-600',
    violet:'from-violet-500 to-violet-600 bg-violet-50 text-violet-600',
    rose:'from-rose-500 to-rose-600 bg-rose-50 text-rose-600',
    slate:'from-slate-500 to-slate-600 bg-slate-100 text-slate-600'
  };
  const parts = tones[tone].split(' ');
  return (
    <Card className="card-shadow card-shadow-hover border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
            {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${parts.slice(2).join(' ')}`}>
            <Icon className="w-5 h-5"/>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard({ data, onOpenAI }) {
  if (!data) return <div className="p-8 text-slate-500">Loading…</div>;
  const k = data.kpis;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time business development intelligence for PT. Elefan Adiwidia Bentala</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Filter className="w-4 h-4"/>Filters</Button>
          <Button size="sm" onClick={onOpenAI} className="bg-blue-600 hover:bg-blue-700 gap-2"><Sparkles className="w-4 h-4"/>AI Executive Insight</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={Target} label="Total Opportunity" value={k.totalOpportunity} tone="blue"/>
        <KpiCard icon={Briefcase} label="Active Projects" value={k.activeProjects} tone="violet"/>
        <KpiCard icon={DollarSign} label="Pipeline Value" value={fmtIDR(k.pipelineValue)} tone="emerald"/>
        <KpiCard icon={TrendingUp} label="Expected Revenue" value={fmtIDR(k.expectedRevenue)} tone="emerald"/>
        <KpiCard icon={Award} label="Win Rate" value={`${k.winRate}%`} tone="orange"/>
        <KpiCard icon={FileCheck2} label="Proposal Submitted" value={k.proposalSubmitted} tone="blue"/>
        <KpiCard icon={ShieldCheck} label="Proposal Accepted" value={k.proposalAccepted} tone="emerald"/>
        <KpiCard icon={CalendarClock} label="Follow Up Today" value={k.followUpToday} tone="orange"/>
        <KpiCard icon={Clock} label="Overdue Activity" value={k.overdueActivity} tone="rose"/>
        <KpiCard icon={AlertTriangle} label="Open Risks" value={k.riskCount} tone="rose"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-shadow border-slate-200">
          <CardHeader><CardTitle className="text-base">Revenue Forecast (next 6 months)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.forecast}>
                <defs>
                  <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="month" tick={{fontSize:12}} stroke="#94a3b8"/>
                <YAxis tick={{fontSize:12}} stroke="#94a3b8" tickFormatter={v=>`${v}M`}/>
                <Tooltip formatter={v=>`Rp ${v}M`}/>
                <Area type="monotone" dataKey="forecast" stroke="#2563EB" strokeWidth={2} fill="url(#gForecast)"/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-shadow border-slate-200">
          <CardHeader><CardTitle className="text-base">Opportunity by Industry</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byIndustry} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {data.byIndustry.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={v=>fmtIDR(v)}/>
                <Legend wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-shadow border-slate-200">
          <CardHeader><CardTitle className="text-base">Opportunity Funnel by SOP Stage</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.funnel} layout="vertical" margin={{left:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis type="number" tick={{fontSize:11}} stroke="#94a3b8"/>
                <YAxis dataKey="stage" type="category" tick={{fontSize:11}} width={140} stroke="#94a3b8"/>
                <Tooltip/>
                <Bar dataKey="count" fill="#2563EB" radius={[0,6,6,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-shadow border-slate-200">
          <CardHeader><CardTitle className="text-base">Partner Performance</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byPartner}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="name" tick={{fontSize:10}} stroke="#94a3b8" angle={-25} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11}} stroke="#94a3b8"/>
                <Tooltip/>
                <Bar dataKey="count" fill="#10B981" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-shadow border-slate-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarClock className="w-4 h-4 text-blue-600"/>Today's Meetings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.todayMeetings.length === 0 && <div className="text-sm text-slate-500">No meetings scheduled today.</div>}
            {data.todayMeetings.map(m => (
              <div key={m.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-blue-600 font-medium">{m.type}</div>
                <div className="text-sm font-semibold text-slate-800">{m.title}</div>
                <div className="text-xs text-slate-500">{m.organizationName}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="card-shadow border-slate-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500"/>Upcoming Deadlines</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingDeadlines.map(m => (
              <div key={m.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{m.title}</div>
                  <div className="text-xs text-slate-500">{m.organizationName}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{new Date(m.scheduledAt).toLocaleDateString()}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="card-shadow border-slate-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-500"/>Top Risks</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.risks.map(r => (
              <div key={r.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">{r.category}</div>
                  <Badge className={r.severity==='High'?'bg-rose-100 text-rose-700 hover:bg-rose-100':r.severity==='Medium'?'bg-amber-100 text-amber-700 hover:bg-amber-100':'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'}>{r.severity}</Badge>
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-1">{r.title}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OpportunityCard({ opp, onDragStart, onOpen }) {
  return (
    <div
      draggable
      onDragStart={e=>onDragStart(e, opp)}
      onClick={()=>onOpen(opp)}
      className="opp-card bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900 leading-snug">{opp.projectName}</div>
        <MoreHorizontal className="w-4 h-4 text-slate-400 shrink-0"/>
      </div>
      <div className="text-xs text-slate-500 mt-1">{opp.organizationName}</div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm font-bold text-emerald-600">{fmtIDR(opp.value)}</span>
        <Badge variant="outline" className="text-[10px] border-slate-300">{opp.probability}%</Badge>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <Badge variant="secondary" className="text-[10px] font-normal">{opp.industry}</Badge>
        {opp.partner && <Badge variant="secondary" className="text-[10px] font-normal">{opp.partner}</Badge>}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <Avatar className="w-5 h-5"><AvatarFallback className="text-[9px] bg-blue-100 text-blue-700">{opp.businessOwner?.split(' ').map(x=>x[0]).slice(0,2).join('')}</AvatarFallback></Avatar>
          <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{opp.businessOwner}</span>
        </div>
        <span className="text-[10px] text-slate-400">{new Date(opp.expectedClosing).toLocaleDateString('en-GB',{month:'short',day:'2-digit'})}</span>
      </div>
    </div>
  );
}

function Kanban({ opportunities, onMove, onOpen, onCreate }) {
  const [dragged, setDragged] = useState(null);
  const grouped = useMemo(()=>{
    const g = {}; STAGES.forEach(s=>g[s]=[]);
    opportunities.forEach(o=>{ if(g[o.stage]) g[o.stage].push(o); });
    return g;
  },[opportunities]);

  const handleDragStart = (e, opp) => { setDragged(opp); e.dataTransfer.effectAllowed='move'; };
  const handleDrop = (e, stage) => { e.preventDefault(); if (dragged && dragged.stage !== stage) onMove(dragged, stage); setDragged(null); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Pipeline</h1>
          <p className="text-sm text-slate-500">Drag &amp; drop opportunities across SOP stages · {opportunities.length} total</p>
        </div>
        <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 gap-2"><Plus className="w-4 h-4"/>New Opportunity</Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
        {STAGES.map(stage => {
          const items = grouped[stage] || [];
          const totalValue = items.reduce((s,o)=>s+(o.value||0),0);
          return (
            <div key={stage} className="kanban-col w-[280px] shrink-0"
              onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e, stage)}>
              <div className={`px-3 py-2 rounded-t-lg border ${STAGE_COLORS[stage]} flex items-center justify-between`}>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">{stage}</div>
                  <div className="text-[10px] opacity-75">{items.length} deals · {fmtIDR(totalValue)}</div>
                </div>
              </div>
              <div className="bg-slate-50 border border-t-0 border-slate-200 rounded-b-lg p-2 space-y-2 min-h-[500px]">
                {items.map(opp => <OpportunityCard key={opp.id} opp={opp} onDragStart={handleDragStart} onOpen={onOpen}/>)}
                {items.length === 0 && <div className="text-center text-xs text-slate-400 py-6">Drop here</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpportunityDialog({ open, onOpenChange, opp, onSave, onAI }) {
  const [form, setForm] = useState(opp || {});
  useEffect(()=>{ setForm(opp || {}); },[opp]);
  const isNew = !opp?.id;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isNew?'New Opportunity':form.projectName}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2"><Label>Project Name</Label><Input value={form.projectName||''} onChange={e=>setForm({...form,projectName:e.target.value})}/></div>
          <div className="col-span-2"><Label>Organization</Label><Input value={form.organizationName||''} onChange={e=>setForm({...form,organizationName:e.target.value})}/></div>
          <div><Label>Industry</Label>
            <Select value={form.industry} onValueChange={v=>setForm({...form,industry:v})}>
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>{INDUSTRIES.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Product</Label>
            <Select value={form.product} onValueChange={v=>setForm({...form,product:v})}>
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>{PRODUCTS.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Partner</Label>
            <Select value={form.partner} onValueChange={v=>setForm({...form,partner:v})}>
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>{PARTNERS.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Stage</Label>
            <Select value={form.stage} onValueChange={v=>setForm({...form,stage:v})}>
              <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
              <SelectContent>{STAGES.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Opportunity Value (IDR)</Label><Input type="number" value={form.value||''} onChange={e=>setForm({...form,value:Number(e.target.value)})}/></div>
          <div><Label>MRR (IDR)</Label><Input type="number" value={form.mrr||''} onChange={e=>setForm({...form,mrr:Number(e.target.value)})}/></div>
          <div><Label>Win Probability (%)</Label><Input type="number" value={form.probability||''} onChange={e=>setForm({...form,probability:Number(e.target.value)})}/></div>
          <div><Label>Business Owner</Label><Input value={form.businessOwner||''} onChange={e=>setForm({...form,businessOwner:e.target.value})}/></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        </div>
        <DialogFooter className="gap-2">
          {!isNew && <Button variant="outline" onClick={()=>onAI(form)} className="gap-2 mr-auto"><Sparkles className="w-4 h-4 text-blue-600"/>AI Health Score</Button>}
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={()=>onSave(form)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AIPanel({ open, onClose, presetTask, presetContext }) {
  const [task, setTask] = useState('executive_insight');
  const [context, setContext] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [session] = useState(`bdip-${Math.random().toString(36).slice(2)}`);

  useEffect(()=>{
    if (open && presetTask) {
      setTask(presetTask);
      setContext(presetContext ? JSON.stringify(presetContext, null, 2) : '');
    }
  },[open, presetTask, presetContext]);

  const tasks = [
    { key: 'executive_insight', label: 'Weekly Executive Insight' },
    { key: 'proposal_summary', label: 'Generate Proposal Summary' },
    { key: 'meeting_minutes', label: 'Generate Meeting Minutes' },
    { key: 'business_case', label: 'Generate Business Case' },
    { key: 'risk_mitigation', label: 'Generate Risk Mitigation' },
    { key: 'health_score', label: 'Opportunity Health Score' },
    { key: 'next_followup', label: 'Suggest Next Follow-Up' },
  ];

  async function run() {
    if (!context.trim() && task !== 'executive_insight') { toast.error('Please provide context'); return; }
    setLoading(true);
    const userMsg = { role: 'user', text: `[${task}] ${context.slice(0,200)}${context.length>200?'…':''}` };
    setMessages(m => [...m, userMsg]);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ task, context: context || 'Provide a general weekly executive insight for a mid-size Indonesian systems integrator (Digicare) selling SIMRS, ERP, IoT, and Command Center to Government, Healthcare, BUMN.', sessionId: session })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setMessages(m => [...m, { role: 'ai', text: j.text }]);
      setContext('');
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 gradient-navy text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center"><Sparkles className="w-4 h-4"/></div>
          <div>
            <div className="font-semibold text-sm">AI Assistant</div>
            <div className="text-[10px] text-slate-300">Powered by GPT-5</div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-300 hover:text-white"><X className="w-5 h-5"/></button>
      </div>
      <div className="p-4 border-b border-slate-200 space-y-2">
        <Label className="text-xs">AI Task</Label>
        <Select value={task} onValueChange={setTask}>
          <SelectTrigger><SelectValue/></SelectTrigger>
          <SelectContent>{tasks.map(t=><SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-3"><Sparkles className="w-8 h-8 text-white"/></div>
            <div className="text-sm font-semibold text-slate-800">Digicare AI Assistant</div>
            <div className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">Pick a task and describe your context. I'll generate executive-grade output instantly.</div>
          </div>
        )}
        {messages.map((m,i)=>(
          <div key={i} className={`p-3 rounded-lg text-sm ${m.role==='user'?'bg-blue-600 text-white ml-8':'bg-white border border-slate-200 mr-8'}`}>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
        {loading && <div className="flex items-center gap-2 text-sm text-slate-500 mr-8"><Loader2 className="w-4 h-4 animate-spin"/>Generating…</div>}
      </div>
      <div className="p-4 border-t border-slate-200 space-y-2">
        <Textarea rows={3} placeholder="Paste notes / context here…" value={context} onChange={e=>setContext(e.target.value)}/>
        <Button onClick={run} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
          Generate with GPT-5
        </Button>
      </div>
    </div>
  );
}

function Placeholder({ title, subtitle, icon: Icon }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500">{subtitle}</p>
      <Card className="mt-6 card-shadow border-slate-200">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4"><Icon className="w-8 h-8 text-blue-600"/></div>
          <div className="text-lg font-semibold text-slate-800">Coming Next</div>
          <div className="text-sm text-slate-500 max-w-md mt-2">This module is scaffolded and ready to build. The MVP focus is Executive Dashboard + CRM Pipeline + AI Assistant. Ask the team to prioritise this module and it will be activated.</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [current, setCurrent] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [opps, setOpps] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPreset, setAiPreset] = useState({ task: 'executive_insight', context: null });
  const [oppDialog, setOppDialog] = useState({ open: false, opp: null });

  async function load() {
    try {
      await fetch('/api/seed', { method: 'POST' });
      const [dRes, oRes] = await Promise.all([
        fetch('/api/dashboard').then(r=>r.json()),
        fetch('/api/opportunities').then(r=>r.json())
      ]);
      setDashboard(dRes);
      setOpps(oRes);
    } catch (e) { toast.error('Failed to load: ' + e.message); }
  }
  useEffect(()=>{ load(); },[]);

  async function moveOpp(opp, stage) {
    setOpps(prev => prev.map(o => o.id===opp.id ? {...o, stage} : o));
    try {
      await fetch(`/api/opportunities/${opp.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ stage }) });
      toast.success(`Moved to ${stage}`);
      const d = await fetch('/api/dashboard').then(r=>r.json());
      setDashboard(d);
    } catch (e) { toast.error('Move failed'); load(); }
  }

  async function saveOpp(form) {
    try {
      if (form.id) {
        await fetch(`/api/opportunities/${form.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      } else {
        await fetch('/api/opportunities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      }
      toast.success('Saved');
      setOppDialog({ open:false, opp:null });
      load();
    } catch (e) { toast.error('Save failed'); }
  }

  function openAIWithOpp(opp) {
    setAiPreset({ task: 'health_score', context: {
      project: opp.projectName, organization: opp.organizationName, industry: opp.industry,
      product: opp.product, partner: opp.partner, stage: opp.stage, value_idr: opp.value,
      probability: opp.probability, business_owner: opp.businessOwner, notes: opp.notes
    }});
    setAiOpen(true);
    setOppDialog({ open:false, opp:null });
  }

  function openAIExec() {
    setAiPreset({ task: 'executive_insight', context: dashboard ? {
      kpis: dashboard.kpis,
      top_industries: dashboard.byIndustry?.slice(0,5),
      funnel: dashboard.funnel
    } : null });
    setAiOpen(true);
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} current={current} setCurrent={setCurrent}/>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenu={()=>setCollapsed(!collapsed)} onAI={openAIExec}/>
        <main className="flex-1 overflow-y-auto">
          {current==='dashboard' && <Dashboard data={dashboard} onOpenAI={openAIExec}/>}
          {current==='crm' && <Kanban opportunities={opps} onMove={moveOpp} onOpen={(o)=>setOppDialog({open:true,opp:o})} onCreate={()=>setOppDialog({open:true,opp:null})}/>}
          {current==='orgs' && <Placeholder title="Organizations" subtitle="Client master data" icon={Building2}/>}
          {current==='stakeholders' && <Placeholder title="Stakeholders" subtitle="Decision makers, champions, technical PICs" icon={Users2}/>}
          {current==='projects' && <Placeholder title="Project Intelligence" subtitle="Project delivery visibility" icon={ListChecks}/>}
          {current==='activities' && <Placeholder title="Activity Timeline" subtitle="Meetings, calls, WhatsApp, visits, demos" icon={CalendarClock}/>}
          {current==='proposals' && <Placeholder title="Proposal Center" subtitle="Versioned proposal, BoM, RAB, MoM, NDA, PKS" icon={FileText}/>}
          {current==='risks' && <Placeholder title="Risk Register" subtitle="Commercial · Technical · Operational · Financial" icon={ShieldAlert}/>}
          {current==='products' && <Placeholder title="Product Catalog" subtitle="Digicare product portfolio" icon={Package}/>}
          {current==='partners' && <Placeholder title="Partnerships" subtitle="Huawei · Cisco · Fortinet · Dell · HPE" icon={Handshake}/>}
          {current==='reports' && <Placeholder title="Reporting Center" subtitle="PDF & Excel report generation" icon={BarChart3}/>}
        </main>
      </div>
      <button onClick={openAIExec} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 shadow-2xl flex items-center justify-center text-white z-40 hover:scale-105 transition-transform">
        <Sparkles className="w-6 h-6"/>
      </button>
      <AIPanel open={aiOpen} onClose={()=>setAiOpen(false)} presetTask={aiPreset.task} presetContext={aiPreset.context}/>
      <OpportunityDialog open={oppDialog.open} onOpenChange={(v)=>setOppDialog({open:v, opp: v?oppDialog.opp:null})} opp={oppDialog.opp} onSave={saveOpp} onAI={openAIWithOpp}/>
    </div>
  );
}
