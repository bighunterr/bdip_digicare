'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(()=>setMounted(true),[]);
  if (!mounted) return <div className="w-9 h-9"/>;
  return (
    <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center" title={theme==='dark'?'Light mode':'Dark mode'}>
      {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-300"/> : <Moon className="w-4 h-4 text-slate-600"/>}
    </button>
  );
}
