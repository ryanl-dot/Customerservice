import { useState } from 'react';
import { FileText, Copy, CheckCheck, Search } from 'lucide-react';
import { templates } from '../data/sampleData';

const CATEGORIES = ['All', 'Billing', 'Roof Leak', 'Truck Roll', 'Technical', 'Production', 'Internal', 'Complaint', 'Cancellation'];

export default function TemplateLibrary() {
  const [selected, setSelected] = useState(templates[0]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [copied, setCopied] = useState(false);

  const filtered = templates.filter(t => {
    if (category !== 'All' && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function copyTemplate() {
    navigator.clipboard.writeText(`Subject: ${selected.subject}\n\n${selected.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Template Library</h1>
        <p className="text-xs text-slate-400 mt-0.5">{templates.length} reusable customer service templates</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[500px]">
        {/* Left panel */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors ${selected.id === t.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-start gap-2">
                  <FileText size={12} className={`mt-0.5 flex-shrink-0 ${selected.id === t.id ? 'text-blue-500' : 'text-slate-400'}`} />
                  <div>
                    <div className={`text-xs font-medium ${selected.id === t.id ? 'text-blue-700' : 'text-slate-700'}`}>{t.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t.category}</div>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No templates found.</p>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">{selected.name}</h2>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">{selected.category}</span>
            </div>
            <button
              onClick={copyTemplate}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {copied ? <><CheckCheck size={12} />Copied!</> : <><Copy size={12} />Copy Template</>}
            </button>
          </div>

          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mr-2">Subject:</span>
            <span className="text-xs text-slate-700">{selected.subject}</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
          </div>

          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
            <p className="text-[10px] text-slate-400">Replace <span className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">[bracketed]</span> fields with customer-specific info before sending.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
