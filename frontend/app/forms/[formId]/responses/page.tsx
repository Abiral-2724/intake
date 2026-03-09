"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import LoadingPage from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, BarChart2, List, Table2, Download, Trash2, ChevronRight,
  User, Clock, Search, Star, ChevronDown, ChevronUp, FileText,
  Sheet, BookOpen, ExternalLink, Copy, Check, Plug, FileJson,
  ArrowUpDown, Inbox, RefreshCw, Zap, Loader2, AlertCircle, Unlink, Brain, TrendingUp,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Answer = { blockId: string; value: any; block: { id: string; type: string; label: string; order: number } };
type Resp = {
  id: string; submittedAt: string; isComplete: boolean;
  metadata?: { ip?: string; userAgent?: string };
  user?: { firstName?: string; lastName?: string; email?: string };
  answers: Answer[];
};
type Summary = {
  totalResponses: number;
  blocks: { blockId: string; type: string; label: string; totalAnswers: number; distribution?: Record<string,number>; average?: number; samples?: string[] }[];
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
const fmtVal  = (v: any): string => { if(v===null||v===undefined) return "—"; if(Array.isArray(v)) return v.join(", "); return String(v); };

// ── Downloads ────────────────────────────────────────────────────
function downloadCSV(responses: Resp[], columns: {id:string;label:string}[], title: string) {
  const header = ["#","Submitted at","Status",...columns.map(c=>`"${c.label.replace(/"/g,'""')}"`)] ;
  const rows = responses.map((r,i)=>{
    const base=[i+1,`"${new Date(r.submittedAt).toLocaleString()}"`,r.isComplete?"Complete":"Partial"];
    const vals=columns.map(c=>{const a=r.answers.find(a=>a.blockId===c.id);return `"${fmtVal(a?.value).replace(/"/g,'""')}"`; });
    return [...base,...vals];
  });
  const csv=[header,...rows].map(r=>r.join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`${title}-responses.csv`;a.click();
  URL.revokeObjectURL(url);
}
function downloadJSON(responses: Resp[], title: string) {
  const data=responses.map((r,i)=>({index:i+1,id:r.id,submittedAt:r.submittedAt,isComplete:r.isComplete,answers:Object.fromEntries(r.answers.map(a=>[a.block.label||a.blockId,a.value]))}));
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`${title}-responses.json`;a.click();
  URL.revokeObjectURL(url);
}

// ── Summary Card ─────────────────────────────────────────────────
function SummaryCard({block}:{block:Summary["blocks"][0]}) {
  if(block.distribution) {
    const total=Object.values(block.distribution).reduce((a,b)=>a+b,0);
    const sorted=Object.entries(block.distribution).sort((a,b)=>b[1]-a[1]);
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div><p className="font-medium text-gray-900 text-sm">{block.label||"(no label)"}</p><p className="text-xs text-gray-400 mt-0.5">{block.totalAnswers} answers</p></div>
          <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">{block.type.replace(/_/g," ").toLowerCase()}</span>
        </div>
        <div className="space-y-2.5">
          {sorted.map(([label,count])=>(
            <div key={label}>
              <div className="flex justify-between mb-1"><span className="text-xs text-gray-700 truncate max-w-[65%]">{label}</span><span className="text-xs font-medium text-gray-500">{count} · {total?Math.round(count/total*100):0}%</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:`${total?count/total*100:0}%`}}/></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if(block.average!==undefined&&block.average!==null) {
    const max=block.type==="RATING"?5:10;
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div><p className="font-medium text-gray-900 text-sm">{block.label||"(no label)"}</p><p className="text-xs text-gray-400 mt-0.5">{block.totalAnswers} answers</p></div>
          <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">{block.type.replace(/_/g," ").toLowerCase()}</span>
        </div>
        {block.type==="RATING"?(
          <div className="flex items-end gap-3 mt-3">
            <div className="text-4xl font-bold text-gray-900">{block.average}</div>
            <div className="flex pb-1.5">{[1,2,3,4,5].map(n=><Star key={n} className={cn("w-5 h-5",n<=Math.round(block.average!)?"text-amber-400 fill-amber-400":"text-gray-200")}/>)}</div>
          </div>
        ):(
          <div className="flex items-end gap-3 mt-3"><div className="text-4xl font-bold text-gray-900">{block.average}</div><div className="text-sm text-gray-400 pb-1">/ {max}</div></div>
        )}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3"><div className="h-full bg-blue-500 rounded-full" style={{width:`${block.average!/max*100}%`}}/></div>
      </div>
    );
  }
  if(block.samples) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div><p className="font-medium text-gray-900 text-sm">{block.label||"(no label)"}</p><p className="text-xs text-gray-400 mt-0.5">{block.totalAnswers} answers</p></div>
          <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">{block.type.replace(/_/g," ").toLowerCase()}</span>
        </div>
        <div className="space-y-2">
          {block.samples.length===0?<p className="text-sm text-gray-400">No responses yet</p>:block.samples.map((s,i)=>(
            <div key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 line-clamp-2">{String(s)}</div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// ── Table View ───────────────────────────────────────────────────
function TableView({responses,columns,onRowClick}:{responses:Resp[];columns:{id:string;label:string;type:string;order:number}[];onRowClick:(r:Resp)=>void}) {
  const [sortCol,setSortCol]=useState<string|null>(null);
  const [sortDir,setSortDir]=useState<"asc"|"desc">("asc");
  const [search,setSearch]=useState("");
  const filtered=useMemo(()=>{
    let rows=[...responses];
    if(search) rows=rows.filter(r=>r.answers.some(a=>fmtVal(a.value).toLowerCase().includes(search.toLowerCase())));
    if(sortCol==="date") rows.sort((a,b)=>{const d=new Date(a.submittedAt).getTime()-new Date(b.submittedAt).getTime();return sortDir==="asc"?d:-d;});
    else if(sortCol) rows.sort((a,b)=>{const av=fmtVal(a.answers.find(x=>x.blockId===sortCol)?.value);const bv=fmtVal(b.answers.find(x=>x.blockId===sortCol)?.value);return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);});
    return rows;
  },[responses,search,sortCol,sortDir]);
  const toggleSort=(col:string)=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("asc");}};
  const SI=({col}:{col:string})=>sortCol!==col?<ArrowUpDown className="w-3 h-3 text-gray-300"/>:sortDir==="asc"?<ChevronUp className="w-3 h-3 text-blue-500"/>:<ChevronDown className="w-3 h-3 text-blue-500"/>;
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
          <Input className="pl-8 h-8 text-xs bg-white border-gray-200" placeholder="Search responses…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {responses.length} rows</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 w-10">#</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 cursor-pointer hover:text-gray-800 select-none whitespace-nowrap" onClick={()=>toggleSort("date")}>
                <div className="flex items-center gap-1">Submitted at <SI col="date"/></div>
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 w-20">Status</th>
              {columns.map(col=>(
                <th key={col.id} className="text-left px-4 py-2.5 font-semibold text-gray-500 cursor-pointer hover:text-gray-800 select-none" onClick={()=>toggleSort(col.id)}>
                  <div className="flex items-center gap-1 max-w-[150px] truncate">{col.label} <SI col={col.id}/></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length===0?(
              <tr><td colSpan={3+columns.length} className="text-center py-12 text-gray-400">No responses match your search</td></tr>
            ):filtered.map((r,i)=>(
              <tr key={r.id} className="hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={()=>onRowClick(r)}>
                <td className="px-4 py-3 text-gray-400 font-mono">{i+1}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(r.submittedAt)} <span className="text-gray-400">{fmtTime(r.submittedAt)}</span></td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium",r.isComplete?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500")}>{r.isComplete?"Complete":"Partial"}</span>
                </td>
                {columns.map(col=>{const a=r.answers.find(a=>a.blockId===col.id);return(<td key={col.id} className="px-4 py-3 text-gray-700 max-w-[180px]"><span className="truncate block">{fmtVal(a?.value)}</span></td>);})}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Response Detail ──────────────────────────────────────────────
function ResponseDetail({response,onBack,onDelete}:{response:Resp;onBack:()=>void;onDelete:(id:string)=>void}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"><ArrowLeft className="w-4 h-4"/>Back to responses</button>
        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs gap-1.5" onClick={()=>onDelete(response.id)}><Trash2 className="w-3.5 h-3.5"/>Delete</Button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-blue-500"/></div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{response.user?`${response.user.firstName||""} ${response.user.lastName||""}`.trim()||response.user.email:"Anonymous respondent"}</p>
            <p className="text-xs text-gray-400">{new Date(response.submittedAt).toLocaleString()}</p>
          </div>
          <span className={cn("ml-auto px-2 py-0.5 rounded-full text-xs font-medium",response.isComplete?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500")}>{response.isComplete?"Complete":"Partial"}</span>
        </div>
        <div className="space-y-5">
          {response.answers.sort((a,b)=>a.block.order-b.block.order).map(answer=>(
            <div key={answer.blockId}>
              <p className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{answer.block.label||answer.block.type.replace(/_/g," ").toLowerCase()}</p>
              <div className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">{fmtVal(answer.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Copy Button ──────────────────────────────────────────────────
function CopyBtn({text}:{text:string}) {
  const [copied,setCopied]=useState(false);
  return(
    <button onClick={()=>{navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
      className="p-1 rounded hover:bg-gray-700 transition-colors absolute top-2 right-2">
      {copied?<Check className="w-3.5 h-3.5 text-green-400"/>:<Copy className="w-3.5 h-3.5 text-gray-400"/>}
    </button>
  );
}

// ── Integration Modal ────────────────────────────────────────────
function IntegrationModal({type,onClose}:{type:"sheets"|"notion";onClose:()=>void}) {
  const [step,setStep]=useState(0);
  const isSheets=type==="sheets";

  const sheetsSteps=[
    {
      title:"Create a Google Sheet",icon:"📊",
      content:(
        <div className="space-y-3 text-sm text-gray-600">
          <p>Create a new Google Sheet at <a href="https://sheets.google.com" target="_blank" className="text-blue-600 hover:underline inline-flex items-center gap-1">sheets.google.com <ExternalLink className="w-3 h-3"/></a>.</p>
          <p>In <strong>Row 1</strong>, add headers matching your form field labels:</p>
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400">Submitted At | Full Name | Email | Message | Rating</div>
          <p className="text-xs text-gray-400">Each column = one form field. The order should match your form.</p>
        </div>
      ),
    },
    {
      title:"Create a Google Apps Script",icon:"⚙️",
      content:(
        <div className="space-y-3 text-sm text-gray-600">
          <p>In your Sheet: <strong>Extensions → Apps Script</strong>. Replace all code with this:</p>
          <div className="relative bg-gray-900 rounded-lg p-4 text-xs text-green-400 font-mono">
            <CopyBtn text={`function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  const row = [new Date(data.submittedAt)];
  data.answers.forEach(a => row.push(
    Array.isArray(a.value) ? a.value.join(', ') : (a.value || '')
  ));
  sheet.appendRow(row);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}`}/>
            <pre className="whitespace-pre-wrap overflow-x-auto">{`function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  const row = [new Date(data.submittedAt)];
  data.answers.forEach(a => row.push(
    Array.isArray(a.value) ? a.value.join(', ') : (a.value || '')
  ));
  sheet.appendRow(row);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
          </div>
        </div>
      ),
    },
    {
      title:"Deploy as Web App",icon:"🚀",
      content:(
        <div className="space-y-3 text-sm text-gray-600">
          <p>Click <strong>Deploy → New deployment → Web app</strong>, then set:</p>
          <ul className="space-y-2">
            {["Execute as: Me","Who has access: Anyone","Click Deploy","Authorize when prompted","Copy the Web App URL"].map((s,i)=>(
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</span>{s}
              </li>
            ))}
          </ul>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">💡 Save the Web App URL — you'll need it to send responses to your sheet.</div>
        </div>
      ),
    },
    {
      title:"Send responses to Sheets",icon:"📬",
      content:(
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong>Option A — Manual (right now):</strong> Export your responses as CSV from this page, then import into Google Sheets via <strong>File → Import</strong>.</p>
          <p><strong>Option B — Auto via webhook:</strong> POST to your Web App URL on each submission:</p>
          <div className="relative bg-gray-900 rounded-lg p-4 text-xs text-green-400 font-mono">
            <CopyBtn text={`fetch('<your-web-app-url>', {
  method: 'POST',
  body: JSON.stringify({
    submittedAt: response.submittedAt,
    answers: response.answers
  })
});`}/>
            <pre className="whitespace-pre-wrap">{`fetch('<your-web-app-url>', {
  method: 'POST',
  body: JSON.stringify({
    submittedAt: response.submittedAt,
    answers: response.answers
  })
});`}</pre>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">✅ Native webhook auto-sync is coming to Intake soon!</div>
        </div>
      ),
    },
  ];

  const notionSteps=[
    {
      title:"Create a Notion Integration",icon:"🔌",
      content:(
        <div className="space-y-3 text-sm text-gray-600">
          <p>Go to <a href="https://notion.so/my-integrations" target="_blank" className="text-blue-600 hover:underline inline-flex items-center gap-1">notion.so/my-integrations <ExternalLink className="w-3 h-3"/></a> and click <strong>+ New integration</strong>.</p>
          <ul className="space-y-2">
            {["Name it (e.g. \"Intake Forms\")","Select your workspace","Under Capabilities: enable Read, Update, Insert content","Click Submit","Copy your Internal Integration Secret (starts with ntn_…)"].map((s,i)=>(
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</span>{s}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title:"Set up your Notion database",icon:"📋",
      content:(
        <div className="space-y-3 text-sm text-gray-600">
          <p>Create a new Notion database (full page). Add these property types matching your form fields:</p>
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-100 border-b border-gray-200"><th className="text-left px-3 py-2 font-semibold text-gray-600">Notion type</th><th className="text-left px-3 py-2 font-semibold text-gray-600">Use for</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {[["Title","First / main field"],["Text","Long text answers"],["Email","Email fields"],["Phone","Phone fields"],["Select","Multiple choice / Dropdown"],["Multi-select","Checkboxes"],["Number","Rating / Linear scale / Number"],["Date","Date fields"]].map(([t,u])=>(
                  <tr key={t}><td className="px-3 py-2 font-medium text-gray-700">{t}</td><td className="px-3 py-2 text-gray-500">{u}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Then connect the integration: click <strong>⋯ menu → Connections → your integration name</strong>.</p>
        </div>
      ),
    },
    {
      title:"Get your Database ID",icon:"🔗",
      content:(
        <div className="space-y-3 text-sm text-gray-600">
          <p>Open your database in a browser. The URL looks like:</p>
          <div className="bg-gray-100 rounded-lg px-3 py-2.5 font-mono text-xs text-gray-600 break-all">
            notion.so/<span className="text-gray-400">workspace/</span><span className="bg-yellow-200 px-0.5 rounded">{"<32-char-database-id>"}</span><span className="text-gray-400">?v=…</span>
          </div>
          <p>Copy the 32-character ID between the last <code className="bg-gray-100 px-1 rounded">/</code> and the <code className="bg-gray-100 px-1 rounded">?</code>. You'll need this when calling the API.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">💡 The database must be shared with your integration (step 2) before the API will work.</div>
        </div>
      ),
    },
    {
      title:"Send responses to Notion",icon:"📤",
      content:(
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong>Option A — Manual (right now):</strong> Export responses as CSV, then use <strong>Notion → Import → Merge with CSV</strong>.</p>
          <p><strong>Option B — Notion API:</strong> POST a new page for each response:</p>
          <div className="relative bg-gray-900 rounded-lg p-4 text-xs text-green-400 font-mono">
            <CopyBtn text={`POST https://api.notion.com/v1/pages
Authorization: Bearer <ntn_your_token>
Notion-Version: 2022-06-28

{
  "parent": { "database_id": "<database-id>" },
  "properties": {
    "Name": { "title": [{ "text": { "content": "Jane Smith" }}] },
    "Email": { "email": "jane@example.com" },
    "Rating": { "number": 5 }
  }
}`}/>
            <pre className="whitespace-pre-wrap overflow-x-auto">{`POST https://api.notion.com/v1/pages
Authorization: Bearer <ntn_your_token>
Notion-Version: 2022-06-28

{
  "parent": { "database_id": "<database-id>" },
  "properties": {
    "Name": {
      "title": [{ "text": { "content": "Jane Smith" }}]
    },
    "Email": { "email": "jane@example.com" },
    "Rating": { "number": 5 }
  }
}`}</pre>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">✅ Native Notion auto-sync is coming to Intake soon!</div>
        </div>
      ),
    },
  ];

  const steps=isSheets?sheetsSteps:notionSteps;
  const cur=steps[step];

  return (
    <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2.5">
          {isSheets?<><Sheet className="w-5 h-5 text-green-600"/>Google Sheets Integration</>:<><BookOpen className="w-5 h-5"/>Notion Integration</>}
        </DialogTitle>
        <DialogDescription>Step-by-step guide to connect your form responses to {isSheets?"Google Sheets":"Notion"}.</DialogDescription>
      </DialogHeader>

      {/* Progress */}
      <div className="flex items-center gap-1.5 py-2">
        {steps.map((_,i)=>(
          <div key={i} className="flex items-center gap-1.5 flex-1">
            <button onClick={()=>setStep(i)}
              className={cn("w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all shrink-0 border-2",
                i===step?(isSheets?"border-green-600 bg-green-600 text-white":"border-gray-900 bg-gray-900 text-white")
                  :i<step?(isSheets?"border-green-400 bg-green-50 text-green-600":"border-gray-400 bg-gray-100 text-gray-600")
                  :"border-gray-200 bg-white text-gray-400")}>
              {i<step?"✓":i+1}
            </button>
            {i<steps.length-1&&<div className={cn("flex-1 h-0.5 rounded",i<step?(isSheets?"bg-green-400":"bg-gray-400"):"bg-gray-200")}/>}
          </div>
        ))}
      </div>

      <div className="py-1">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-2xl">{cur.icon}</span>
          <h3 className="font-semibold text-gray-900">{cur.title}</h3>
        </div>
        {cur.content}
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" disabled={step===0} onClick={()=>setStep(s=>s-1)}>← Previous</Button>
        {step<steps.length-1
          ?<Button className={cn("text-white",isSheets?"bg-green-600 hover:bg-green-700":"bg-gray-900 hover:bg-gray-800")} onClick={()=>setStep(s=>s+1)}>Next →</Button>
          :<Button onClick={onClose} className={cn("text-white",isSheets?"bg-green-600 hover:bg-green-700":"bg-gray-900 hover:bg-gray-800")}>All done ✓</Button>}
      </DialogFooter>
    </DialogContent>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function ResponsesPage() {
  const router=useRouter();
  const params=useParams();
  const formId=params?.formId as string;
  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [responses,setResponses]=useState<Resp[]>([]);
  const [allResponses,setAllResponses]=useState<Resp[]>([]);
  const [summary,setSummary]=useState<Summary|null>(null);
  const [view,setView]=useState<"summary"|"table"|"individual">("summary");
  const [selectedResponse,setSelectedResponse]=useState<Resp|null>(null);
  const [formTitle,setFormTitle]=useState("Form");
  const [page,setPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1);
  const [integration,setIntegration]=useState<"sheets"|"notion"|null>(null);
  const [connectedIntegrations,setConnectedIntegrations]=useState<any[]>([]);
  const [connecting,setConnecting]=useState<"sheets"|"notion"|null>(null);
  const [integrationPanelOpen,setIntegrationPanelOpen]=useState(false);

  const columns=useMemo(()=>{
    const map=new Map<string,{id:string;label:string;type:string;order:number}>();
    allResponses.forEach(r=>r.answers.forEach(a=>{if(!map.has(a.blockId))map.set(a.blockId,{id:a.blockId,label:a.block.label,type:a.block.type,order:a.block.order});}));
    return [...map.values()].sort((a,b)=>a.order-b.order);
  },[allResponses]);

  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      if(!data.user){router.replace("/auth");return;}
      setUser(data.user);
      await Promise.all([fetchResponses(data.user.id,1),fetchAll(data.user.id),fetchSummary(data.user.id),fetchTitle(data.user.id),fetchIntegrations(data.user.id)]);
      setLoading(false);
    });
  },[formId]);

  const fetchTitle=async(uid:string)=>{try{const r=await axios.get(`${API}/forms/${formId}`,{headers:{"x-user-id":uid}});setFormTitle(r.data.data.title);}catch{}};
  const fetchResponses=async(uid:string,p:number)=>{try{const r=await axios.get(`${API}/forms/${formId}/responses?page=${p}&limit=20`,{headers:{"x-user-id":uid}});setResponses(r.data.data);setTotalPages(r.data.pagination.totalPages);setPage(p);}catch{toast.error("Failed to load responses");}};
  const fetchAll=async(uid:string)=>{try{const r=await axios.get(`${API}/forms/${formId}/responses?page=1&limit=1000`,{headers:{"x-user-id":uid}});setAllResponses(r.data.data);}catch{}};
  const fetchSummary=async(uid:string)=>{try{const r=await axios.get(`${API}/forms/${formId}/responses/summary`,{headers:{"x-user-id":uid}});setSummary(r.data.data);}catch{}};
  const handleDelete=async(id:string)=>{
    if(!confirm("Delete this response?"))return;
    try{await axios.delete(`${API}/forms/${formId}/responses/${id}`,{headers:{"x-user-id":user.id}});toast.success("Deleted");
      setResponses(p=>p.filter(r=>r.id!==id));setAllResponses(p=>p.filter(r=>r.id!==id));setSelectedResponse(null);fetchSummary(user.id);}
    catch{toast.error("Failed to delete");}
  };
  const handleClearAll=async()=>{
    if(!confirm("Delete ALL responses? This cannot be undone."))return;
    try{await axios.delete(`${API}/forms/${formId}/responses`,{headers:{"x-user-id":user.id}});toast.success("Cleared");setResponses([]);setAllResponses([]);setSummary(null);}
    catch{toast.error("Failed to clear");}
  };
  const handleRefresh=async()=>{await Promise.all([fetchResponses(user.id,page),fetchAll(user.id),fetchSummary(user.id)]);toast.success("Refreshed");};
  const fetchIntegrations=async(uid:string)=>{
    try{const r=await axios.get(`${API}/forms/${formId}/integrations`,{headers:{"x-user-id":uid}});setConnectedIntegrations(r.data.data||[]);}catch{}
  };
  const handleConnect=async(type:"sheets"|"notion")=>{
    setConnecting(type);
    try{
      const endpoint=type==="notion"?"notion":"google";
      const r=await axios.post(`${API}/forms/${formId}/integrations/${endpoint}/connect`,{},{headers:{"x-user-id":user.id}});
      // Open OAuth URL in same window — backend will redirect back
      window.location.href=r.data.url;
    }catch{toast.error("Failed to start OAuth flow");setConnecting(null);}
  };
  const handleDisconnect=async(type:string)=>{
    if(!confirm(`Disconnect ${type==="notion"?"Notion":"Google Sheets"}? Responses will stop syncing.`))return;
    try{await axios.delete(`${API}/forms/${formId}/integrations/${type}`,{headers:{"x-user-id":user.id}});toast.success("Disconnected");fetchIntegrations(user.id);}
    catch{toast.error("Failed to disconnect");}
  };

  if(loading)return<LoadingPage/>;
  const hasData=allResponses.length>0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <AppContent/>
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar/>
          <main className="flex-1 px-7 py-6 max-w-6xl mx-auto w-full">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm">
                <button onClick={()=>router.back()} className="text-gray-400 hover:text-gray-700 transition-colors"><ArrowLeft className="w-4 h-4"/></button>
                <span className="text-gray-400">/</span>
                <button onClick={()=>router.push(`/forms/${formId}/editor`)} className="text-gray-500 hover:text-gray-900 font-medium transition-colors">{formTitle}</button>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-semibold">Responses</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleRefresh}><RefreshCw className="w-3.5 h-3.5"/>Refresh</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50" onClick={()=>router.push(`/forms/${formId}/ai-insights`)}><Brain className="w-3.5 h-3.5"/>AI Insights</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={()=>router.push(`/forms/${formId}/analytics`)}><TrendingUp className="w-3.5 h-3.5"/>Analytics</Button>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5",integrationPanelOpen&&"border-blue-400 text-blue-600")} onClick={()=>setIntegrationPanelOpen(p=>!p)}>
                  <Zap className="w-3.5 h-3.5"/>Integrations
                  {connectedIntegrations.filter(i=>i.status==="active").length>0&&<span className="bg-green-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">{connectedIntegrations.filter(i=>i.status==="active").length}</span>}
                </Button>
                {hasData&&(
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"><Download className="w-3.5 h-3.5"/>Export<ChevronDown className="w-3 h-3"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={()=>downloadCSV(allResponses,columns,formTitle)}><FileText className="w-4 h-4 mr-2 text-green-600"/>Export as CSV</DropdownMenuItem>
                      <DropdownMenuItem onClick={()=>downloadJSON(allResponses,formTitle)}><FileJson className="w-4 h-4 mr-2 text-blue-600"/>Export as JSON</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {hasData&&<Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={handleClearAll}><Trash2 className="w-3.5 h-3.5"/>Clear all</Button>}
              </div>
            </div>

            {/* Integration panel */}
            {integrationPanelOpen&&(
              <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Integrations</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Connect your form responses to external tools. New responses sync automatically.</p>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Notion */}
                  {(()=>{
                    const notion=connectedIntegrations.find(i=>i.type==="notion");
                    const isActive=notion?.status==="active";
                    const isError=notion?.status==="error";
                    return(
                      <div className={cn("border-2 rounded-xl p-5 transition-all",isActive?"border-gray-900 bg-gray-50":isError?"border-red-200 bg-red-50":"border-gray-200 bg-white hover:border-gray-300")}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><BookOpen className="w-5 h-5 text-gray-800"/></div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Notion</p>
                              <p className="text-xs text-gray-400">Sync to a database</p>
                            </div>
                          </div>
                          {isActive&&<span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/>Live</span>}
                          {isError&&<span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3"/>Error</span>}
                        </div>
                        {isActive&&notion?.config?.databaseTitle&&(
                          <div className="mb-3 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-gray-400 shrink-0"/><span className="truncate">{notion.config.databaseTitle}</span></div>
                        )}
                        {isError&&notion?.lastError&&(
                          <div className="mb-3 text-xs text-red-600 bg-white border border-red-200 rounded-lg px-3 py-2">{notion.lastError}</div>
                        )}
                        {notion?.lastSyncAt&&<p className="text-[11px] text-gray-400 mb-3">Last sync: {new Date(notion.lastSyncAt).toLocaleString()}</p>}
                        {isActive||isError?(
                          <button onClick={()=>handleDisconnect("notion")} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition-colors">
                            <Unlink className="w-3.5 h-3.5"/>Disconnect
                          </button>
                        ):(
                          <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white h-9 text-xs font-medium gap-2" disabled={connecting==="notion"} onClick={()=>handleConnect("notion")}>
                            {connecting==="notion"?<><Loader2 className="w-3.5 h-3.5 animate-spin"/>Connecting…</>:<><BookOpen className="w-3.5 h-3.5"/>Connect Notion</>}
                          </Button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Google Sheets */}
                  {(()=>{
                    const gs=connectedIntegrations.find(i=>i.type==="google_sheets");
                    const isActive=gs?.status==="active";
                    const isError=gs?.status==="error";
                    return(
                      <div className={cn("border-2 rounded-xl p-5 transition-all",isActive?"border-green-600 bg-green-50/50":isError?"border-red-200 bg-red-50":"border-gray-200 bg-white hover:border-gray-300")}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><Sheet className="w-5 h-5 text-green-600"/></div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Google Sheets</p>
                              <p className="text-xs text-gray-400">Sync to a spreadsheet</p>
                            </div>
                          </div>
                          {isActive&&<span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/>Live</span>}
                          {isError&&<span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3"/>Error</span>}
                        </div>
                        {isActive&&gs?.config?.spreadsheetUrl&&(
                          <a href={gs.config.spreadsheetUrl} target="_blank" className="mb-3 flex items-center gap-1.5 text-xs text-green-700 bg-white border border-green-200 rounded-lg px-3 py-2 hover:bg-green-50 transition-colors">
                            <Sheet className="w-3 h-3 shrink-0"/>Open spreadsheet<ExternalLink className="w-3 h-3 ml-auto shrink-0"/>
                          </a>
                        )}
                        {isError&&gs?.lastError&&(
                          <div className="mb-3 text-xs text-red-600 bg-white border border-red-200 rounded-lg px-3 py-2">{gs.lastError}</div>
                        )}
                        {gs?.lastSyncAt&&<p className="text-[11px] text-gray-400 mb-3">Last sync: {new Date(gs.lastSyncAt).toLocaleString()}</p>}
                        {isActive||isError?(
                          <button onClick={()=>handleDisconnect("google_sheets")} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition-colors">
                            <Unlink className="w-3.5 h-3.5"/>Disconnect
                          </button>
                        ):(
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-xs font-medium gap-2" disabled={connecting==="sheets"} onClick={()=>handleConnect("sheets")}>
                            {connecting==="sheets"?<><Loader2 className="w-3.5 h-3.5 animate-spin"/>Connecting…</>:<><Sheet className="w-3.5 h-3.5"/>Connect Google Sheets</>}
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Stats */}
            {summary&&(
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  {label:"Total responses",value:summary.totalResponses,icon:Inbox,color:"text-blue-600",bg:"bg-blue-50"},
                  {label:"Questions tracked",value:summary.blocks.length,icon:FileText,color:"text-violet-600",bg:"bg-violet-50"},
                  {label:"Completion rate",value:`${allResponses.length>0?Math.round(allResponses.filter(r=>r.isComplete).length/allResponses.length*100):0}%`,icon:BarChart2,color:"text-green-600",bg:"bg-green-50"},
                ].map(({label,value,icon:Icon,color,bg})=>(
                  <div key={label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",bg)}><Icon className={cn("w-5 h-5",color)}/></div>
                    <div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-400">{label}</p></div>
                  </div>
                ))}
              </div>
            )}

            {/* View tabs */}
            {hasData&&!selectedResponse&&(
              <div className="flex items-center gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit">
                {([{id:"summary",icon:BarChart2,label:"Summary"},{id:"table",icon:Table2,label:"Table"},{id:"individual",icon:List,label:"Individual"}] as const).map(({id,icon:Icon,label})=>(
                  <button key={id} onClick={()=>{setView(id);setSelectedResponse(null);}}
                    className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all",
                      view===id?"bg-gray-900 text-white shadow-sm":"text-gray-500 hover:text-gray-800")}>
                    <Icon className="w-3.5 h-3.5"/>{label}
                  </button>
                ))}
              </div>
            )}

            {/* Empty */}
            {!hasData&&(
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4"><Inbox className="w-7 h-7 text-gray-400"/></div>
                <h3 className="font-semibold text-gray-900 mb-1">No responses yet</h3>
                <p className="text-sm text-gray-400 mb-5">Responses will appear here once people submit your form.</p>
                <Button variant="outline" size="sm" onClick={()=>router.push(`/forms/${formId}/editor`)}>Back to editor</Button>
              </div>
            )}

            {/* Summary */}
            {view==="summary"&&summary&&summary.blocks.length>0&&(
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary.blocks.map(block=><SummaryCard key={block.blockId} block={block}/>)}
              </div>
            )}

            {/* Table */}
            {view==="table"&&hasData&&!selectedResponse&&(
              <TableView responses={allResponses} columns={columns} onRowClick={r=>{setSelectedResponse(r);setView("individual");}}/>
            )}

            {/* Individual list */}
            {view==="individual"&&!selectedResponse&&(
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {responses.map((r,i)=>{
                  const name=r.user?`${r.user.firstName||""} ${r.user.lastName||""}`.trim()||r.user.email:"Anonymous";
                  return(
                    <div key={r.id} onClick={()=>setSelectedResponse(r)}
                      className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors group">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-gray-500">{(page-1)*20+i+1}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{name}</p><p className="text-xs text-gray-400">{r.answers.length} fields answered</p></div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap"><Clock className="w-3 h-3"/>{fmtDate(r.submittedAt)} · {fmtTime(r.submittedAt)}</div>
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",r.isComplete?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500")}>{r.isComplete?"Complete":"Partial"}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors"/>
                    </div>
                  );
                })}
                {totalPages>1&&(
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page===1} onClick={()=>fetchResponses(user.id,page-1)}>← Prev</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page===totalPages} onClick={()=>fetchResponses(user.id,page+1)}>Next →</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Single response */}
            {selectedResponse&&(
              <ResponseDetail response={selectedResponse} onBack={()=>{setSelectedResponse(null);setView("individual");}} onDelete={handleDelete}/>
            )}
          </main>
        </div>
      </div>

    </SidebarProvider>
  );
}