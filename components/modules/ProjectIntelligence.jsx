'use client';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Briefcase, Calendar, Users, DollarSign, ArrowLeft, CheckCircle2, Circle, Clock, ListChecks, ShieldAlert, FileText, StickyNote, Milestone, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = ['Planning','Solutioning','Pilot','Proposal','Negotiation','Development','Implementation','Go Live','Support','Completed'];
const DEL_STATUS = ['Pending','In Progress','Done','Blocked'];

const STATUS_COLOR = {
  Planning: 'bg-slate-100 text-slate-700', Solutioning: 'bg-indigo-100 text-indigo-700',
  Pilot: 'bg-violet-100 text-violet-700', Proposal: 'bg-blue-100 text-blue-700',
  Negotiation: 'bg-amber-100 text-amber-700', Development: 'bg-cyan-100 text-cyan-700',
  Implementation: 'bg-orange-100 text-orange-700', 'Go Live': 'bg-emerald-100 text-emerald-700',
  Support: 'bg-teal-100 text-teal-700', Completed: 'bg-green-100 text-green-700'
};

function fmtIDR(n) {
  if (!n) return '–';
  if (n >= 1e9) return `Rp ${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `Rp ${(n/1e6).toFixed(0)}M`;
  return `Rp ${n.toLocaleString()}`;
}

export default function ProjectIntelligence() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [risks, setRisks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [dialog, setDialog] = useState({ open: false });

  async function load() {
    const [p, r, a, docs] = await Promise.all([
      fetch('/api/projects').then(r=>r.json()),
      fetch('/api/risks').then(r=>r.json()),
      fetch('/api/activities').then(r=>r.json()),
      fetch('/api/proposals').then(r=>r.json()),
    ]);
    setProjects(p); setRisks(r); setActivities(a); setProposals(docs);
  }
  useEffect(()=>{ load(); },[]);

  async function save(form) {
    const method = form.id ? 'PATCH' : 'POST';
    const url = form.id ? `/api/projects/${form.id}` : '/api/projects';
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (res.ok) { toast.success('Project saved'); setDialog({open:false}); load(); }
    else toast.error('Save failed');
  }

  async function updateProject(id, patch) {
    await fetch(`/api/projects/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(patch) });
    const doc = await fetch(`/api/projects/${id}`).then(r=>r.json());
    setSelected(doc);
    setProjects(prev => prev.map(p => p.id === id ? doc : p));
  }

  async function remove(id) {
    if (!confirm('Delete this project?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setSelected(null);
    load();
  }

  if (selected) {
    return <ProjectDetail project={selected} onBack={()=>setSelected(null)} onUpdate={updateProject} onDelete={remove} risks={risks} activities={activities} proposals={proposals}/>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Project Intelligence</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{projects.length} projects · real-time delivery visibility</p>
        </div>
        <Button onClick={()=>setDialog({open:true})} className="bg-blue-600 hover:bg-blue-700 gap-2"><Plus className="w-4 h-4"/>New Project</Button>
      </div>

      {projects.length === 0 && (
        <Card className="border-dashed border-slate-300 dark:border-slate-700">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4"><Briefcase className="w-8 h-8 text-blue-600"/></div>
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">No projects yet</div>
            <div className="text-sm text-slate-500 max-w-md mx-auto mt-2">Projects auto-created from Implementation/Closed Won opportunities. Or create one manually.</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <Card key={p.id} onClick={()=>setSelected(p)} className="card-shadow card-shadow-hover cursor-pointer border-slate-200 dark:border-slate-700">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.organizationName}</div>
                </div>
                <Badge className={`${STATUS_COLOR[p.status]||'bg-slate-100'} hover:${STATUS_COLOR[p.status]||'bg-slate-100'}`}>{p.status}</Badge>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span className="font-semibold text-slate-700 dark:text-slate-300">{p.progress}%</span></div>
                <Progress value={p.progress} className="h-2"/>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Budget</div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">{fmtIDR(p.budget)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Owner</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{p.businessOwner || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Due</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{p.endDate ? new Date(p.endDate).toLocaleDateString('en-GB',{month:'short',day:'2-digit'}) : '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog.open} onOpenChange={(v)=>setDialog({open:v})}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <ProjectForm value={{}} onSubmit={save} onCancel={()=>setDialog({open:false})}/>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectDetail({ project, onBack, onUpdate, onDelete, risks, activities, proposals }) {
  const relatedActs = activities.filter(a => a.organizationName === project.organizationName);
  const relatedRisks = risks.slice(0, 4); // demo: all risks
  const relatedDocs = proposals.filter(d => d.opportunity?.includes(project.name) || d.title?.includes(project.name.split(' ')[0]));

  async function toggleDeliverable(id) {
    const nextDel = project.deliverables.map(d => d.id === id ? { ...d, status: d.status === 'Done' ? 'Pending' : 'Done' } : d);
    const doneCount = nextDel.filter(d => d.status === 'Done').length;
    const progress = Math.round((doneCount / nextDel.length) * 100);
    await onUpdate(project.id, { deliverables: nextDel, progress });
  }

  return (
    <div className="p-6 space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600"><ArrowLeft className="w-4 h-4"/>Back to projects</button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={`${STATUS_COLOR[project.status]||'bg-slate-100'} hover:${STATUS_COLOR[project.status]||'bg-slate-100'}`}>{project.status}</Badge>
            <span className="text-sm text-slate-500">{project.organizationName}</span>
            <span className="text-sm text-slate-400">·</span>
            <span className="text-sm text-slate-500">{project.product}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={project.status} onValueChange={(v)=>onUpdate(project.id, { status: v })}>
            <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
            <SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={()=>onDelete(project.id)}><Trash2 className="w-4 h-4 text-rose-500"/></Button>
        </div>
      </div>

      <Card className="card-shadow border-slate-200 dark:border-slate-700">
        <CardContent className="p-5">
          <div className="flex justify-between text-sm mb-2"><span className="font-semibold text-slate-700 dark:text-slate-300">Overall Progress</span><span className="text-2xl font-bold text-blue-600">{project.progress}%</span></div>
          <Progress value={project.progress} className="h-3"/>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview" className="gap-1"><Briefcase className="w-3.5 h-3.5"/>Overview</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1"><Milestone className="w-3.5 h-3.5"/>Timeline</TabsTrigger>
          <TabsTrigger value="deliverables" className="gap-1"><ListChecks className="w-3.5 h-3.5"/>Deliverables</TabsTrigger>
          <TabsTrigger value="activities" className="gap-1"><Calendar className="w-3.5 h-3.5"/>Activities</TabsTrigger>
          <TabsTrigger value="risk" className="gap-1"><ShieldAlert className="w-3.5 h-3.5"/>Risk</TabsTrigger>
          <TabsTrigger value="docs" className="gap-1"><FileText className="w-3.5 h-3.5"/>Documents</TabsTrigger>
          <TabsTrigger value="notes" className="gap-1"><StickyNote className="w-3.5 h-3.5"/>Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wider text-slate-500">Budget</div><div className="text-xl font-bold text-emerald-600 mt-1">{fmtIDR(project.budget)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wider text-slate-500">Start</div><div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB',{month:'short',day:'2-digit'}) : '-'}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wider text-slate-500">End</div><div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{project.endDate ? new Date(project.endDate).toLocaleDateString('en-GB',{month:'short',day:'2-digit'}) : '-'}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wider text-slate-500">Team</div><div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{project.businessOwner}<br/><span className="text-xs text-slate-500">{project.technicalOwner}</span></div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"/>
                <div className="space-y-6">
                  {(project.milestones||[]).map(m => {
                    const Icon = m.status === 'Done' ? CheckCircle2 : m.status === 'In Progress' ? Clock : Circle;
                    const color = m.status === 'Done' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : m.status === 'In Progress' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-400 bg-slate-100 dark:bg-slate-800';
                    return (
                      <div key={m.id} className="pl-12 relative">
                        <div className={`absolute left-1 top-0 w-6 h-6 rounded-full flex items-center justify-center ${color}`}>
                          <Icon className="w-4 h-4"/>
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{m.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{new Date(m.at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
                        <Badge className="mt-1" variant="outline">{m.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables">
          <Card className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b"><tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Deliverable</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Due</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                </tr></thead>
                <tbody>
                  {(project.deliverables||[]).map(d => (
                    <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <button onClick={()=>toggleDeliverable(d.id)} className="flex items-center gap-2 text-left">
                          {d.status === 'Done' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/> : <Circle className="w-4 h-4 text-slate-300 shrink-0"/>}
                          <span className={d.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}>{d.title}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{d.dueDate ? new Date(d.dueDate).toLocaleDateString('en-GB',{month:'short',day:'2-digit'}) : '-'}</td>
                      <td className="px-4 py-3"><Badge variant={d.status === 'Done' ? 'default' : 'outline'} className={d.status === 'Done' ? 'bg-emerald-500' : ''}>{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 space-y-2">
              {relatedActs.length === 0 && <div className="text-center text-sm text-slate-400 py-10">No related activities</div>}
              {relatedActs.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Badge variant="outline">{a.type}</Badge>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{a.title}</div>
                    <div className="text-xs text-slate-500">{new Date(a.scheduledAt).toLocaleString()} · {a.owner || '-'}</div>
                  </div>
                  <Badge className={a.status === 'Done' ? 'bg-emerald-500' : 'bg-slate-500'}>{a.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 space-y-2">
              {relatedRisks.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <ShieldAlert className={`w-5 h-5 ${r.severity === 'High' || r.severity === 'Critical' ? 'text-rose-500' : 'text-amber-500'}`}/>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{r.title}</div>
                    <div className="text-xs text-slate-500">{r.category} · {r.owner}</div>
                  </div>
                  <Badge variant="outline">{r.severity}</Badge>
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 space-y-2">
              {relatedDocs.length === 0 && <div className="text-center text-sm text-slate-400 py-10">No related documents</div>}
              {relatedDocs.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <FileText className="w-5 h-5 text-blue-600"/>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{d.title}</div>
                    <div className="text-xs text-slate-500">{d.category} · v{d.version}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <Textarea rows={8} defaultValue={project.internalNotes || ''} onBlur={(e)=>onUpdate(project.id, { internalNotes: e.target.value })} placeholder="Internal notes, decisions, weekly recap…"/>
              <div className="text-xs text-slate-500 mt-2">Notes are saved automatically when you click outside the box.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectForm({ value, onSubmit, onCancel }) {
  const [f, setF] = useState({ status: 'Planning', progress: 0, ...value });
  return (
    <>
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="col-span-2"><Label>Project Name</Label><Input value={f.name||''} onChange={e=>setF({...f, name:e.target.value})}/></div>
        <div className="col-span-2"><Label>Organization</Label><Input value={f.organizationName||''} onChange={e=>setF({...f, organizationName:e.target.value})}/></div>
        <div><Label>Product</Label><Input value={f.product||''} onChange={e=>setF({...f, product:e.target.value})}/></div>
        <div><Label>Status</Label>
          <Select value={f.status} onValueChange={v=>setF({...f, status:v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Business Owner</Label><Input value={f.businessOwner||''} onChange={e=>setF({...f, businessOwner:e.target.value})}/></div>
        <div><Label>Technical Owner</Label><Input value={f.technicalOwner||''} onChange={e=>setF({...f, technicalOwner:e.target.value})}/></div>
        <div><Label>Budget (IDR)</Label><Input type="number" value={f.budget||''} onChange={e=>setF({...f, budget:Number(e.target.value)})}/></div>
        <div><Label>Progress (%)</Label><Input type="number" value={f.progress||0} onChange={e=>setF({...f, progress:Number(e.target.value)})}/></div>
        <div><Label>Start Date</Label><Input type="date" value={f.startDate ? new Date(f.startDate).toISOString().slice(0,10) : ''} onChange={e=>setF({...f, startDate:e.target.value})}/></div>
        <div><Label>End Date</Label><Input type="date" value={f.endDate ? new Date(f.endDate).toISOString().slice(0,10) : ''} onChange={e=>setF({...f, endDate:e.target.value})}/></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={()=>onSubmit(f)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
      </DialogFooter>
    </>
  );
}
