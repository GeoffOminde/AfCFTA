import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Info
} from 'lucide-react';
import { SearchGroundingResult } from '../types';

interface SearchIntelPanelProps {
  defaultProductName?: string;
  defaultCountry?: string;
  defaultHsCode?: string;
  onApplyContextToAudit?: (product: string, hsCode: string, country: string) => void;
}

const PRESET_QUERIES = [
  {
    label: "AfCFTA Guided Trade Initiative (GTI) Tariff Status",
    query: "AfCFTA Guided Trade Initiative preferential tariff rates Kenya export processed foods"
  },
  {
    label: "Nigeria NAFDAC & Import Requirements for Sauces/Foods",
    query: "Nigeria NAFDAC food import regulations and AfCFTA preferential tariff documentation for Kenyan goods"
  },
  {
    label: "Ghana FDA & Customs Rules of Origin Clearance",
    query: "Ghana FDA food registration and AfCFTA Rules of Origin Certificate of Origin requirements"
  },
  {
    label: "EAC Common External Tariff (CET) Rules of Origin",
    query: "East African Community EAC Common External Tariff 2024 Rules of Origin domestic value addition"
  },
  {
    label: "KRA Export Single Window & KEPHIS Inspection",
    query: "Kenya Revenue Authority KRA TradeNet single window export declaration KEPHIS phytosanitary requirements"
  }
];

export const SearchIntelPanel: React.FC<SearchIntelPanelProps> = ({
  defaultProductName = "Laikipia Red Hot Chilli Sauce",
  defaultCountry = "NG",
  defaultHsCode = "2103.90",
  onApplyContextToAudit
}) => {
  const [query, setQuery] = useState<string>(
    `AfCFTA rules of origin preferential tariff rate HS ${defaultHsCode} exporting ${defaultProductName} from Kenya to ${defaultCountry}`
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SearchGroundingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Synchronize when parent defaults change if user hasn't modified
  useEffect(() => {
    if (!result) {
      setQuery(`AfCFTA rules of origin preferential tariff rate HS ${defaultHsCode} exporting ${defaultProductName} from Kenya to ${defaultCountry}`);
    }
  }, [defaultProductName, defaultCountry, defaultHsCode]);

  const handleSearch = async (searchPrompt?: string) => {
    const q = searchPrompt || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search-tariff-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          productName: defaultProductName,
          targetCountry: defaultCountry,
          hsCode: defaultHsCode
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data: SearchGroundingResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Search Grounding failed:", err);
      setError(err.message || "Failed to retrieve real-time tariff intelligence.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial query on mount if empty
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xxs font-mono uppercase font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                Google Search Grounding Engine
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full border border-slate-200">
                Model: gemini-3.8-flash (googleSearch)
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-display mt-1">
              Live AfCFTA & Regional Tariff Regulatory Intelligence
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Query live trade bulletins, KRA customs notices, destination country FDA/NAFDAC guidelines, and verified AfCFTA tariff phase-downs grounded with real-time web sources.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            <span className="text-xxs font-mono text-slate-600 font-semibold uppercase">Live Web Access</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. AfCFTA rules of origin tariff rate for avocado exports to Nigeria or Egypt..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 text-xs active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Searching Live Web...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Search Regulations</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> Popular Inquiries:
          </span>
          {PRESET_QUERIES.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(item.query);
                handleSearch(item.query);
              }}
              className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/80 transition-all font-medium whitespace-nowrap active:scale-95 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-900 text-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Unable to complete search query</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Intelligence text (Left 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block">
                  Grounding Output Summary
                </span>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Trade Advisory & Tariff Schedule Report
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-xxs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Grounded
                </span>
              </div>
            </div>

            {/* Markdown Body */}
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-3 text-xs sm:text-sm">
              <div className="whitespace-pre-line bg-slate-50/70 border border-slate-200/60 rounded-xl p-5 font-sans leading-relaxed">
                {result.text}
              </div>
            </div>

            {/* Queries executed by Google Search */}
            {result.searchQueries && result.searchQueries.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-150">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2 font-bold">
                  Google Search Terms Executed:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.searchQueries.map((sq, i) => (
                    <span key={i} className="text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md font-mono">
                      "{sq}"
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sources and Web Citations Sidebar (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Grounding Web Sources Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-display">
                  <Globe className="h-4 w-4 text-blue-600" /> Grounded Citations ({result.sources.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Real-time Web</span>
              </div>

              {result.sources.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No direct external citation links returned for this query.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {result.sources.map((src, idx) => {
                    let domain = "";
                    try {
                      domain = new URL(src.uri).hostname.replace("www.", "");
                    } catch {
                      domain = "official-trade-portal";
                    }

                    return (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-800 group-hover:text-blue-700 line-clamp-2 leading-snug">
                            {src.title || src.uri}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-slate-400 group-hover:text-blue-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>{domain}</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick action card: Apply search insights to Audit */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-display">
                  Audit Integration
                </h4>
              </div>
              <p className="text-xxs leading-relaxed text-slate-300">
                Verified your tariff rates and substantial transformation criteria? Head back to the Bill of Materials ledger to compute your exact Domestic Value Added (DVA) score.
              </p>
              {onApplyContextToAudit && (
                <button
                  onClick={() => onApplyContextToAudit(defaultProductName, defaultHsCode, defaultCountry)}
                  className="mt-3.5 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <span>Go to Rules of Origin Ledger</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
