'use client';
import { useEffect, useRef, useState } from 'react';
import { Search, Briefcase, Building2, CalendarClock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function GlobalSearch({ onSelectOpportunity, onSelectOrg, onSelectActivity }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ opportunities: [], organizations: [], activities: [] });
  const ref = useRef();
  const debounceRef = useRef();

  useEffect(() => {
    if (!q.trim()) { setResults({ opportunities: [], organizations: [], activities: [] }); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const j = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then(r=>r.json());
        setResults(j);
      } catch {}
      finally { setLoading(false); }
    }, 250);
  }, [q]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const total = results.opportunities.length + results.organizations.length + results.activities.length;
  const show = open && q.trim().length > 0;

  return (
    <div ref={ref} className="flex-1 max-w-xl relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
      <Input
        value={q}
        onChange={e=>{ setQ(e.target.value); setOpen(true); }}
        onFocus={()=>setOpen(true)}
        placeholder="Search opportunities, organizations, activities…"
        className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
      />
      {show && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[480px] overflow-y-auto">
          {loading && <div className="p-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin"/>Searching…</div>}
          {!loading && total === 0 && <div className="p-6 text-center text-sm text-slate-400">No results for "{q}"</div>}
          {results.opportunities.length > 0 && (
            <Section label="Opportunities" icon={Briefcase}>
              {results.opportunities.map(o => (
                <button key={o.id} onClick={()=>{onSelectOpportunity?.(o); setOpen(false); setQ('');}} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{o.projectName}</div>
                    <div className="text-xs text-slate-500 truncate">{o.organizationName} · {o.stage}</div>
                  </div>
                  <div className="text-xs text-emerald-600 font-semibold shrink-0">Rp {((o.value||0)/1e9).toFixed(1)}B</div>
                </button>
              ))}
            </Section>
          )}
          {results.organizations.length > 0 && (
            <Section label="Organizations" icon={Building2}>
              {results.organizations.map(o => (
                <button key={o.id} onClick={()=>{onSelectOrg?.(o); setOpen(false); setQ('');}} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{o.name}</div>
                  <div className="text-xs text-slate-500 truncate">{o.industry} · {o.province}</div>
                </button>
              ))}
            </Section>
          )}
          {results.activities.length > 0 && (
            <Section label="Activities" icon={CalendarClock}>
              {results.activities.map(a => (
                <button key={a.id} onClick={()=>{onSelectActivity?.(a); setOpen(false); setQ('');}} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.title}</div>
                  <div className="text-xs text-slate-500 truncate">{a.type} · {a.organizationName}</div>
                </button>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, icon: Icon, children }) {
  return (
    <div className="p-2">
      <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">
        <Icon className="w-3 h-3"/>{label}
      </div>
      <div>{children}</div>
    </div>
  );
}
