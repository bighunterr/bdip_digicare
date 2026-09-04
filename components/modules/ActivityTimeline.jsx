'use client';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, ChevronLeft, ChevronRight, Trash2, CheckCircle2, Circle, CalendarDays, ListTree, Phone, MessageCircle, Mail, Presentation, MapPin, ClipboardList, FileText, Users, Search } from 'lucide-react';
import { toast } from 'sonner';

const TYPES = ['Meeting','Call','WhatsApp','Email','Visit','Demo','Presentation','Proposal','Workshop','Survey','Audit','Follow Up'];
const STATUS = ['Scheduled','Done','Cancelled'];

const TYPE_ICON = {
  Meeting: Users, Call: Phone, WhatsApp: MessageCircle, Email: Mail, Visit: MapPin,
  Demo: Presentation, Presentation: Presentation, Proposal: FileText, Workshop: Users,
  Survey: ClipboardList, Audit: ClipboardList, 'Follow Up': CheckCircle2
};
const TYPE_COLOR = {
  Meeting: 'bg-blue-100 text-blue-700', Call: 'bg-violet-100 text-violet-700',
  WhatsApp: 'bg-emerald-100 text-emerald-700', Email: 'bg-sky-100 text-sky-700',
  Visit: 'bg-orange-100 text-orange-700', Demo: 'bg-pink-100 text-pink-700',
  Presentation: 'bg-fuchsia-100 text-fuchsia-700', Proposal: 'bg-amber-100 text-amber-700',
  Workshop: 'bg-cyan-100 text-cyan-700', Survey: 'bg-indigo-100 text-indigo-700',
  Audit: 'bg-red-100 text-red-700', 'Follow Up': 'bg-slate-100 text-slate-700'
};

