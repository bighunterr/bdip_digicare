'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, CheckCircle2, ArrowRight, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

const TARGET_FIELDS = [
  { key: 'projectName', label: 'Project Name *' },
  { key: 'organizationName', label: 'Organization' },
  { key: 'industry', label: 'Category / Industry' },
  { key: 'stage', label: 'SOP Phase / Stage' },
  { key: 'notes', label: 'Description' },
  { key: 'targetOutput', label: 'Target Output' },
  { key: 'blindSpot', label: 'Blind Spot' },
  { key: 'recommendation', label: 'Recommendation' },
  { key: 'documentation', label: 'Documentation' },
  { key: 'value', label: 'Opportunity Value' },
  { key: 'businessOwner', label: 'Business Owner' },
];

const STAGE_ALIAS = {
  'prospecting':'Prospecting','prospect':'Prospecting',
  'discovery':'Discovery','qualified':'Discovery',
  'consultative':'Consultative Meeting','meeting':'Consultative Meeting',
  'solution':'Solution Design','design':'Solution Design',
  'proposal':'Proposal Submitted','submitted':'Proposal Submitted',
  'negotiation':'Negotiation','negotiating':'Negotiation',
  'po':'PO/SPK','spk':'PO/SPK','po/spk':'PO/SPK',
  'implementation':'Implementation','delivery':'Implementation',
  'won':'Closed Won','closed won':'Closed Won',
  'lost':'Closed Lost','closed lost':'Closed Lost',
};

function normStage(v) {
  if (!v) return 'Prospecting';
  const s = String(v).toLowerCase().trim();
  for (const k of Object.keys(STAGE_ALIAS)) if (s.includes(k)) return STAGE_ALIAS[k];
  return 'Prospecting';
}

