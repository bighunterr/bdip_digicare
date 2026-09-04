'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Building2, Users2, Trash2, Star, Crown, Wrench, Award } from 'lucide-react';
import { toast } from 'sonner';

const INDUSTRIES = ['Healthcare','Military','Government','Education','Industrial Estate','BUMN','Private Enterprise'];
const PROVINCES = ['DKI Jakarta','Jawa Barat','Jawa Tengah','Jawa Timur','DI Yogyakarta','Banten','Bali','Sumatera Utara','Sumatera Selatan','Sulawesi Selatan','Kalimantan Timur','Papua'];
const INFLUENCE = ['High','Medium','Low'];

export default function OrganizationsView() {
  const [orgs, setOrgs] = useState([]);
  const [dialog, setDialog] = useState({ open: false, org: null });
  const [drawer, setDrawer] = useState({ open: false, org: null });
  const [stakeholders, setStakeholders] = useState([]);
  const [shDialog, setShDialog] = useState({ open: false, sh: null });
  const [q, setQ] = useState('');

  async function load() {
    const res = await fetch('/api/organizations').then(r=>r.json());
    setOrgs(res);
  }
  useEffect(()=>{ load(); },[]);

  async function save(form) {
    const method = form.id ? 'PATCH' : 'POST';
    const url = form.id ? `/api/organizations/${form.id}` : '/api/organizations';
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (res.ok) { toast.success('Organization saved'); setDialog({open:false, org:null}); load(); }
    else toast.error('Save failed');
  }

  async function remove(id) {
    if (!confirm('Delete this organization and its stakeholders?')) return;
    await fetch(`/api/organizations/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    load();
  }

  async function openStakeholders(org) {
    setDrawer({ open: true, org });
    const list = await fetch(`/api/organizations/${org.id}/stakeholders`).then(r=>r.json());
    setStakeholders(list);
  }

  async function saveStakeholder(form) {
    const org = drawer.org;
    if (form.id) {
      await fetch(`/api/stakeholders/${form.id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    } else {
      await fetch(`/api/organizations/${org.id}/stakeholders`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    }
    toast.success('Stakeholder saved');
    setShDialog({ open: false, sh: null });
    const list = await fetch(`/api/organizations/${org.id}/stakeholders`).then(r=>r.json());
    setStakeholders(list);
  }

  async function removeSh(id) {
    await fetch(`/api/stakeholders/${id}`, { method: 'DELETE' });
    const list = await fetch(`/api/organizations/${drawer.org.id}/stakeholders`).then(r=>r.json());
    setStakeholders(list);
  }

  const filtered = orgs.filter(o => !q || (o.name||'').toLowerCase().includes(q.toLowerCase()) || (o.industry||'').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
          <p className="text-sm text-slate-500">Client master data · {orgs.length} organizations · map stakeholders per client</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search organization or industry…" value={q} onChange={e=>setQ(e.target.value)} className="w-64"/>
          <Button onClick={()=>setDialog({open:true, org:{}})} className="bg-blue-600 hover:bg-blue-700 gap-2"><Plus className="w-4 h-4"/>New Organization</Button>
        </div>
      </div>

      <Card className="card-shadow border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Organization</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Industry</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Province</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Segment</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Building2 className="w-4 h-4 text-blue-600"/></div>
                        <div>
                          <div className="font-semibold text-slate-900">{o.name}</div>
                          <div className="text-xs text-slate-500">{o.website}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant="secondary">{o.industry}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{o.province}</td>
                    <td className="px-4 py-3 text-slate-600">{o.segment}</td>
                    <td className="px-4 py-3"><Badge className={o.status==='Active'?'bg-emerald-100 text-emerald-700 hover:bg-emerald-100':'bg-slate-100 text-slate-700 hover:bg-slate-100'}>{o.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={()=>openStakeholders(o)} className="gap-1 text-blue-600"><Users2 className="w-3.5 h-3.5"/>Stakeholders</Button>
                      <Button variant="ghost" size="sm" onClick={()=>setDialog({open:true, org:o})}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={()=>remove(o.id)}><Trash2 className="w-4 h-4 text-rose-500"/></Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No organizations</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Organization Dialog */}
      <Dialog open={dialog.open} onOpenChange={(v)=>setDialog({open:v, org: v?dialog.org:null})}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialog.org?.id ? 'Edit Organization' : 'New Organization'}</DialogTitle></DialogHeader>
          <OrgForm value={dialog.org || {}} onSubmit={save} onCancel={()=>setDialog({open:false,org:null})}/>
        </DialogContent>
      </Dialog>

      {/* Stakeholders Drawer */}
      <Sheet open={drawer.open} onOpenChange={(v)=>setDrawer({open:v, org: v?drawer.org:null})}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Stakeholders · {drawer.org?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={()=>setShDialog({open:true, sh:{}})} className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4"/>Add Stakeholder</Button>
          </div>
          <div className="mt-3 space-y-2">
            {stakeholders.map(s => (
              <Card key={s.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.position} · {s.department}</div>
                      <div className="text-xs text-slate-500 mt-1">{s.email} · {s.phone}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.decisionMaker && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1"><Crown className="w-3 h-3"/>Decision</Badge>}
                        {s.budgetOwner && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1"><Award className="w-3 h-3"/>Budget</Badge>}
                        {s.technicalPIC && <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 gap-1"><Wrench className="w-3 h-3"/>Technical</Badge>}
                        {s.champion && <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1"><Star className="w-3 h-3"/>Champion</Badge>}
                        {s.influence && <Badge variant="outline">Influence: {s.influence}</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm" onClick={()=>setShDialog({open:true, sh:s})}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={()=>removeSh(s.id)}><Trash2 className="w-4 h-4 text-rose-500"/></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {stakeholders.length === 0 && <div className="text-center text-sm text-slate-400 py-10">No stakeholders yet</div>}
          </div>
        </SheetContent>
      </Sheet>

      {/* Stakeholder Dialog */}
      <Dialog open={shDialog.open} onOpenChange={(v)=>setShDialog({open:v, sh: v?shDialog.sh:null})}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{shDialog.sh?.id ? 'Edit Stakeholder' : 'New Stakeholder'}</DialogTitle></DialogHeader>
          <StakeholderForm value={shDialog.sh || {}} onSubmit={saveStakeholder} onCancel={()=>setShDialog({open:false, sh:null})}/>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrgForm({ value, onSubmit, onCancel }) {
  const [f, setF] = useState(value);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="col-span-2"><Label>Organization Name</Label><Input value={f.name||''} onChange={e=>setF({...f, name:e.target.value})}/></div>
        <div><Label>Industry</Label>
          <Select value={f.industry} onValueChange={v=>setF({...f, industry:v})}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>{INDUSTRIES.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Province</Label>
          <Select value={f.province} onValueChange={v=>setF({...f, province:v})}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>{PROVINCES.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Address</Label><Input value={f.address||''} onChange={e=>setF({...f, address:e.target.value})}/></div>
        <div><Label>Website</Label><Input value={f.website||''} onChange={e=>setF({...f, website:e.target.value})}/></div>
        <div><Label>Segment</Label><Input value={f.segment||''} onChange={e=>setF({...f, segment:e.target.value})}/></div>
        <div><Label>Budget Source</Label><Input value={f.budgetSource||''} onChange={e=>setF({...f, budgetSource:e.target.value})}/></div>
        <div><Label>Status</Label>
          <Select value={f.status||'Active'} onValueChange={v=>setF({...f, status:v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Prospect">Prospect</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={()=>onSubmit(f)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
      </DialogFooter>
    </>
  );
}

function StakeholderForm({ value, onSubmit, onCancel }) {
  const [f, setF] = useState(value);
  const check = (k) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={!!f[k]} onChange={e=>setF({...f, [k]: e.target.checked})}/>
      <span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
    </label>
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="col-span-2"><Label>Name</Label><Input value={f.name||''} onChange={e=>setF({...f, name:e.target.value})}/></div>
        <div><Label>Position</Label><Input value={f.position||''} onChange={e=>setF({...f, position:e.target.value})}/></div>
        <div><Label>Department</Label><Input value={f.department||''} onChange={e=>setF({...f, department:e.target.value})}/></div>
        <div><Label>Phone</Label><Input value={f.phone||''} onChange={e=>setF({...f, phone:e.target.value})}/></div>
        <div><Label>Email</Label><Input value={f.email||''} onChange={e=>setF({...f, email:e.target.value})}/></div>
        <div><Label>Influence Level</Label>
          <Select value={f.influence} onValueChange={v=>setF({...f, influence:v})}>
            <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
            <SelectContent>{INFLUENCE.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2 pt-2">
          {check('decisionMaker')}
          {check('budgetOwner')}
          {check('technicalPIC')}
          {check('champion')}
        </div>
        <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={f.notes||''} onChange={e=>setF({...f, notes:e.target.value})}/></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={()=>onSubmit(f)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
      </DialogFooter>
    </>
  );
}