export default function ActivityTimeline() {
  const [activities, setActivities] = useState([]);
  const [dialog, setDialog] = useState({ open: false, item: null });
  const [monthDate, setMonthDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [q, setQ] = useState('');

  async function load() {
    const items = await fetch('/api/activities').then(r=>r.json());
    setActivities(items);
  }
  useEffect(()=>{ load(); },[]);

  async function save(form) {
    const method = form.id ? 'PATCH' : 'POST';
    const url = form.id ? `/api/activities/${form.id}` : '/api/activities';
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (res.ok) { toast.success('Activity saved'); setDialog({open:false, item:null}); load(); }
    else toast.error('Save failed');
  }
  async function remove(id) {
    if (!confirm('Delete this activity?')) return;
    await fetch(`/api/activities/${id}`, { method: 'DELETE' });
    load();
  }
  async function toggleDone(a) {
    await fetch(`/api/activities/${a.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: a.status === 'Done' ? 'Scheduled' : 'Done' }) });
    load();
  }

  const filtered = activities.filter(a => !q || (a.title||'').toLowerCase().includes(q.toLowerCase()) || (a.organizationName||'').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Activity Timeline</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{activities.length} activities · meetings, calls, WhatsApp, visits, demos</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search title / org…" value={q} onChange={e=>setQ(e.target.value)} className="w-64"/>
          <Button onClick={()=>setDialog({open:true, item:{ type:'Meeting', status:'Scheduled', scheduledAt: new Date().toISOString().slice(0,16) }})} className="bg-blue-600 hover:bg-blue-700 gap-2"><Plus className="w-4 h-4"/>New Activity</Button>
        </div>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2"><CalendarDays className="w-4 h-4"/>Calendar</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2"><ListTree className="w-4 h-4"/>Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarView monthDate={monthDate} setMonthDate={setMonthDate} activities={filtered} onEdit={(a)=>setDialog({open:true, item:a})}/>
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineView activities={filtered} onEdit={(a)=>setDialog({open:true, item:a})} onToggleDone={toggleDone} onDelete={remove}/>
        </TabsContent>
      </Tabs>

      <Dialog open={dialog.open} onOpenChange={(v)=>setDialog({open:v, item: v?dialog.item:null})}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialog.item?.id ? 'Edit Activity' : 'New Activity'}</DialogTitle></DialogHeader>
          <ActivityForm value={dialog.item||{}} onSubmit={save} onCancel={()=>setDialog({open:false, item:null})}/>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CalendarView({ monthDate, setMonthDate, activities, onEdit }) {
  const grid = useMemo(() => {
    const y = monthDate.getFullYear(), m = monthDate.getMonth();
    const first = new Date(y, m, 1);
    const startDay = first.getDay(); // 0 sun
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthDate]);

  const byDay = useMemo(() => {
    const map = {};
    activities.forEach(a => {
      const d = new Date(a.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [activities]);

  const monthLabel = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const nav = (delta) => { const d = new Date(monthDate); d.setMonth(d.getMonth()+delta); setMonthDate(d); };

  return (
    <Card className="card-shadow border-slate-200 dark:border-slate-700">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{monthLabel}</CardTitle>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={()=>nav(-1)}><ChevronLeft className="w-4 h-4"/></Button>
          <Button variant="outline" size="sm" onClick={()=>setMonthDate((()=>{const d=new Date(); d.setDate(1); return d;})())}>Today</Button>
          <Button variant="outline" size="icon" onClick={()=>nav(1)}><ChevronRight className="w-4 h-4"/></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d,i) => {
            if (!d) return <div key={i} className="h-24"/>;
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const items = byDay[key] || [];
            const isToday = new Date().toDateString() === d.toDateString();
            return (
              <div key={i} className={`h-24 border rounded-md p-1 overflow-hidden ${isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <div className={`text-xs font-semibold ${isToday ? 'text-blue-700' : 'text-slate-600 dark:text-slate-300'}`}>{d.getDate()}</div>
                <div className="space-y-0.5 mt-0.5">
                  {items.slice(0,2).map(a => (
                    <button key={a.id} onClick={()=>onEdit(a)} className={`w-full text-left text-[10px] px-1 py-0.5 rounded truncate ${TYPE_COLOR[a.type]||'bg-slate-100'}`}>
                      {a.title}
                    </button>
                  ))}
                  {items.length > 2 && <div className="text-[10px] text-slate-500">+{items.length-2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineView({ activities, onEdit, onToggleDone, onDelete }) {
  const grouped = useMemo(() => {
    const g = {};
    activities.forEach(a => {
      const d = new Date(a.scheduledAt);
      const key = d.toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric', year:'numeric' });
      if (!g[key]) g[key] = [];
      g[key].push(a);
    });
    return Object.entries(g);
  }, [activities]);

  return (
    <div className="space-y-6">
      {grouped.map(([day, items]) => (
        <div key={day}>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{day}</div>
          <div className="space-y-2">
            {items.map(a => {
              const Icon = TYPE_ICON[a.type] || Users;
              return (
                <Card key={a.id} className="card-shadow-hover border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4 flex items-start gap-3">
                    <button onClick={()=>onToggleDone(a)} className="mt-1">
                      {a.status === 'Done' ? <CheckCircle2 className="w-5 h-5 text-emerald-500"/> : <Circle className="w-5 h-5 text-slate-300"/>}
                    </button>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${TYPE_COLOR[a.type]||'bg-slate-100'}`}><Icon className="w-4 h-4"/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`font-semibold ${a.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>{a.title}</div>
                        <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.organizationName} · {new Date(a.scheduledAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} · {a.owner || '-'}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={()=>onEdit(a)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={()=>onDelete(a.id)}><Trash2 className="w-4 h-4 text-rose-500"/></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      {grouped.length === 0 && <div className="text-center text-sm text-slate-400 py-16">No activities</div>}
    </div>
  );
}

function ActivityForm({ value, onSubmit, onCancel }) {
  const initSched = value.scheduledAt ? new Date(value.scheduledAt).toISOString().slice(0,16) : new Date().toISOString().slice(0,16);
  const [f, setF] = useState({ type: 'Meeting', status: 'Scheduled', ...value, scheduledAt: initSched });
  return (
    <>
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="col-span-2"><Label>Title</Label><Input value={f.title||''} onChange={e=>setF({...f, title:e.target.value})}/></div>
        <div><Label>Type</Label>
          <Select value={f.type} onValueChange={v=>setF({...f, type:v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>{TYPES.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v=>setF({...f, status:v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>{STATUS.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Organization</Label><Input value={f.organizationName||''} onChange={e=>setF({...f, organizationName:e.target.value})}/></div>
        <div><Label>Owner</Label><Input value={f.owner||''} onChange={e=>setF({...f, owner:e.target.value})}/></div>
        <div><Label>Scheduled At</Label><Input type="datetime-local" value={f.scheduledAt} onChange={e=>setF({...f, scheduledAt:e.target.value})}/></div>
        <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={f.notes||''} onChange={e=>setF({...f, notes:e.target.value})}/></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={()=>onSubmit(f)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
      </DialogFooter>
    </>
  );
}
