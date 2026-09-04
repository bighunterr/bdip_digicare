'use client';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileText, Download, Trash2, Loader2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Proposal','BoM','RAB','MoM','NDA','PKS','Presentation','Architecture Diagram','Audit Report','Quotation'];
const CAT_COLOR = {
  Proposal:'bg-blue-100 text-blue-700', BoM:'bg-emerald-100 text-emerald-700',
  RAB:'bg-amber-100 text-amber-700', MoM:'bg-violet-100 text-violet-700',
  NDA:'bg-rose-100 text-rose-700', PKS:'bg-orange-100 text-orange-700',
  Presentation:'bg-fuchsia-100 text-fuchsia-700', 'Architecture Diagram':'bg-cyan-100 text-cyan-700',
  'Audit Report':'bg-red-100 text-red-700', Quotation:'bg-slate-100 text-slate-700'
};

export default function ProposalCenter() {
  const [items, setItems] = useState([]);
  const [dialog, setDialog] = useState({ open: false });
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('Proposal');

  async function load() {
    const res = await fetch('/api/proposals').then(r=>r.json());
    setItems(res);
  }
  useEffect(()=>{ load(); },[]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const b64 = arrayBufferToBase64(buf);
      const form = e.target.form;
      const title = form.title.value.trim() || file.name.replace(/\.[^.]+$/, '');
      const opp = form.opp.value.trim();
      const notes = form.notes.value.trim();
      const res = await fetch('/api/proposals', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title, category, opportunity: opp, notes, filename: file.name, mimetype: file.type, size: file.size, content: b64 })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(`Uploaded ${file.name} (v${j.version})`);
      setDialog({open:false});
      load();
    } catch (err) { toast.error('Upload failed: ' + err.message); }
    finally { setUploading(false); e.target.value = ''; }
  }

  async function download(id) {
    const res = await fetch(`/api/proposals/${id}/download`).then(r=>r.json());
    if (!res.content) { toast.error('Download failed'); return; }
    const blob = base64ToBlob(res.content, res.mimetype || 'application/octet-stream');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = res.filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function remove(id) {
    if (!confirm('Delete this document?')) return;
    await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
    load();
  }

  const grouped = useMemo(() => {
    const g = {};
    items.forEach(it => {
      const key = `${it.title}||${it.category}`;
      if (!g[key]) g[key] = { title: it.title, category: it.category, versions: [] };
      g[key].versions.push(it);
    });
    Object.values(g).forEach(x => x.versions.sort((a,b)=>b.version - a.version));
    return Object.values(g);
  }, [items]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Proposal Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Versioned document storage · Proposal / BoM / RAB / MoM / NDA / PKS / Quotation</p>
        </div>
        <Button onClick={()=>setDialog({open:true})} className="bg-blue-600 hover:bg-blue-700 gap-2"><Upload className="w-4 h-4"/>Upload Document</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CATEGORIES.slice(0,5).map(c => {
          const cnt = items.filter(x => x.category === c).length;
          return (
            <Card key={c} className="card-shadow border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <Badge className={`${CAT_COLOR[c]} hover:${CAT_COLOR[c]}`}>{c}</Badge>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{cnt}</div>
                <div className="text-xs text-slate-500">documents</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grouped.map(g => (
          <Card key={g.title+g.category} className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-blue-600"/></div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{g.title}</div>
                    <div className="text-xs text-slate-500">{g.versions.length} version{g.versions.length>1?'s':''}</div>
                  </div>
                </div>
                <Badge className={`${CAT_COLOR[g.category]||'bg-slate-100'} hover:${CAT_COLOR[g.category]||'bg-slate-100'}`}>{g.category}</Badge>
              </div>
              <div className="mt-3 space-y-1">
                {g.versions.map((v,i) => (
                  <div key={v.id} className={`flex items-center justify-between text-xs rounded p-2 ${i===0?'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800':'bg-slate-50 dark:bg-slate-800'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[10px]">v{v.version}</Badge>
                      <span className="truncate text-slate-700 dark:text-slate-300">{v.filename}</span>
                      {i===0 && <Badge className="bg-emerald-500 text-white text-[9px]">Latest</Badge>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400 mr-1">{new Date(v.createdAt).toLocaleDateString()}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>download(v.id)}><Download className="w-3.5 h-3.5"/></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>remove(v.id)}><Trash2 className="w-3.5 h-3.5 text-rose-500"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {grouped.length === 0 && (
          <Card className="col-span-full border-dashed border-slate-300 dark:border-slate-700">
            <CardContent className="p-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4"><FolderOpen className="w-8 h-8 text-blue-600"/></div>
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">No documents yet</div>
              <div className="text-sm text-slate-500 max-w-md mx-auto mt-2">Upload proposals, BoMs, MoMs, NDAs and other client documents. Digicare BDIP will version them automatically.</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialog.open} onOpenChange={(v)=>setDialog({open:v})}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <form onSubmit={e=>e.preventDefault()} className="space-y-3 py-2">
            <div><Label>Title (used for versioning)</Label><Input name="title" placeholder="e.g. SIMRS Modernization Proposal"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Linked Opportunity</Label><Input name="opp" placeholder="optional"/></div>
            </div>
            <div><Label>Notes</Label><Input name="notes" placeholder="optional notes"/></div>
            <div>
              <Label>File (max 10MB)</Label>
              <input type="file" onChange={handleUpload} className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white file:hover:bg-blue-700 mt-1" disabled={uploading}/>
            </div>
            {uploading && <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="w-4 h-4 animate-spin"/>Uploading…</div>}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog({open:false})}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i+chunk));
  return btoa(binary);
}
function base64ToBlob(b64, mime) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
