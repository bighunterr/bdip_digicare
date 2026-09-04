'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Clock, Target } from 'lucide-react';

function fmtIDR(n) {
  if (!n) return 'On request';
  if (n >= 1e9) return `Rp ${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `Rp ${(n/1e6).toFixed(0)}M`;
  return `Rp ${n.toLocaleString()}`;
}

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  useEffect(()=>{ fetch('/api/products').then(r=>r.json()).then(setProducts); },[]);
  const filtered = products.filter(p => !q || (p.name||'').toLowerCase().includes(q.toLowerCase()) || (p.desc||'').toLowerCase().includes(q.toLowerCase()) || (p.target||[]).some(t => t.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Product Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{products.length} Digicare products · modules, pricing, target industry</p>
        </div>
        <Input placeholder="Search product or industry…" value={q} onChange={e=>setQ(e.target.value)} className="w-72"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="card-shadow card-shadow-hover border-slate-200 dark:border-slate-700 overflow-hidden">
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
    </div>
  );
}
