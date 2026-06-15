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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Template Library</h1>
        <p className="text-slate-500 text-sm">{templates.length} reusable customer service templates</p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left panel */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selected.id === t.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
              >
                <div className="flex items-start gap-2">
                  <FileText size={14} className={selected.id === t.id ? 'text-blue-500 mt-0.5' : 'text-slate-400 mt-0.5'} />
                  <div>
                    <div className={`text-sm font-medium ${selected.id === t.id ? 'text-blue-700' : 'text-slate-700'}`}>{t.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t.category}</div>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No templates found.</p>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Template header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-800">{selected.name}</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">{selected.category}</span>
            </div>
            <button
              onClick={copyTemplate}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {copied ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy Template</>}
            </button>
          </div>

          {/* Subject */}
          <div className="px-6 py-3 border-b border-slate-50 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 mr-2">SUBJECT:</span>
            <span className="text-sm text-slate-700">{selected.subject}</span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
          </div>

          {/* Hint */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">Replace all <span className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">[bracketed]</span> fields with customer-specific information before sending.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
