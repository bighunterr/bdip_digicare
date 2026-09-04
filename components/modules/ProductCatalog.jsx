'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, TrendingUp, Clock, Target, Sparkles, CheckCircle2, Cog, Lightbulb, Layers, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';

function fmtIDR(n) {
  if (!n) return 'On request';
  if (n >= 1e9) return `Rp ${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `Rp ${(n/1e6).toFixed(0)}M`;
  return `Rp ${n.toLocaleString()}`;
}

export default function ProductCatalog({ onAI }) {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(()=>{ fetch('/api/products').then(r=>r.json()).then(setProducts); },[]);

  const filtered = products.filter(p => !q || (p.name||'').toLowerCase().includes(q.toLowerCase()) || (p.desc||'').toLowerCase().includes(q.toLowerCase()) || (p.target||[]).some(t => t.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Product Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{products.length} Digicare products · click any card for full detail</p>
        </div>
        <Input placeholder="Search product or industry…" value={q} onChange={e=>setQ(e.target.value)} className="w-72"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} onClick={()=>setSelected(p)} className="card-shadow card-shadow-hover cursor-pointer border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500"/>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-blue-600"/></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{p.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{p.desc}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {(p.modules||[]).slice(0,4).map(m => <Badge key={m} variant="secondary" className="text-[10px] font-normal">{m}</Badge>)}
                {(p.modules||[]).length > 4 && <Badge variant="outline" className="text-[10px]">+{p.modules.length-4}</Badge>}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3"/>Starting</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{fmtIDR(p.startingPrice)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><Package className="w-3 h-3"/>MRR</div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">{p.subscription ? fmtIDR(p.subscription) : '–'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/>Impl</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{p.implWeeks}w</div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <Target className="w-3 h-3 text-slate-400"/>
                <div className="flex flex-wrap gap-1">
                  {(p.target||[]).map(t => <Badge key={t} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 text-[10px]">{t}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProductDetailDialog product={selected} onClose={()=>setSelected(null)} onAI={onAI}/>
    </div>
  );
}

function ProductDetailDialog({ product, onClose, onAI }) {
  if (!product) return null;
  return (
    <Dialog open={!!product} onOpenChange={(v)=>!v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shrink-0"><Package className="w-8 h-8 text-white"/></div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{product.name}</DialogTitle>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{product.desc}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(product.target||[]).map(t => <Badge key={t} className="bg-blue-100 text-blue-700 hover:bg-blue-100">{t}</Badge>)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Card className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3"/>Starting Price</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{fmtIDR(product.startingPrice)}</div>
            </CardContent>
          </Card>
          <Card className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><Package className="w-3 h-3"/>Monthly MRR</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">{product.subscription ? fmtIDR(product.subscription) : '–'}</div>
            </CardContent>
          </Card>
          <Card className="card-shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/>Implementation</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{product.implWeeks} weeks</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="features" className="mt-4">
          <TabsList>
            <TabsTrigger value="features" className="gap-1"><CheckCircle2 className="w-3.5 h-3.5"/>Features</TabsTrigger>
            <TabsTrigger value="benefits" className="gap-1"><Lightbulb className="w-3.5 h-3.5"/>Benefits</TabsTrigger>
            <TabsTrigger value="usecases" className="gap-1"><BookOpen className="w-3.5 h-3.5"/>Use Cases</TabsTrigger>
            <TabsTrigger value="modules" className="gap-1"><Layers className="w-3.5 h-3.5"/>Modules</TabsTrigger>
            <TabsTrigger value="tech" className="gap-1"><Cog className="w-3.5 h-3.5"/>Tech Specs</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(product.features || []).map((f,i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"/>
                  <span className="text-sm text-slate-800 dark:text-slate-200">{f}</span>
                </div>
              ))}
              {(!product.features || product.features.length === 0) && <div className="text-sm text-slate-400 col-span-2 text-center py-6">Features not defined yet</div>}
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="mt-3">
            <div className="space-y-2">
              {(product.benefits || []).map((b,i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold text-sm flex items-center justify-center shrink-0">{i+1}</div>
                  <span className="text-sm text-slate-800 dark:text-slate-200">{b}</span>
                </div>
              ))}
              {(!product.benefits || product.benefits.length === 0) && <div className="text-sm text-slate-400 text-center py-6">Benefits not defined yet</div>}
            </div>
          </TabsContent>

          <TabsContent value="usecases" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(product.useCases || []).map((u,i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <BookOpen className="w-4 h-4 text-orange-500 mb-1"/>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{u}</div>
                </div>
              ))}
              {(!product.useCases || product.useCases.length === 0) && <div className="text-sm text-slate-400 col-span-2 text-center py-6">Use cases not defined yet</div>}
            </div>
          </TabsContent>

          <TabsContent value="modules" className="mt-3">
            <div className="flex flex-wrap gap-2">
              {(product.modules || []).map(m => (
                <div key={m} className="px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-sm text-violet-800 dark:text-violet-200 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5"/>{m}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tech" className="mt-3">
            <Card className="card-shadow border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Cog className="w-5 h-5 text-slate-500 shrink-0 mt-0.5"/>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{product.techSpecs || 'Technical specifications not defined yet.'}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {onAI && (
            <Button onClick={()=>{ onAI(product); onClose(); }} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Sparkles className="w-4 h-4"/>Generate Proposal for this Product
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
