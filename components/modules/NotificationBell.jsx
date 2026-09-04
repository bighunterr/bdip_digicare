'use client';
import { useEffect, useState, useRef } from 'react';
import { Bell, AlertTriangle, Clock, DollarSign, ShieldAlert, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ICON = { overdue: Clock, upcoming: Clock, highvalue: DollarSign, risk: ShieldAlert };
const LEVEL = { high: 'bg-rose-500', medium: 'bg-orange-500', low: 'bg-blue-500' };

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  async function load() {
    try { const j = await fetch('/api/notifications').then(r=>r.json()); setItems(j || []); }
    catch {}
  }
  useEffect(() => { load(); const t = setInterval(load, 45000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = items.length;

  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(!open)} className="relative w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center">
        <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300"/>
        {unread > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">Notifications</div>
              <div className="text-xs text-slate-500">{unread} new alerts</div>
            </div>
            <button onClick={()=>setOpen(false)}><X className="w-4 h-4 text-slate-500"/></button>
          </div>
          <div className="overflow-y-auto flex-1 scrollbar-thin">
            {items.length === 0 && <div className="p-8 text-center text-sm text-slate-400">You're all caught up!</div>}
            {items.map(n => {
              const Icon = ICON[n.type] || AlertTriangle;
              return (
                <div key={n.id} className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${LEVEL[n.level] || 'bg-slate-400'}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-500"/>
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{n.title}</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{n.desc}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(n.at).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
