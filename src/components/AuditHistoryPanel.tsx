import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  ArrowRight, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  Download, 
  FileText, 
  ExternalLink, 
  Filter, 
  Check, 
  RotateCcw,
  Eye,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  X,
  Package,
  Globe
} from 'lucide-react';
import { AuditResult, COUNTRY_TRADE_CONFIGS, BOMItem } from '../types';

interface AuditHistoryPanelProps {
  history: AuditResult[];
  onSelectAudit: (audit: AuditResult) => void;
  onDeleteAudit: (auditId: string) => void;
  onClearHistory: () => void;
  onSwitchToAuditor: () => void;
}

const getCountryMeta = (code: string) => {
  const cfg = COUNTRY_TRADE_CONFIGS.find(c => c.code === code);
  switch (code) {
    case 'RW': return { flag: '🇷🇼', name: 'Rwanda', regime: 'EAC', threshold: cfg?.dvaThreshold || 35 };
    case 'UG': return { flag: '🇺🇬', name: 'Uganda', regime: 'EAC', threshold: cfg?.dvaThreshold || 35 };
    case 'NG': return { flag: '🇳🇬', name: 'Nigeria', regime: 'AfCFTA', threshold: cfg?.dvaThreshold || 40 };
    case 'GH': return { flag: '🇬🇭', name: 'Ghana', regime: 'AfCFTA', threshold: cfg?.dvaThreshold || 30 };
    case 'ZM': return { flag: '🇿🇲', name: 'Zambia', regime: 'COMESA', threshold: cfg?.dvaThreshold || 35 };
    case 'TZ': return { flag: '🇹🇿', name: 'Tanzania', regime: 'EAC', threshold: cfg?.dvaThreshold || 35 };
    default: return { flag: '🌍', name: code, regime: 'AfCFTA', threshold: 35 };
  }
};