export default function ExcelImport() {
  const [step, setStep] = useState(1);
  const [rawRows, setRawRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function autoMap(cols) {
    const m = {};
    const lookup = { projectName:['project','name','proyek'], organizationName:['organization','client','org','klien'], industry:['industry','category','kategori','vertical'], stage:['stage','phase','sop','status'], notes:['description','desc','notes','deskripsi'], targetOutput:['target output','output','target'], blindSpot:['blind spot','blindspot','gap'], recommendation:['recommendation','rekomendasi'], documentation:['documentation','doc','dokumentasi'], value:['value','nilai','amount','opportunity value'], businessOwner:['owner','pic','business owner'] };
    for (const [target, keywords] of Object.entries(lookup)) {
      const found = cols.find(c => keywords.some(k => c.toLowerCase().includes(k)));
      if (found) m[target] = found;
    }
    return m;
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (json.length === 0) { toast.error('Empty spreadsheet'); return; }
      const cols = Object.keys(json[0]);
      setRawRows(json);
      setColumns(cols);
      setMapping(autoMap(cols));
      setStep(2);
      toast.success(`Loaded ${json.length} rows from ${file.name}`);
    } catch (err) {
      toast.error('Failed to read file: ' + err.message);
    }
  }

  async function commit() {
    if (!mapping.projectName) { toast.error('Please map Project Name'); return; }
    setImporting(true);
    const rows = rawRows.map(r => {
      const out = {};
      for (const [target, src] of Object.entries(mapping)) {
        if (src) out[target] = r[src];
      }
      out.stage = normStage(out.stage);
      if (out.value) out.value = Number(String(out.value).replace(/[^0-9.-]/g,'')) || 0;
      return out;
    }).filter(r => r.projectName);
    try {
      const res = await fetch('/api/opportunities/bulk', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ rows }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Import failed');
      setResult(j);
      setStep(3);
      toast.success(`Imported ${j.inserted} opportunities`);
    } catch (e) { toast.error(e.message); }
    finally { setImporting(false); }
  }

  function downloadTemplate() {
    const template = [{
      'Project Name': 'SIMRS Modernization',
      'Category': 'Healthcare',
      'SOP Phase': 'Solution Design',
      'Description': 'Modernize existing HIS with cloud-native SIMRS',
      'Target Output': 'Live SIMRS in 6 months',
      'Blind Spot': 'Change management',
      'Recommendation': 'Executive sponsorship',
      'Documentation': 'Draft proposal ready',
      'Opportunity Value': 8500000000,
      'Business Owner': 'Andi Wijaya',
      'Status': 'Prospecting'
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Opportunities');
    XLSX.writeFile(wb, 'digicare-bdip-template.xlsx');
  }

  function reset() { setStep(1); setRawRows([]); setColumns([]); setMapping({}); setResult(null); }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Excel Import Wizard</h1>
          <p className="text-sm text-slate-500">Bulk import existing pipeline from your Excel workbook</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="gap-2"><Download className="w-4 h-4"/>Download Template</Button>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-sm">
        {['Upload','Map Columns','Complete'].map((s,i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${step > i+1 ? 'bg-emerald-500 text-white' : step === i+1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > i+1 ? <CheckCircle2 className="w-4 h-4"/> : i+1}
            </div>
            <span className={step === i+1 ? 'font-semibold text-slate-900' : 'text-slate-500'}>{s}</span>
            {i < 2 && <ArrowRight className="w-4 h-4 text-slate-300 mx-2"/>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="card-shadow border-slate-200">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-4"><FileSpreadsheet className="w-8 h-8 text-blue-600"/></div>
            <div className="text-lg font-semibold text-slate-800">Upload Your Pipeline Excel</div>
            <div className="text-sm text-slate-500 max-w-md mx-auto mt-2">Supports .xlsx / .xls / .csv. First row will be used as column headers. Recognizes: Project Name, Category, SOP Phase, Description, Target Output, Blind Spot, Recommendation, Documentation, Status.</div>
            <label className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer font-medium text-sm shadow-md">
              <Upload className="w-4 h-4"/>Choose File
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden"/>
            </label>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <>
          <Card className="card-shadow border-slate-200">
            <CardHeader><CardTitle className="text-base">Map Columns – {rawRows.length} rows detected</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TARGET_FIELDS.map(t => (
                  <div key={t.key}>
                    <Label className="text-xs">{t.label}</Label>
                    <Select value={mapping[t.key] || '__none__'} onValueChange={v=>setMapping({...mapping, [t.key]: v === '__none__' ? '' : v})}>
                      <SelectTrigger><SelectValue placeholder="Not mapped"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Not mapped --</SelectItem>
                        {columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow border-slate-200">
            <CardHeader><CardTitle className="text-base">Preview (first 5 rows)</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>{TARGET_FIELDS.filter(f => mapping[f.key]).map(f => <th key={f.key} className="text-left px-3 py-2 font-semibold text-slate-600 text-xs">{f.label}</th>)}</tr>
                </thead>
                <tbody>
                  {rawRows.slice(0,5).map((r,i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {TARGET_FIELDS.filter(f => mapping[f.key]).map(f => {
                        let v = r[mapping[f.key]];
                        if (f.key === 'stage') v = normStage(v);
                        return <td key={f.key} className="px-3 py-2 text-slate-700 max-w-xs truncate">{String(v||'-')}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={reset}>Back</Button>
            <Button onClick={commit} disabled={importing || !mapping.projectName} className="bg-blue-600 hover:bg-blue-700 gap-2">
              {importing ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
              Import {rawRows.length} Opportunities
            </Button>
          </div>
        </>
      )}

      {step === 3 && result && (
        <Card className="card-shadow border-slate-200">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-600"/></div>
            <div className="text-lg font-semibold text-slate-800">Import Complete!</div>
            <div className="text-sm text-slate-500 mt-2">{result.inserted} opportunities added to your CRM pipeline</div>
            <Badge className="mt-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1"><CheckCircle2 className="w-3 h-3"/>{result.inserted} rows imported</Badge>
            <div className="mt-6">
              <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">Import Another File</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
