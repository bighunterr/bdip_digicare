'use client';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Sparkles, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Commercial','Technical','Operational','Financial','Partnership','Compliance'];
const SEV = ['Low','Medium','High','Critical'];
const PROB = ['Low','Medium','High'];
const STATUS = ['Open','Mitigating','Closed'];

const SEV_IDX = { 'Low':0, 'Medium':1, 'High':2, 'Critical':3 };
const PROB_IDX = { 'Low':0, 'Medium':1, 'High':2 };

function cellColor(sev, prob) {
  const s = SEV_IDX[sev] ?? 0;
  const p = PROB_IDX[prob] ?? 0;
  const score = (s+1) * (p+1);
  if (score >= 9) return 'bg-rose-500 text-white';
  if (score >= 6) return 'bg-orange-400 text-white';
  if (score >= 3) return 'bg-amber-300 text-slate-800';
  return 'bg-emerald-300 text-emerald-900';
}

export default function RiskRegister({ onAI }) {
  const [risks, setRisks] = useState([]);
  const [dialog, setDialog] = useState({ open: false, risk: null });
  const [q, setQ] = useState('');

  async function load() {
    const res = await fetch('/api/risks').then(r=>r.json());
    setRisks(res);
  }
  useEffect(()=>{ load(); },[]);

  async function save(form) {
    const method = form.id ? 'PATCH' : 'POST';
    const url = form.id ? `/api/risks/${form.id}` : '/api/risks';
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (res.ok) { toast.success('Risk saved'); setDialog({open:false, risk:null}); load(); }
    else toast.error('Save failed');
  }

  async function remove(id) {
    if (!confirm('Delete this risk?')) return;
    await fetch(`/api/risks/${id}`, { method: 'DELETE' });
    load();
  }

  const heatmap = useMemo(() => {
    const map = {};
    for (const s of SEV) for (const p of PROB) map[`${s}-${p}`] = [];
    risks.forEach(r => { const k = `${r.severity||'Low'}-${r.probability||'Low'}`; if (map[k]) map[k].push(r); });
    return map;
  }, [risks]);

  const filtered = risks.filter(r => !q || (r.title||'').toLowerCase().includes(q.toLowerCase()) || (r.category||'').toLowerCase().includes(q.toLowerCase()));

  const summary = {
    total: risks.length,
    open: risks.filter(r=>r.status==='Open').length,
    mitigating: risks.filter(r=>r.status==='Mitigating').length,
    closed: risks.filter(r=>r.status==='Closed').length,
    critical: risks.filter(r=>r.severity==='Critical' || (r.severity==='High' && r.probability==='High')).length
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Risk Register</h1>
          <p className="text-sm text-slate-500">{risks.length} risks tracked · heatmap by severity × probability</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search risk…" value={q} onChange={e=>setQ(e.target.value)} className="w-64"/>
          <Button onClick={()=>setDialog({open:true, risk:{}})} className="bg-blue-600 hover:bg-blue-700 gap-2"><Plus className="w-4 h-4"/>New Risk</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {label:'Total', val:summary.total, tone:'bg-slate-100 text-slate-700'},
          {label:'Open', val:summary.open, tone:'bg-rose-100 text-rose-700'},
          {label:'Mitigating', val:summary.mitigating, tone:'bg-amber-100 text-amber-700'},
          {label:'Closed', val:summary.closed, tone:'bg-emerald-100 text-emerald-700'},
          {label:'Critical', val:summary.critical, tone:'bg-red-100 text-red-700'}
        ].map(k => (
          <Card key={k.label} className="card-shadow border-slate-200">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{k.label}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{k.val}</div>
              <Badge className={`mt-2 ${k.tone} hover:${k.tone}`}>Live</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 card-shadow border-slate-200">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-500"/>Risk Heatmap</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-block">
                <div className="flex">
                  <div className="w-24"></div>
                  {SEV.map(s => <div key={s} className="w-32 text-center text-xs font-semibold text-slate-600 pb-2">{s}</div>)}
                </div>
                {[...PROB].reverse().map(p => (
                  <div key={p} className="flex items-center">
                    <div className="w-24 text-xs font-semibold text-slate-600 text-right pr-3">{p} Probability</div>
                    {SEV.map(s => {
                      const items = heatmap[`${s}-${p}`] || [];
                      return (
                        <div key={s+p} className={`w-32 h-24 border-2 border-white rounded-lg m-1 p-2 ${cellColor(s,p)} flex flex-col justify-between overflow-hidden`}>
                          <div className="text-2xl font-bold leading-none">{items.length}</div>
                          {items.slice(0,2).map(it => <div key={it.id} className="text-[10px] leading-tight truncate opacity-90">{it.title}</div>)}
                          {items.length > 2 && <div className="text-[10px] opacity-75">+{items.length-2} more</div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="text-xs text-slate-500 text-center mt-2">Severity →</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-slate-200">
          <CardHeader><CardTitle className="text-base">By Category</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {CATEGORIES.map(c => {
              const cnt = risks.filter(r=>r.category===c).length;
              const pct = risks.length ? (cnt/risks.length*100) : 0;
              return (
                <div key={c}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700">{c}</span><span className="text-slate-500">{cnt}</span></div>
                  <div className="w-full h-2 bg-slate-100 rounded-full"><div className="h-2 bg-blue-600 rounded-full" style={{width:`${pct}%`}}/></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow border-slate-200">
        <CardHeader><CardTitle className="text-base">All Risks</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Risk</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Severity</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Probability</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Owner</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.title}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{r.category}</Badge></td>
                  <td className="px-4 py-3"><Badge className={r.severity==='Critical'?'bg-red-100 text-red-700 hover:bg-red-100':r.severity==='High'?'bg-rose-100 text-rose-700 hover:bg-rose-100':r.severity==='Medium'?'bg-amber-100 text-amber-700 hover:bg-amber-100':'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'}>{r.severity}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="outline">{r.probability}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">{r.owner || '-'}</td>
                  <td className="px-4 py-3"><Badge className={r.status==='Open'?'bg-rose-100 text-rose-700 hover:bg-rose-100':r.status==='Mitigating'?'bg-amber-100 text-amber-700 hover:bg-amber-100':'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={()=>onAI && onAI(r)} className="gap-1 text-blue-600"><Sparkles className="w-3.5 h-3.5"/>AI Mitigation</Button>
                    <Button variant="ghost" size="sm" onClick={()=>setDialog({open:true, risk:r})}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={()=>remove(r.id)}><Trash2 className="w-4 h-4 text-rose-500"/></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No risks</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(v)=>setDialog({open:v, risk: v?dialog.risk:null})}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialog.risk?.id ? 'Edit Risk' : 'New Risk'}</DialogTitle></DialogHeader>
          <RiskForm value={dialog.risk||{}} onSubmit={save} onCancel={()=>setDialog({open:false, risk:null})}/>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RiskForm({ value, onSubmit, onCancel }) {
  const [f, setF] = useState(value);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="col-span-2"><Label>Risk Title</Label><Input value={f.title||''} onChange={e=>setF({...f, title:e.target.value})}/></div>
        <div><Label>Category</Label>
          <Select value={f.category} onValueChange={v=>setF({...f, category:v})}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>{CATEGORIES.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Severity</Label>
          <Select value={f.severity} onValueChange={v=>setF({...f, severity:v})}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>{SEV.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Probability</Label>
          <Select value={f.probability} onValueChange={v=>setF({...f, probability:v})}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>{PROB.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Status</Label>
          <Select value={f.status||'Open'} onValueChange={v=>setF({...f, status:v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>{STATUS.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Owner</Label><Input value={f.owner||''} onChange={e=>setF({...f, owner:e.target.value})}/></div>
        <div><Label>Due Date</Label><Input type="date" value={f.dueDate ? new Date(f.dueDate).toISOString().slice(0,10):''} onChange={e=>setF({...f, dueDate: e.target.value})}/></div>
        <div className="col-span-2"><Label>Impact</Label><Textarea rows={2} value={f.impact||''} onChange={e=>setF({...f, impact:e.target.value})}/></div>
        <div className="col-span-2"><Label>Mitigation</Label><Textarea rows={2} value={f.mitigation||''} onChange={e=>setF({...f, mitigation:e.target.value})}/></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={()=>onSubmit(f)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
      </DialogFooter>
    </>
  );
}