export const AuditHistoryPanel: React.FC<AuditHistoryPanelProps> = ({
  history,
  onSelectAudit,
  onDeleteAudit,
  onClearHistory,
  onSwitchToAuditor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Compliant' | 'Borderline' | 'Non-Compliant'>('All');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'dva-desc' | 'dva-asc' | 'fob-desc'>('date-desc');
  
  // Selected IDs for side-by-side comparison (max 2)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Quick view single audit inspection modal
  const [inspectAudit, setInspectAudit] = useState<AuditResult | null>(null);

  // Filter and sort the history list
  const filteredHistory = useMemo(() => {
    return history.filter(audit => {
      const matchesSearch = 
        audit.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (audit.targetHsCode && audit.targetHsCode.includes(searchQuery)) ||
        (audit.rulesApplied && audit.rulesApplied.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || audit.status === statusFilter;
      const matchesCountry = countryFilter === 'All' || audit.targetCountry === countryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'date-asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === 'dva-desc') return b.domesticValuePercentage - a.domesticValuePercentage;
      if (sortBy === 'dva-asc') return a.domesticValuePercentage - b.domesticValuePercentage;
      if (sortBy === 'fob-desc') return b.fobPriceKsh - a.fobPriceKsh;
      return 0;
    });
  }, [history, searchQuery, statusFilter, countryFilter, sortBy]);

  // Statistics
  const compliantCount = history.filter(a => a.status === 'Compliant').length;
  const borderlineCount = history.filter(a => a.status === 'Borderline').length;
  const nonCompliantCount = history.filter(a => a.status === 'Non-Compliant').length;

  // Toggle selection for comparison
  const handleToggleCompare = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        if (prev.length >= 2) {
          // Replace second item or keep max 2
          return [prev[0], id];
        }
        return [...prev, id];
      }
    });
  };

  // Compare objects
  const compareAudits = useMemo(() => {
    if (selectedForCompare.length !== 2) return null;
    const auditA = history.find(a => a.id === selectedForCompare[0]);
    const auditB = history.find(a => a.id === selectedForCompare[1]);
    if (!auditA || !auditB) return null;
    return { auditA, auditB };
  }, [history, selectedForCompare]);

  // Export JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `afcfta_compliance_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Local Storage Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-lg shadow-xs">
              <History className="h-6 w-6 stroke-1.75" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xxs font-mono uppercase font-bold tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                  Client-Side Audit Storage
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {history.length} {history.length === 1 ? 'dossier' : 'dossiers'} archived
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display mt-0.5">
                Compliance Audit History & Comparative Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Revisit past export assessments, trace formulation changes across production batches, and compare value addition metrics side-by-side.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportJson}
              disabled={history.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Download all archived reports as JSON"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all archived audit records? This cannot be undone.")) {
                  onClearHistory();
                  setSelectedForCompare([]);
                }
              }}
              disabled={history.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              <span>Clear History</span>
            </button>
            <button
              onClick={onSwitchToAuditor}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>+ New Audit</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Audits</span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">{history.length}</span>
            <span className="text-xxs text-slate-500">Stored in browser cache</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 block">Compliant (Eligible)</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xl font-bold font-mono text-emerald-900">{compliantCount}</span>
            </div>
            <span className="text-xxs text-emerald-700">Meets origin rules</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 block">Borderline</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xl font-bold font-mono text-amber-900">{borderlineCount}</span>
            </div>
            <span className="text-xxs text-amber-700">Near statutory margin</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-800 block">Non-Compliant</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span className="text-xl font-bold font-mono text-rose-900">{nonCompliantCount}</span>
            </div>
            <span className="text-xxs text-rose-700">High imported content</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Trigger Banner (Sticky when items selected) */}
      {selectedForCompare.length > 0 && (
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-16 z-30 transition-all animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-lg font-bold">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Comparative Assessment Tool
              </div>
              <p className="text-sm font-medium text-slate-200">
                {selectedForCompare.length === 1 ? (
                  <span><strong>1 of 2</strong> reports selected. Select another audit below to compare.</span>
                ) : (
                  <span><strong>2 reports selected!</strong> Ready for side-by-side compliance diffing.</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setIsComparing(true)}
              disabled={selectedForCompare.length !== 2}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                selectedForCompare.length === 2
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Scale className="h-4 w-4" />
              <span>Launch Side-by-Side Comparison</span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, HS code, audit ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Statuses</option>
              <option value="Compliant">Compliant Only</option>
              <option value="Borderline">Borderline Only</option>
              <option value="Non-Compliant">Non-Compliant Only</option>
            </select>
          </div>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Destinations</option>
            {COUNTRY_TRADE_CONFIGS.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.regime})</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="dva-desc">Highest DVA %</option>
              <option value="dva-asc">Lowest DVA %</option>
              <option value="fob-desc">Highest FOB Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Records List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching audit reports found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'All' || countryFilter !== 'All'
              ? 'Try resetting your search query or status filter to see other historical reports.'
              : 'Execute an audit in the Rules of Origin Ledger to generate and automatically persist your first compliance report.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {(searchQuery || statusFilter !== 'All' || countryFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setCountryFilter('All');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={onSwitchToAuditor}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
            >
              Go to Auditor
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((audit) => {
            const country = getCountryMeta(audit.targetCountry);
            const isSelected = selectedForCompare.includes(audit.id);
            const isCompliant = audit.status === 'Compliant';
            const isBorderline = audit.status === 'Borderline';
            const dateStr = new Date(audit.timestamp).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={audit.id}
                className={`bg-white rounded-xl border transition-all p-4 sm:p-5 shadow-xs relative ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCompare(audit.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Select for side-by-side comparison"
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          isCompliant ? 'bg-emerald-100 text-emerald-800' :
                          isBorderline ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {audit.status}
                        </span>

                        <span className="text-xs text-slate-500 font-mono">
                          {country.flag} {country.name} ({country.regime})
                        </span>

                        <span className="text-xxs text-slate-400 font-mono">
                          • {dateStr}
                        </span>

                        <span className="text-xxs text-slate-400 font-mono hidden sm:inline">
                          • Ref: {audit.id}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                        {audit.productName}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                        {audit.targetHsCode && (
                          <span className="font-mono text-slate-500">
                            HS: <strong className="text-slate-800">{audit.targetHsCode}</strong>
                          </span>
                        )}
                        <span>
                          FOB: <strong className="font-mono text-slate-800">KSh {audit.fobPriceKsh.toLocaleString()}</strong>
                        </span>
                        <span>
                          NOM Cost: <strong className="font-mono text-slate-800">KSh {audit.nonOriginatingCostKsh.toLocaleString()}</strong> ({audit.nonOriginatingPercentage?.toFixed(1) || Math.round((audit.nonOriginatingCostKsh / audit.fobPriceKsh) * 100)}%)
                        </span>
                        <span>
                          BOM Items: <strong className="font-mono text-slate-800">{audit.items?.length || 0}</strong>
                        </span>
                        <span>
                          Tariff Shift: <strong className={audit.substantialTransformationCheck ? 'text-emerald-700' : 'text-rose-700'}>
                            {audit.substantialTransformationCheck ? 'Verified (CTC)' : 'Unmet'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: DVA Metric Badge */}
                  <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-6 justify-between lg:justify-end">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Domestic Value Added
                      </span>
                      <div className="flex items-baseline gap-1.5 lg:justify-end">
                        <span className={`text-2xl font-bold font-mono ${
                          isCompliant ? 'text-emerald-700' : isBorderline ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {audit.domesticValuePercentage.toFixed(1)}%
                        </span>
                        <span className="text-xxs text-slate-400 font-mono">
                          (Req: ≥{country.threshold}%)
                        </span>
                      </div>
                      <span className="text-xxs text-slate-500 font-mono block">
                        KSh {audit.domesticValueAddedKsh.toLocaleString()}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setInspectAudit(audit)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Quick View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onSelectAudit(audit)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        title="Load into formal certificate & bill of materials editor"
                      >
                        <span>Revisit</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete audit record for "${audit.productName}"?`)) {
                            onDeleteAudit(audit.id);
                            setSelectedForCompare(prev => prev.filter(i => i !== audit.id));
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete from history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK VIEW SINGLE AUDIT MODAL */}
      {inspectAudit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in relative">
            <button
              onClick={() => setInspectAudit(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                  inspectAudit.status === 'Compliant' ? 'bg-emerald-100 text-emerald-800' :
                  inspectAudit.status === 'Borderline' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {inspectAudit.status} Status
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: {inspectAudit.id}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display mt-1">
                {inspectAudit.productName}
              </h3>
              <p className="text-xs text-slate-500">
                Audited: {new Date(inspectAudit.timestamp).toLocaleString()} • Target: {getCountryMeta(inspectAudit.targetCountry).flag} {getCountryMeta(inspectAudit.targetCountry).name}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">FOB Selling Price</span>
                <span className="font-bold font-mono text-slate-900 text-sm">KSh {inspectAudit.fobPriceKsh.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Domestic Value (DVA)</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">
                  {inspectAudit.domesticValuePercentage.toFixed(1)}% (KSh {inspectAudit.domesticValueAddedKsh.toLocaleString()})
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Non-Originating (NOM)</span>
                <span className="font-bold font-mono text-slate-800 text-sm">
                  {inspectAudit.nonOriginatingPercentage?.toFixed(1) || Math.round((inspectAudit.nonOriginatingCostKsh / inspectAudit.fobPriceKsh) * 100)}% (KSh {inspectAudit.nonOriginatingCostKsh.toLocaleString()})
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Tariff Transformation</span>
                <span className="font-bold text-slate-800 text-sm">
                  {inspectAudit.substantialTransformationCheck ? '✓ Shift Verified' : '✖ Failed CTC'}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Compliance Assessment</span>
              <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {inspectAudit.complianceSummary}
              </p>
            </div>

            {/* BOM Ingredients */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Bill of Materials Ledger ({inspectAudit.items?.length || 0} items)
              </span>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Material Description</th>
                      <th className="p-2.5">HS Code</th>
                      <th className="p-2.5">Origin</th>
                      <th className="p-2.5 text-right">Cost (KSh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inspectAudit.items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-800">{it.description}</td>
                        <td className="p-2.5 font-mono text-slate-600">{it.hsCode}</td>
                        <td className="p-2.5">
                          <span className={it.isOriginating ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                            {it.originCountry} {it.isOriginating ? '(Originating)' : '(Non-originating)'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium text-slate-800">
                          KSh {it.valueKsh.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk factors */}
            {inspectAudit.riskFactors && inspectAudit.riskFactors.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">Audit Risk Observations</span>
                <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 space-y-1">
                  {inspectAudit.riskFactors.map((r, i) => (
                    <div key={i} className="text-xs text-amber-950 flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                onClick={() => setInspectAudit(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const audit = inspectAudit;
                  setInspectAudit(null);
                  onSelectAudit(audit);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Load into Live Auditor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE COMPARISON MODAL */}
      {isComparing && compareAudits && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xxs font-mono uppercase font-bold tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                    Comparative Rules of Origin Matrix
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Direct Formulation & Compliance Diff
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display mt-1">
                  Side-by-Side Audit Comparison
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analyze domestic value additions, input material substitutions, and customs risk variances between versions.
                </p>
              </div>

              <button
                onClick={() => setIsComparing(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Close Comparison"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Side-by-Side Top Comparison Headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Audit A Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    Audit Baseline (A)
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    compareAudits.auditA.status === 'Compliant' ? 'bg-emerald-100 text-emerald-800' :
                    compareAudits.auditA.status === 'Borderline' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {compareAudits.auditA.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {compareAudits.auditA.productName}
                </h3>
                
                <div className="text-xs text-slate-500 space-y-0.5 font-mono">
                  <div>Ref: <strong>{compareAudits.auditA.id}</strong></div>
                  <div>Dest: <strong>{getCountryMeta(compareAudits.auditA.targetCountry).flag} {getCountryMeta(compareAudits.auditA.targetCountry).name}</strong></div>
                  <div>Date: {new Date(compareAudits.auditA.timestamp).toLocaleDateString()}</div>
                </div>

                <button
                  onClick={() => {
                    setIsComparing(false);
                    onSelectAudit(compareAudits.auditA);
                  }}
                  className="w-full mt-2 py-2 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Load Version A into Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Audit B Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    Comparison Target (B)
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    compareAudits.auditB.status === 'Compliant' ? 'bg-emerald-100 text-emerald-800' :
                    compareAudits.auditB.status === 'Borderline' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {compareAudits.auditB.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {compareAudits.auditB.productName}
                </h3>
                
                <div className="text-xs text-slate-500 space-y-0.5 font-mono">
                  <div>Ref: <strong>{compareAudits.auditB.id}</strong></div>
                  <div>Dest: <strong>{getCountryMeta(compareAudits.auditB.targetCountry).flag} {getCountryMeta(compareAudits.auditB.targetCountry).name}</strong></div>
                  <div>Date: {new Date(compareAudits.auditB.timestamp).toLocaleDateString()}</div>
                </div>

                <button
                  onClick={() => {
                    setIsComparing(false);
                    onSelectAudit(compareAudits.auditB);
                  }}
                  className="w-full mt-2 py-2 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Load Version B into Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>

            {/* Metrics Comparison Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>Statutory Value Addition & Cost Metrics Diff</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Statutory Compliance Metric</th>
                      <th className="p-3">Audit A</th>
                      <th className="p-3">Audit B</th>
                      <th className="p-3 text-right">Delta / Variance (B vs A)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Domestic Value Percentage */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">
                        Domestic Value Added (DVA %)
                        <span className="block text-xxs font-normal text-slate-500">Statutory calculation: (FOB - NOM) / FOB</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {compareAudits.auditA.domesticValuePercentage.toFixed(1)}%
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {compareAudits.auditB.domesticValuePercentage.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        {(() => {
                          const diff = compareAudits.auditB.domesticValuePercentage - compareAudits.auditA.domesticValuePercentage;
                          return (
                            <span className={diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-700' : 'text-slate-500'}>
                              {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                              {diff > 0 && ' (Improved)'}
                              {diff < 0 && ' (Decreased)'}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* Domestic Value KSh */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">Domestic Value Added (KSh)</td>
                      <td className="p-3 font-mono text-slate-800">KSh {compareAudits.auditA.domesticValueAddedKsh.toLocaleString()}</td>
                      <td className="p-3 font-mono text-slate-800">KSh {compareAudits.auditB.domesticValueAddedKsh.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {(() => {
                          const diff = compareAudits.auditB.domesticValueAddedKsh - compareAudits.auditA.domesticValueAddedKsh;
                          return (
                            <span className={diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-700' : 'text-slate-500'}>
                              {diff > 0 ? `+KSh ${diff.toLocaleString()}` : `KSh ${diff.toLocaleString()}`}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* Non-Originating Cost (NOM) */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">Non-Originating Material (NOM) Cost</td>
                      <td className="p-3 font-mono text-slate-800">KSh {compareAudits.auditA.nonOriginatingCostKsh.toLocaleString()}</td>
                      <td className="p-3 font-mono text-slate-800">KSh {compareAudits.auditB.nonOriginatingCostKsh.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {(() => {
                          const diff = compareAudits.auditB.nonOriginatingCostKsh - compareAudits.auditA.nonOriginatingCostKsh;
                          // Lower NOM is better (green)
                          return (
                            <span className={diff < 0 ? 'text-emerald-700' : diff > 0 ? 'text-rose-700' : 'text-slate-500'}>
                              {diff > 0 ? `+KSh ${diff.toLocaleString()}` : `KSh ${diff.toLocaleString()}`}
                              {diff < 0 && ' (Reduced foreign cost)'}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* Non-Originating % of FOB */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">NOM % of Selling Price</td>
                      <td className="p-3 font-mono text-slate-800">
                        {compareAudits.auditA.nonOriginatingPercentage?.toFixed(1) || Math.round((compareAudits.auditA.nonOriginatingCostKsh / compareAudits.auditA.fobPriceKsh) * 100)}%
                      </td>
                      <td className="p-3 font-mono text-slate-800">
                        {compareAudits.auditB.nonOriginatingPercentage?.toFixed(1) || Math.round((compareAudits.auditB.nonOriginatingCostKsh / compareAudits.auditB.fobPriceKsh) * 100)}%
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {(() => {
                          const nomA = compareAudits.auditA.nonOriginatingPercentage || ((compareAudits.auditA.nonOriginatingCostKsh / compareAudits.auditA.fobPriceKsh) * 100);
                          const nomB = compareAudits.auditB.nonOriginatingPercentage || ((compareAudits.auditB.nonOriginatingCostKsh / compareAudits.auditB.fobPriceKsh) * 100);
                          const diff = nomB - nomA;
                          return (
                            <span className={diff < 0 ? 'text-emerald-700' : diff > 0 ? 'text-rose-700' : 'text-slate-500'}>
                              {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* Unit FOB Price */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">Declared Unit FOB Price</td>
                      <td className="p-3 font-mono text-slate-800">KSh {compareAudits.auditA.fobPriceKsh.toLocaleString()}</td>
                      <td className="p-3 font-mono text-slate-800">KSh {compareAudits.auditB.fobPriceKsh.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {compareAudits.auditB.fobPriceKsh === compareAudits.auditA.fobPriceKsh
                          ? 'Identical'
                          : `KSh ${(compareAudits.auditB.fobPriceKsh - compareAudits.auditA.fobPriceKsh).toLocaleString()}`}
                      </td>
                    </tr>

                    {/* Tariff Shift Check */}
                    <tr className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">Substantial Transformation (CTC)</td>
                      <td className="p-3">
                        <span className={compareAudits.auditA.substantialTransformationCheck ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                          {compareAudits.auditA.substantialTransformationCheck ? '✓ Verified' : '✖ Unmet'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={compareAudits.auditB.substantialTransformationCheck ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                          {compareAudits.auditB.substantialTransformationCheck ? '✓ Verified' : '✖ Unmet'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {compareAudits.auditA.substantialTransformationCheck === compareAudits.auditB.substantialTransformationCheck ? (
                          <span className="text-slate-500">Same rule status</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">Shift rule status changed</span>
                        )}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill of Materials Comparison Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-600" />
                <span>Ingredients & Bill of Materials Sourcing Breakdown</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Audit A BOM */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-2.5 font-bold text-xs text-slate-700 border-b border-slate-200 flex justify-between">
                    <span>Audit A Ingredients ({compareAudits.auditA.items?.length || 0})</span>
                    <span className="font-mono text-slate-500">Total: KSh {compareAudits.auditA.totalMaterialCostKsh.toLocaleString()}</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {compareAudits.auditA.items?.map((it, i) => (
                      <div key={i} className="p-2.5 text-xs flex items-center justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-900">{it.description}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            HS {it.hsCode} • {it.originCountry} • {it.isOriginating ? 'Originating' : 'Foreign / Non-originating'}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-800 whitespace-nowrap">
                          KSh {it.valueKsh.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit B BOM */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-2.5 font-bold text-xs text-slate-700 border-b border-slate-200 flex justify-between">
                    <span>Audit B Ingredients ({compareAudits.auditB.items?.length || 0})</span>
                    <span className="font-mono text-slate-500">Total: KSh {compareAudits.auditB.totalMaterialCostKsh.toLocaleString()}</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {compareAudits.auditB.items?.map((it, i) => (
                      <div key={i} className="p-2.5 text-xs flex items-center justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-900">{it.description}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            HS {it.hsCode} • {it.originCountry} • {it.isOriginating ? 'Originating' : 'Foreign / Non-originating'}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-800 whitespace-nowrap">
                          KSh {it.valueKsh.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Risk Factor Diff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Audit A Regulatory Risks
                </span>
                {compareAudits.auditA.riskFactors?.length ? (
                  <ul className="text-xs text-slate-700 space-y-1">
                    {compareAudits.auditA.riskFactors.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No critical risks flagged.</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Audit B Regulatory Risks
                </span>
                {compareAudits.auditB.riskFactors?.length ? (
                  <ul className="text-xs text-slate-700 space-y-1">
                    {compareAudits.auditB.riskFactors.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">No critical risks flagged.</p>
                )}
              </div>
            </div>

            {/* Close footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setIsComparing(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
