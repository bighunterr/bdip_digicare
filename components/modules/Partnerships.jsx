'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Handshake, Trash2, Upload, Download, FileText, Loader2, Phone, Mail, MapPin, ShieldCheck, Plus } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Network','Security','Compute','Storage','Cloud','Various','Network + Cloud','Network + Security','Compute + Storage'];
const TIERS = ['Platinum','Gold','Silver','Bronze'];
const DOC_CATEGORIES = ['SLA','Contract','NDA','PKS','BoM','Price List','Certification','Brochure'];

const TIER_COLOR = { Platinum: 'bg-gradient-to-r from-slate-300 to-slate-500 text-white', Gold: 'bg-gradient-to-r from-amber-300 to-amber-500 text-white', Silver: 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-800', Bronze: 'bg-gradient-to-r from-orange-300 to-orange-600 text-white' };

export default function Partnerships() {
  const [partners, setPartners] = useState([]);
  const [dialog, setDialog] = useState({ open: false, partner: null });
  const [drawer, setDrawer] = useState({ open: false, partner: null });
  const [docs, setDocs] = useState([]);
  const [docDialog, setDocDialog] = useState({ open: false });
  const [uploading, setUploading] = useState(false);
  const [docCategory, setDocCategory] = useState('SLA');
  const [q, setQ] = useState('');

  async function load() {
    const res = await fetch('/api/partners').then(r=>r.json());
    setPartners(res);
  }
  useEffect(()=>{ load(); },[]);

  async function save(form) {
    const method = form.id ? 'PATCH' : 'POST';
    const url = form.id ? `/api/partners/${form.id}` : '/api/partners';
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    if (res.ok) { toast.success('Partner saved'); setDialog({open:false, partner:null}); load(); }
    else toast.error('Save failed');
  }
  async function remove(id) {
    if (!confirm('Delete this partner and all its documents?')) return;
    await fetch(`/api/partners/${id}`, { method: 'DELETE' });
    load();
  }

  async function openPartner(p) {
    setDrawer({ open: true, partner: p });
    const d = await fetch(`/api/partners/${p.id}/documents`).then(r=>r.json());
    setDocs(d);
  }

  async function handleDocUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !drawer.partner) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf); let binary=''; const chunk=0x8000;
      for (let i=0; i<bytes.length; i+=chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i+chunk));
      const b64 = btoa(binary);
      const form = e.target.form;
      const title = form.title.value.trim() || file.name.replace(/\.[^.]+$/, '');
      const res = await fetch(`/api/partners/${drawer.partner.id}/documents`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, category: docCategory, filename: file.name, mimetype: file.type, size: file.size, content: b64 }) });
      if (!res.ok) throw new Error('Upload failed');
      const j = await res.json();
      toast.success(`Uploaded: ${j.title}`);
      const d = await fetch(`/api/partners/${drawer.partner.id}/documents`).then(r=>r.json());
      setDocs(d);
      setDocDialog({open:false});
    } catch (err) { toast.error('Upload failed: ' + err.message); }
    finally { setUploading(false); e.target.value = ''; }
  }

  async function downloadDoc(id) {
    const res = await fetch(`/api/partner-docs/${id}/download`).then(r=>r.json());
    if (!res.content) { toast.error('Download failed'); return; }
    const bin = atob(res.content);
    const arr = new Uint8Array(bin.length);
    for (let i=0; i<bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: res.mimetype });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=res.filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteDoc(id) {
    await fetch(`/api/partner-docs/${id}`, { method: 'DELETE' });
    const d = await fetch(`/api/partners/${drawer.partner.id}/documents`).then(r=>r.json());
    setDocs(d);
  }

  const filtered = partners.filter(p => !q || (p.name||'').toLowerCase().includes(q.toLowerCase()) || (p.category||'').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Partnerships</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{partners.length} partners · SLA / Contract / NDA / PKS / BoM / Price List</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search partner…" value={q} onChange={e=>setQ(e.target.value)} className="w-64"/>
          <Button onClick={()=>setDialog({open:true, partner:{}})} className="bg-blue-600 hover:bg-blue-700 gap-2"><Plus className="w-4 h-4"/>New Partner</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(p => (
          <Card key={p.id} onClick={()=>openPartner(p)} className="card-shadow card-shadow-hover cursor-pointer border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className={`h-1.5 ${p.tier === 'Platinum' ? 'bg-gradient-to-r from-slate-400 to-slate-600' : p.tier === 'Gold' ? 'bg-gradient-to-r from-amber-400 to-amber-600' : p.tier === 'Silver' ? 'bg-gradient-to-r from-slate-300 to-slate-500' : 'bg-gradient-to-r from-orange-400 to-orange-600'}`}/>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0"><Handshake className="w-5 h-5 text-blue-600"/></div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.category}</div>
                    </div>
                  </div>
                </div>
                <Badge className={`${TIER_COLOR[p.tier]||'bg-slate-100'} shadow-sm`}>{p.tier}</Badge>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 truncate"><MapPin className="w-3 h-3 shrink-0"/>{p.country}</div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 truncate"><Mail className="w-3 h-3 shrink-0"/>{p.email}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(p.products || []).slice(0,3).map(pr => <Badge key={pr} variant="secondary" className="text-[10px] font-normal">{pr}</Badge>)}
                {(p.products || []).length > 3 && <Badge variant="outline" className="text-[10px]">+{p.products.length-3}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Partner Detail Drawer */}
      <Sheet open={drawer.open} onOpenChange={(v)=>setDrawer({open:v, partner: v?drawer.partner:null})}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {drawer.partner && (
            <>
              <SheetHeader>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center"><Handshake className="w-7 h-7 text-blue-600"/></div>
                  <div>
                    <SheetTitle className="text-xl">{drawer.partner.name}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${TIER_COLOR[drawer.partner.tier]||'bg-slate-100'}`}>{drawer.partner.tier}</Badge>
                      <Badge variant="outline">{drawer.partner.category}</Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="docs">Documents ({docs.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-3 mt-3">
                  <Card className="card-shadow"><CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><Mail className="w-4 h-4 text-blue-600"/>{drawer.partner.email}</div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><Phone className="w-4 h-4 text-blue-600"/>{drawer.partner.phone}</div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><MapPin className="w-4 h-4 text-blue-600"/>{drawer.partner.country}</div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><ShieldCheck className="w-4 h-4 text-emerald-600"/>SLA: {drawer.partner.sla}</div>
                  </CardContent></Card>
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Products / Solutions</div>
                    <div className="flex flex-wrap gap-2">
                      {(drawer.partner.products || []).map(pr => <Badge key={pr} variant="secondary">{pr}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Contact Person</div>
                    <div className="text-sm text-slate-800 dark:text-slate-200">{drawer.partner.contactName}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Notes</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{drawer.partner.notes || '–'}</div>
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Button variant="outline" onClick={()=>{ setDrawer({open:false, partner:null}); setTimeout(()=>setDialog({open:true, partner:drawer.partner}), 200); }}>Edit</Button>
                    <Button variant="outline" onClick={()=>{ remove(drawer.partner.id); setDrawer({open:false, partner:null}); }}><Trash2 className="w-4 h-4 text-rose-500"/></Button>
                  </div>
                </TabsContent>
                <TabsContent value="docs" className="space-y-3 mt-3">
                  <Button onClick={()=>setDocDialog({open:true})} className="w-full bg-blue-600 hover:bg-blue-700 gap-2"><Upload className="w-4 h-4"/>Upload Document</Button>
                  <div className="space-y-2">
                    {docs.length === 0 && <div className="text-center text-sm text-slate-400 py-8">No documents yet</div>}
                    {docs.map(d => (
                      <Card key={d.id} className="card-shadow-hover">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center"><FileText className="w-4 h-4 text-blue-600"/></div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{d.title}</div>
                            <div className="text-xs text-slate-500 truncate">{d.filename} · {(d.size/1024).toFixed(0)}KB</div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{d.category}</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>downloadDoc(d.id)}><Download className="w-4 h-4"/></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>deleteDoc(d.id)}><Trash2 className="w-4 h-4 text-rose-500"/></Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Partner Form */}
      <Dialog open={dialog.open} onOpenChange={(v)=>setDialog({open:v, partner: v?dialog.partner:null})}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialog.partner?.id ? 'Edit Partner' : 'New Partner'}</DialogTitle></DialogHeader>
          <PartnerForm value={dialog.partner || {}} onSubmit={save} onCancel={()=>setDialog({open:false, partner:null})}/>
        </DialogContent>
      </Dialog>

      {/* Document Upload */}
      <Dialog open={docDialog.open} onOpenChange={(v)=>setDocDialog({open:v})}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Partner Document</DialogTitle></DialogHeader>
          <form onSubmit={e=>e.preventDefault()} className="space-y-3 py-2">
            <div><Label>Title</Label><Input name="title" placeholder="e.g. Huawei SLA 2026"/></div>
            <div><Label>Category</Label>
              <Select value={docCategory} onValueChange={setDocCategory}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{DOC_CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>File (max 10MB)</Label>
              <input type="file" onChange={handleDocUpload} className="block w-full text-sm mt-1 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white" disabled={uploading}/>
            </div>
            {uploading && <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="w-4 h-4 animate-spin"/>Uploading…</div>}
          </form>
          <DialogFooter><Button variant="outline" onClick={()=>setDocDialog({open:false})}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PartnerForm({ value, onSubmit, onCancel }) {
  const [f, setF] = useState({ tier: 'Silver', category: 'Network', status: 'Active', ...value });
  return (
    <>
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="col-span-2"><Label>Partner Name</Label><Input value={f.name||''} onChange={e=>setF({...f, name:e.target.value})}/></div>
        <div><Label>Category</Label>
          <Select value={f.category} onValueChange={v=>setF({...f, category:v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Tier</Label>
          <Select value={f.tier} onValueChange={v=>setF({...f, tier:v})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>{TIERS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Country</Label><Input value={f.country||''} onChange={e=>setF({...f, country:e.target.value})}/></div>
        <div><Label>Contact Name</Label><Input value={f.contactName||''} onChange={e=>setF({...f, contactName:e.target.value})}/></div>
        <div><Label>Email</Label><Input value={f.email||''} onChange={e=>setF({...f, email:e.target.value})}/></div>
        <div><Label>Phone</Label><Input value={f.phone||''} onChange={e=>setF({...f, phone:e.target.value})}/></div>
        <div className="col-span-2"><Label>Products (comma-separated)</Label><Input value={(f.products||[]).join(', ')} onChange={e=>setF({...f, products: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}/></div>
        <div className="col-span-2"><Label>SLA</Label><Input value={f.sla||''} onChange={e=>setF({...f, sla:e.target.value})}/></div>
        <div className="col-span-2"><Label>Notes</Label><Input value={f.notes||''} onChange={e=>setF({...f, notes:e.target.value})}/></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={()=>onSubmit(f)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
      </DialogFooter>
    </>
  );
}
