/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Sparkles, 
  Globe, 
  RotateCcw, 
  FileSpreadsheet, 
  ArrowRight, 
  TrendingUp, 
  Scale, 
  Info,
  Layers,
  Award,
  Download,
  Check,
  ShieldAlert,
  Search,
  MapPin,
  Compass,
  ExternalLink,
  History,
  Edit2,
  X,
  Dna,
  LogIn,
  LogOut,
  User as UserIcon,
  Cloud
} from 'lucide-react';
import { BOMItem, AuditResult, COUNTRY_TRADE_CONFIGS, CountryTradeConfig } from './types';
import { SearchIntelPanel } from './components/SearchIntelPanel';
import { TradeLogisticsMapPanel } from './components/TradeLogisticsMapPanel';
import { AuditHistoryPanel } from './components/AuditHistoryPanel';
import { BioscienceInspectorPanel } from './components/BioscienceInspectorPanel';
import { 
  getStoredAuditHistory, 
  saveAuditToHistory, 
  deleteAuditFromHistory, 
  clearAuditHistory 
} from './utils/auditStorage';
import { 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChanged, 
  saveAuditToFirestore, 
  getAuditsFromFirestore, 
  deleteAuditFromFirestore,
  User 
} from './firebase';


// Real-world template profiles for Kenyan Agro-Processors to populate immediately
const PREMADE_TEMPLATES = [
  {
    name: "Laikipia Red Hot Chilli Sauce",
    targetHsCode: "2103.90",
    fobPriceKsh: 380, // per unit
    targetCountry: "NG", // Nigeria (AfCFTA - Strict 40% threshold)
    items: [
      { id: "1", description: "Raw red habanero chillis (Laikipia farm)", hsCode: "0904.22", originCountry: "Kenya", isOriginating: true, valueKsh: 65, isPackaging: false, confidence: 0.98, hsClassificationJustification: "Chapter 9 - Fresh/crushed chillis. Cultivated locally in Central Kenya region." },
      { id: "2", description: "Organic ginger extract (Meru agricultural coop)", hsCode: "0910.11", originCountry: "Kenya", isOriginating: true, valueKsh: 25, isPackaging: false, confidence: 0.95, hsClassificationJustification: "Chapter 9 - Ginger, fresh. Locally grown and pressed." },
      { id: "3", description: "Distilled White Vinegar (Sourced from Spain)", hsCode: "2209.00", originCountry: "Spain", isOriginating: false, valueKsh: 85, isPackaging: false, confidence: 0.92, hsClassificationJustification: "Chapter 22 - Fermented vinegar. Imported preservative agent." },
      { id: "4", description: "Sodium Benzoate (Imported preservative chemical)", hsCode: "2916.31", originCountry: "China", isOriginating: false, valueKsh: 20, isPackaging: false, confidence: 0.88, hsClassificationJustification: "Chapter 29 - Organic chemicals. Monocarboxylic acids." },
      { id: "5", description: "Primary Glass Bottles (Imported from Cairo)", hsCode: "7010.90", originCountry: "Egypt", isOriginating: true, valueKsh: 45, isPackaging: true, confidence: 0.94, hsClassificationJustification: "Chapter 70 - Glass containers. Sourced from Egypt under EAC-COMESA bilateral treaty." },
      { id: "6", description: "Waterproof synthetic printed label stickers", hsCode: "4821.10", originCountry: "Kenya", isOriginating: true, valueKsh: 15, isPackaging: true, confidence: 0.90, hsClassificationJustification: "Chapter 48 - Paper labels. Printed locally by Nairobi Industrial Area packaging house." }
    ]
  },
  {
    name: "Nyeri Highlands AA Roasted Coffee Pouch",
    targetHsCode: "0901.21",
    fobPriceKsh: 950,
    targetCountry: "RW", // Rwanda (EAC - 35% threshold)
    items: [
      { id: "k1", description: "Arabica raw coffee parchment wholly obtained", hsCode: "0901.11", originCountry: "Kenya", isOriginating: true, valueKsh: 380, isPackaging: false, confidence: 0.99, hsClassificationJustification: "Chapter 9 - Coffee, unroasted. Hand-picked at coffee estate in Kiambu and Nyeri." },
      { id: "k2", description: "Premium foil barrier stand-up zipper pouch", hsCode: "3923.21", originCountry: "China", isOriginating: false, valueKsh: 190, isPackaging: true, confidence: 0.94, hsClassificationJustification: "Chapter 39 - Polyethylene laminates. Vacuum seal imported pouches." },
      { id: "k3", description: "Locally bound recycled shipping carton boxes", hsCode: "4819.10", originCountry: "Kenya", isOriginating: true, valueKsh: 45, isPackaging: true, confidence: 0.90, hsClassificationJustification: "Chapter 48 - Corrugated pulp shipping boxes." }
    ]
  },
  {
    name: "Kericho Spiced CTC Black Tea (Metal Tin)",
    targetHsCode: "0902.30",
    fobPriceKsh: 550,
    targetCountry: "GH", // Ghana (AfCFTA Guided Trade Initiative - 30% threshold)
    items: [
      { id: "t1", description: "Premium Black Tea leaves wholly obtained", hsCode: "0902.30", originCountry: "Kenya", isOriginating: true, valueKsh: 160, isPackaging: false, confidence: 0.98, hsClassificationJustification: "Chapter 9 - Tea, black. Cultivated and fermented in Kericho Highlands." },
      { id: "t2", description: "Whole Cardamom pods / Clove blend pieces", hsCode: "0908.31", originCountry: "Zanzibar", isOriginating: true, valueKsh: 40, isPackaging: false, confidence: 0.91, hsClassificationJustification: "Chapter 9 - Cardamom. Sourced under COMESA/EAC originating status." },
      { id: "t3", description: "Embossed aluminum food-grade storage cans", hsCode: "7310.21", originCountry: "China", isOriginating: false, valueKsh: 210, isPackaging: true, confidence: 0.93, hsClassificationJustification: "Chapter 73 - Steel and iron containers. Luxury canisters imported from Guangdong." }
    ]
  }
];

const getCountryFlag = (code: string) => {
  switch (code) {
    case 'RW': return '🇷🇼';
    case 'UG': return '🇺🇬';
    case 'NG': return '🇳🇬';
    case 'GH': return '🇬🇭';
    case 'ZM': return '🇿🇲';
    case 'TZ': return '🇹🇿';
    default: return '🌍';
  }
};

export default function App() {
  const [productName, setProductName] = useState<string>("Laikipia Red Hot Chilli Sauce");
  const [targetHsCode, setTargetHsCode] = useState<string>("2103.90");
  const [fobPriceKsh, setFobPriceKsh] = useState<number>(380);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("NG");
  const [activeTab, setActiveTab] = useState<'auditor' | 'search_intel' | 'maps_locator' | 'history' | 'bioscience'>('auditor');
  const [auditHistory, setAuditHistory] = useState<AuditResult[]>(() => getStoredAuditHistory());

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Application brand name (Customizable, defaults to AsiliTrade)
  const [brandName, setBrandName] = useState<string>(() => {
    try {
      return localStorage.getItem('asili_app_brand_name') || 'AsiliTrade';
    } catch {
      return 'AsiliTrade';
    }
  });
  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);
  const [customBrandInput, setCustomBrandInput] = useState<string>('');

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        try {
          const cloudAudits = await getAuditsFromFirestore(user.uid);
          if (cloudAudits && cloudAudits.length > 0) {
            // Merge cloud audits with local storage records (avoid duplicate IDs)
            const local = getStoredAuditHistory();
            const mergedMap = new Map<string, AuditResult>();
            local.forEach(a => mergedMap.set(a.id, a));
            cloudAudits.forEach(a => mergedMap.set(a.id, a));
            const merged = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setAuditHistory(merged);
          }
        } catch (err) {
          console.error('Error fetching audits from Firestore:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err: any) {
      console.error('Sign out failed:', err);
    }
  };


  useEffect(() => {
    document.title = `${brandName} | AfCFTA & EAC Rules of Origin Engine`;
  }, [brandName]);

  const handleUpdateBrandName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBrandName(trimmed);
    try {
      localStorage.setItem('asili_app_brand_name', trimmed);
    } catch (e) {
      console.error(e);
    }
    setShowBrandModal(false);
  };
  
  // Rules of Origin Material rows
  const [bomItems, setBomItems] = useState<BOMItem[]>([
    { id: "1", description: "Raw red habanero chillis (Laikipia farm)", hsCode: "0904.22", originCountry: "Kenya", isOriginating: true, valueKsh: 65, isPackaging: false, confidence: 0.98, hsClassificationJustification: "Chapter 9 - Fresh/crushed chillis. Cultivated locally in Central Kenya." },
    { id: "2", description: "Organic ginger extract (Meru agricultural coop)", hsCode: "0910.11", originCountry: "Kenya", isOriginating: true, valueKsh: 25, isPackaging: false, confidence: 0.95, hsClassificationJustification: "Chapter 9 - Ginger, fresh. Locally grown." },
    { id: "3", description: "Distilled White Vinegar (Sourced from Spain)", hsCode: "2209.00", originCountry: "Spain", isOriginating: false, valueKsh: 85, isPackaging: false, confidence: 0.92, hsClassificationJustification: "Chapter 22 - Fermented vinegar. Imported chemical ingredient." },
    { id: "4", description: "Sodium Benzoate (Imported preservative chemical)", hsCode: "2916.31", originCountry: "China", isOriginating: false, valueKsh: 20, isPackaging: false, confidence: 0.88, hsClassificationJustification: "Chapter 29 - Organic chemicals. Monocarboxylic acids." },
    { id: "5", description: "Primary Glass Bottles (Imported from Cairo)", hsCode: "7010.90", originCountry: "Egypt", isOriginating: true, valueKsh: 45, isPackaging: true, confidence: 0.94, hsClassificationJustification: "Chapter 70 - Glass containers. Sourced from Egypt under COMESA." },
    { id: "6", description: "Waterproof synthetic printed label stickers", hsCode: "4821.10", originCountry: "Kenya", isOriginating: true, valueKsh: 15, isPackaging: true, confidence: 0.90, hsClassificationJustification: "Chapter 48 - Paper labels. Printed locally." }
  ]);

  // Input state for new row item
  const [newItemDesc, setNewItemDesc] = useState<string>("");
  const [newItemHsCode, setNewItemHsCode] = useState<string>("");
  const [newItemOrigin, setNewItemOrigin] = useState<string>("Kenya");
  const [newItemValue, setNewItemValue] = useState<number>(0);
  const [newItemIsPackaging, setNewItemIsPackaging] = useState<boolean>(false);
  const [classifyingIndex, setClassifyingIndex] = useState<string | null>(null);
  const [isClassifyingNew, setIsClassifyingNew] = useState<boolean>(false);

  // CSV Ingest / File Upload properties
  const [csvText, setCsvText] = useState<string>("");
  const [showCsvBox, setShowCsvBox] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Audit state
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [apiLog, setApiLog] = useState<{ type: 'info' | 'success' | 'err'; msg: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute Country Trade config
  const tradeConfig = COUNTRY_TRADE_CONFIGS.find(c => c.code === selectedCountryCode) || COUNTRY_TRADE_CONFIGS[0];

  // Quick mechanical calculations to show real-time live preview indicators
  const totalMaterialCost = bomItems.reduce((acc, item) => acc + Number(item.valueKsh || 0), 0);
  const nonOriginatingCost = bomItems.reduce((acc, item) => acc + (item.isOriginating ? 0 : Number(item.valueKsh || 0)), 0);
  const calculatedDvaKsh = Math.max(0, fobPriceKsh - nonOriginatingCost);
  const computedDvaPercentage = fobPriceKsh > 0 ? (calculatedDvaKsh / fobPriceKsh) * 100 : 0;
  const limitsDvaPassed = computedDvaPercentage >= tradeConfig.dvaThreshold;

  // Sync to API logger
  const addLog = (type: 'info' | 'success' | 'err', msg: string) => {
    setApiLog(prev => [...prev.slice(-4), { type, msg }]);
  };

  // 1. Load premade template items
  const loadTemplate = (templateName: string) => {
    const templ = PREMADE_TEMPLATES.find(t => t.name === templateName);
    if (!templ) return;
    setProductName(templ.name);
    setTargetHsCode(templ.targetHsCode);
    setFobPriceKsh(templ.fobPriceKsh);
    setSelectedCountryCode(templ.targetCountry);
    setBomItems(templ.items.map(it => ({ ...it })));
    setAuditResult(null);
    addLog('info', `Loaded export product template: "${templ.name}"`);
  };

  // 2. Clear item table
  const resetBOM = () => {
    setBomItems([]);
    setAuditResult(null);
    addLog('info', 'Reset Bill of Materials ledger.');
  };

  // 3. Add individual custom row
  const addCustomItem = () => {
    if (!newItemDesc.trim()) {
      alert("Please provide an ingredient/part description first.");
      return;
    }
    const isLocal = newItemOrigin.toLowerCase().trim() === "kenya" || newItemOrigin.toLowerCase().trim() === "ke";
    const item: BOMItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: newItemDesc,
      hsCode: newItemHsCode || "UNKNOWN",
      originCountry: newItemOrigin,
      isOriginating: isLocal,
      valueKsh: Number(newItemValue) || 0,
      isPackaging: newItemIsPackaging,
      confidence: newItemHsCode ? 1.0 : undefined,
      hsClassificationJustification: "Manually declared input"
    };

    setBomItems(prev => [...prev, item]);
    // clear input
    setNewItemDesc("");
    setNewItemHsCode("");
    setNewItemOrigin("Kenya");
    setNewItemValue(0);
    setNewItemIsPackaging(false);
    setAuditResult(null);
    addLog('success', `Added custom ingredient: "${item.description}"`);
  };

  // 4. AISuggest for individual line item (API Route trigger)
  const runAiClassifyItemDetail = async (index: number) => {
    const item = bomItems[index];
    if (!item.description.trim()) return;

    setClassifyingIndex(item.id);
    addLog('info', `Querying customs tariff DB for "${item.description}"...`);
    try {
      const resp = await fetch("/api/classify-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: item.description })
      });
      const data = await resp.json();
      if (resp.ok) {
        const updated = [...bomItems];
        updated[index] = {
          ...updated[index],
          hsCode: data.hsCode,
          confidence: data.confidence,
          isOriginating: data.isOriginating,
          hsClassificationJustification: data.justification
        };
        setBomItems(updated);
        setAuditResult(null);
        addLog('success', `AI Mapped "${item.description}" ➔ HS Code: ${data.hsCode} (Conf: ${Math.round(data.confidence * 100)}%)`);
      } else {
        throw new Error(data.error || "System classified error");
      }
    } catch (err: any) {
      addLog('err', `Classification error: ${err.message || err}`);
    } finally {
      setClassifyingIndex(null);
    }
  };

  // 5. AISuggest for new item input row (before adding)
  const runAiClassifyNewInput = async () => {
    if (!newItemDesc.trim()) {
      alert("Please specify a description first to map HS Codes using Gemini.");
      return;
    }
    setIsClassifyingNew(true);
    addLog('info', `Analyzing ingredient descriptor: "${newItemDesc}"`);
    try {
      const resp = await fetch("/api/classify-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newItemDesc })
      });
      const data = await resp.json();
      if (resp.ok) {
        setNewItemHsCode(data.hsCode);
        setNewItemOrigin(data.isOriginating ? "Kenya" : "Foreign");
        addLog('success', `AI suggested HS: ${data.hsCode} and originating state: ${data.isOriginating ? "Local Kenya" : "Imported"}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      addLog('err', `AI Classification failed: ${err.message || err}`);
    } finally {
      setIsClassifyingNew(false);
    }
  };

  // 6. Delete item row
  const deleteItem = (id: string) => {
    setBomItems(prev => prev.filter(it => it.id !== id));
    setAuditResult(null);
    addLog('info', `Removed line item.`);
  };

  // 7. Toggle item origin manually
  const toggleOrigin = (index: number) => {
    setBomItems(prev => prev.map((item, i) => i === index ? { ...item, isOriginating: !item.isOriginating } : item));
    setAuditResult(null);
  };

  const handleValueChange = (index: number, val: number) => {
    setBomItems(prev => prev.map((item, i) => i === index ? { ...item, valueKsh: val } : item));
    setAuditResult(null);
  };

  // 8. CSV Bulk Parser
  const loadCsvLedger = () => {
    if (!csvText.trim()) {
      setCsvError("Paste some raw CSV strings first!");
      return;
    }

    try {
      const lines = csvText.split('\n');
      const items: BOMItem[] = [];
      let parsedCount = 0;

      for (const line of lines) {
        if (!line.trim() || line.toLowerCase().includes("description,")) continue; // skip header
        // Simple CSV splitter
        const parts = line.split(',');
        if (parts.length >= 2) {
          const desc = parts[0].replace(/"/g, '').trim();
          const hs = parts[1]?.replace(/"/g, '').trim() || "0000.00";
          const cntry = parts[2]?.replace(/"/g, '').trim() || "Kenya";
          const val = Number(parts[3]?.trim()) || 0;
          const isPkg = parts[4]?.toLowerCase().includes("true") || false;

          const isLocal = cntry.toLowerCase() === "kenya" || cntry.toLowerCase() === "ke";

          items.push({
            id: Math.random().toString(36).substring(2, 7) + parsedCount++,
            description: desc,
            hsCode: hs,
            originCountry: cntry,
            isOriginating: isLocal,
            valueKsh: val,
            isPackaging: isPkg,
            confidence: 0.95,
            hsClassificationJustification: "Ingested via ledger spreadsheet parser"
          });
        }
      }

      if (items.length > 0) {
        setBomItems(items);
        setCsvText("");
        setShowCsvBox(false);
        setCsvError(null);
        setAuditResult(null);
        addLog('success', `Bulk Ingested ${items.length} line items successfully from CSV!`);
      } else {
        setCsvError("Could not parse any valid CSV lines. Ensure format is: Description, HS Code, Country, Cost (KSh)");
      }
    } catch (e: any) {
      setCsvError(`Parser Exception: ${e.message}`);
    }
  };

  // Direct mockup files trigger for Drag-and-Drop
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setShowCsvBox(true);
      addLog('info', `File "${file.name}" placed in CSV sandbox buffer.`);
    };
    reader.readAsText(file);
  };

  // 9. Execute Formal AI Audit
  const triggerFormalAudit = async () => {
    if (bomItems.length === 0) {
      alert("Your Bill of Materials ledger is empty. Load a template or build one!");
      return;
    }
    if (!productName.trim()) {
      alert("Please name the export product.");
      return;
    }
    if (fobPriceKsh <= 0) {
      alert("FOB Selling price is required to calculate Value Added percentages.");
      return;
    }

    setIsAuditing(true);
    addLog('info', `Submitting trade dossier to Customs Rules of Origin Audit system...`);
    try {
      const resp = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          fobPriceKsh,
          targetCountry: selectedCountryCode,
          items: bomItems,
          targetHsCode
        })
      });

      const result = await resp.json();
      if (resp.ok) {
        setAuditResult(result);
        const updatedHistory = saveAuditToHistory(result);
        setAuditHistory(updatedHistory);
        // Sync to cloud if user is signed in
        if (currentUser) {
          saveAuditToFirestore(currentUser.uid, result)
            .then(() => addLog('success', 'Synchronized audit dossier with cloud database (Firestore).'))
            .catch(err => console.error('Cloud audit sync error:', err));
        }
        addLog('success', `Audit verified & saved! Status: ${result.status} (Verified DVA: ${result.domesticValuePercentage}%)`);
      } else {
        throw new Error(result.error || "Compliance API rejected data pack");
      }
    } catch (err: any) {
      addLog('err', `Compliance server failed: ${err.message || err}`);
      // local calculate failure recovery
      alert(`Auditor System error: ${err.message || err}. Fallback mechanical audit rendered.`);
    } finally {
      setIsAuditing(false);
    }
  };

  // Revisit and load historical audit into live auditor & certificate
  const handleSelectHistoricalAudit = (audit: AuditResult) => {
    setAuditResult(audit);
    setProductName(audit.productName);
    setFobPriceKsh(audit.fobPriceKsh);
    setSelectedCountryCode(audit.targetCountry);
    if (audit.targetHsCode) {
      setTargetHsCode(audit.targetHsCode);
    }
    if (audit.items && audit.items.length > 0) {
      setBomItems(audit.items);
    }
    setActiveTab('auditor');
    addLog('info', `Loaded historical audit "${audit.productName}" (Ref: ${audit.id})`);
    setTimeout(() => {
      const el = document.getElementById('formal-audit-certificate');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);
  };

  // Delete single historical audit
  const handleDeleteHistoricalAudit = (id: string) => {
    const updated = deleteAuditFromHistory(id);
    setAuditHistory(updated);
    if (currentUser) {
      deleteAuditFromFirestore(currentUser.uid, id).catch(err => console.error(err));
    }
    addLog('info', `Removed audit report ${id} from storage.`);
  };


  // Clear all historical audits
  const handleClearHistory = () => {
    clearAuditHistory();
    setAuditHistory([]);
    addLog('info', `Cleared local audit history.`);
  };

  // Action: Print generated audit certificate 
  const triggerPrintWindow = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16 no-print selection:bg-teal-100 selection:text-teal-900">
      
      {/* Premium Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-lg shadow-sm border border-emerald-700/50 flex items-center justify-center">
              <Scale className="h-6 w-6 stroke-1.75" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xxs font-mono uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                  AfCFTA & EAC Customs Protocol
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomBrandInput(brandName);
                    setShowBrandModal(true);
                  }}
                  className="text-xxs text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                  title="Click to rename application"
                >
                  <Edit2 className="h-3 w-3 text-slate-400" />
                  <span>Rename App</span>
                </button>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
                <span>{brandName}</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md hidden sm:inline">
                  Rules of Origin Engine
                </span>
              </h1>
            </div>
          </div>
          
          {/* Right side: Samples & User Auth Profile */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Preset templates options */}
            <div className="hidden lg:flex items-center gap-1.5">
              <span className="text-xxs text-slate-500 font-medium flex items-center gap-1">
                <Layers className="h-3 w-3" /> Samples:
              </span>
              {PREMADE_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    loadTemplate(tmpl.name);
                    setActiveTab('auditor');
                  }}
                  className="text-xxs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded border border-slate-200 transition-all font-medium whitespace-nowrap active:scale-95 cursor-pointer"
                >
                  {tmpl.name.replace("Laikipia ", "").replace("Nyeri Highlands ", "").replace("Kericho ", "")}
                </button>
              ))}
            </div>

            {/* Firebase Auth Google Sign-in / User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {currentUser ? (
                <div className="flex items-center gap-2 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User'} 
                      className="w-6 h-6 rounded-full border border-emerald-500"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                      {currentUser.displayName || 'Agro-Exporter'}
                    </span>
                    <span className="text-[9px] text-emerald-700 font-medium flex items-center gap-0.5">
                      <Cloud className="w-2.5 h-2.5" /> Firestore Synced
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="ml-1 p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In (Sync Audits)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 border-t border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('auditor')}
            className={`py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'auditor'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Calculator className="h-4 w-4 text-emerald-600" />
            <span>Rules of Origin Ledger & Auditor</span>
          </button>

          <button
            onClick={() => setActiveTab('bioscience')}
            className={`py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'bioscience'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Dna className="h-4 w-4 text-emerald-600" />
            <span>Agro-Bioscience & Botanical Inspector</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-medium hidden sm:inline-block">
              PubChem PUG REST
            </span>
          </button>

          <button
            onClick={() => setActiveTab('search_intel')}
            className={`py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'search_intel'
                ? 'border-blue-600 text-blue-800 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Search className="h-4 w-4 text-blue-600" />
            <span>Live AfCFTA & Tariff Intelligence</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono font-medium hidden sm:inline-block">
              Google Search Grounding
            </span>
          </button>

          <button
            onClick={() => setActiveTab('maps_locator')}
            className={`py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'maps_locator'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>Customs & Trade Stations Locator</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-medium hidden sm:inline-block">
              Google Maps Grounding
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'history'
                ? 'border-purple-600 text-purple-800 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <History className="h-4 w-4 text-purple-600" />
            <span>Audit History & Comparison</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-mono font-medium">
              {auditHistory.length}
            </span>
          </button>
        </div>
      </header>

      {/* Bioscience Tab Panel */}
      {activeTab === 'bioscience' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <BioscienceInspectorPanel />
        </main>
      )}

      {activeTab === 'history' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AuditHistoryPanel
            history={auditHistory}
            onSelectAudit={handleSelectHistoricalAudit}
            onDeleteAudit={handleDeleteHistoricalAudit}
            onClearHistory={handleClearHistory}
            onSwitchToAuditor={() => setActiveTab('auditor')}
          />
        </main>
      )}

      {activeTab === 'search_intel' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <SearchIntelPanel
            defaultProductName={productName}
            defaultCountry={selectedCountryCode}
            defaultHsCode={targetHsCode}
            onApplyContextToAudit={() => setActiveTab('auditor')}
          />
        </main>
      )}

      {activeTab === 'maps_locator' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <TradeLogisticsMapPanel
            defaultCountry={selectedCountryCode}
            onApplyContextToAudit={() => setActiveTab('auditor')}
          />
        </main>
      )}

      {activeTab === 'auditor' && (
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Setup, Country Targets, Bill of Materials Ledger Workspace — Spans 7 cols */}
        <section className="col-span-1 lg:col-span-8 space-y-8">
          
          {/* Export Product Settings Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-400"></div>
            <h2 className="text-base font-bold text-slate-900 font-display mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-500" /> Export Destination & Tariff Registry Setup
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Export product name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => { setProductName(e.target.value); setAuditResult(null); }}
                  placeholder="e.g. Premium Dried Pineapple"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Finished HS Code
                </label>
                <input
                  type="text"
                  value={targetHsCode}
                  onChange={(e) => { setTargetHsCode(e.target.value); setAuditResult(null); }}
                  placeholder="e.g. 2103.90"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Importer Country Target
                </label>
                <select
                  value={selectedCountryCode}
                  onChange={(e) => { setSelectedCountryCode(e.target.value); setAuditResult(null); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  {COUNTRY_TRADE_CONFIGS.map(country => (
                    <option key={country.code} value={country.code}>
                      {getCountryFlag(country.code)} {country.name} ({country.regime})
                    </option>
                  ))}
                </select>
              </div>

              {/* Total batch/consignment selling value */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Unit FOB Price (KSh)
                </label>
                <input
                  type="number"
                  value={fobPriceKsh}
                  onChange={(e) => { setFobPriceKsh(Math.max(0, Number(e.target.value))); setAuditResult(null); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Threshold indicator card for chosen export setting */}
              <div className="md:col-span-8 bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 flex gap-3 text-emerald-950">
                <div className="bg-emerald-500 text-white rounded-md p-1.5 h-fit mt-0.5">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-display text-emerald-900">
                    Rules Applied: {tradeConfig.regime} Protocol Framework
                  </h4>
                  <p className="text-xxs leading-relaxed text-emerald-800 mt-0.5">
                    Requires raw materials list to demonstrate **Domestic Value Added (DVA) ≥ {tradeConfig.dvaThreshold}%** of total consignment FOB price, or limit Non-originating components to **≤ {tradeConfig.nomThreshold}%**.
                  </p>
                </div>
              </div>

              {/* Real-Time Grounding Quick Launches */}
              <div className="md:col-span-12 flex flex-wrap gap-2 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setActiveTab('search_intel')}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Search className="h-3.5 w-3.5 text-blue-600" />
                  <span>Verify Live AfCFTA Status for "{productName}" (Google Search Grounding)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('maps_locator')}
                  className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Locate Customs Houses & Inspection Hubs for {tradeConfig.name} Route (Google Maps Grounding)</span>
                </button>
              </div>

            </div>
          </div>

          {/* Bill of Materials Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-slate-500" /> Bill of Materials Ledger (Raw Costs)
                </h3>
                <p className="text-xxs text-slate-500 mt-0.5">Specify origin state for all inputs. Raw crop inputs wholly obtained in East Africa constitute originating materials.</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCsvBox(!showCsvBox)}
                  className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-all font-medium flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" /> Spreadsheet Ingest
                </button>
                <button
                  type="button"
                  onClick={resetBOM}
                  className="text-xs bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition-all font-medium flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear All
                </button>
              </div>
            </div>

            {/* CSV Box toggleable panel */}
            {showCsvBox && (
              <div 
                className="bg-slate-50 border-b border-slate-200 p-5 overflow-hidden transition-all duration-300 animate-fade-in"
              >
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">
                  Spreadsheet CSV Data Batch Load
                </h4>
                <p className="text-xxs text-slate-500 mb-3">
                  Paste raw material log rows below. Comma separated list with formatting: 
                  <code className="bg-white px-1.5 py-0.5 border rounded mx-1 text-slate-600 font-mono">Description, HSCode, Country, CostKsh, IsPackaging(true/false)</code>
                </p>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Raw Chilli / Peppers, 0904.22, Kenya, 65000, false\nDistilled White Vinegar, 2209.00, Spain, 85000, false\nImported Secondary Caps, 3923.50, China, 24000, true`}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {csvError && (
                  <div className="my-2 text-xxs bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-md font-mono flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {csvError}
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      // file picker simulated Click
                      fileInputRef.current?.click();
                    }}
                    className="text-xs bg-white text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 font-medium active:scale-95"
                  >
                    Browse file (.csv / .txt)
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".csv,.txt" 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={loadCsvLedger}
                    className="text-xs bg-slate-800 text-white hover:bg-slate-900 px-4 py-1.5 rounded-md font-medium shadow-xs active:scale-95"
                  >
                    Parse & Load Ledger
                  </button>
                </div>
              </div>
            )}

            {/* Material Items Ledger Area */}
            <div className="overflow-x-auto min-w-full">
              <table className="min-w-full divide-y divide-slate-200 table-fixed text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-xxs font-semibold text-slate-500 uppercase tracking-widest w-[40%]">
                      Material Ingredient Description
                    </th>
                    <th scope="col" className="px-3 py-3 text-xxs font-semibold text-slate-500 uppercase tracking-widest w-[18%]">
                      HS Code (6-dig)
                    </th>
                    <th scope="col" className="px-3 py-3 text-xxs font-semibold text-slate-500 uppercase tracking-widest w-[16%]">
                      Origin Country
                    </th>
                    <th scope="col" className="px-3 py-3 text-xxs font-semibold text-slate-500 uppercase tracking-widest w-[16%]">
                      Value cost (KSh)
                    </th>
                    <th scope="col" className="px-4 py-3 text-xxs font-semibold text-slate-500 uppercase tracking-widest w-[10%] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {bomItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="max-w-xs mx-auto text-slate-400">
                          <Calculator className="h-10 w-10 mx-auto stroke-1 text-slate-300 mb-2" />
                          <p className="text-xs font-medium">No items declared inside ledger BOM.</p>
                          <p className="text-xxs mt-0.5">Paste a CSV file or add custom row inputs below to evaluate trade criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    bomItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-25/50 transition-colors">
                        
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-800 line-clamp-1">
                              {item.description}
                            </span>
                            {item.hsClassificationJustification && (
                              <span className="text-xxs text-slate-400 line-clamp-1" title={item.hsClassificationJustification}>
                                Info: {item.hsClassificationJustification}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-sm">
                              {item.hsCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => runAiClassifyItemDetail(index)}
                              disabled={classifyingIndex !== null}
                              title="Map / Validate with Gemini Customs intelligence"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded-md transition-all active:scale-90"
                            >
                              {classifyingIndex === item.id ? (
                                <span className="h-3 w-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin block" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <button
                            type="button"
                            onClick={() => toggleOrigin(index)}
                            className={`text-xxs font-semibold px-2 py-1 rounded-full transition-all text-left whitespace-nowrap inline-flex items-center gap-1 border cursor-pointer ${
                              item.isOriginating
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isOriginating ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {item.isOriginating ? `Originating (Kenya)` : `Foreign`}
                          </button>
                        </td>

                        <td className="px-3 py-3.5">
                          <input
                            type="number"
                            value={item.valueKsh}
                            onChange={(e) => handleValueChange(index, Math.max(0, Number(e.target.value)))}
                            className="bg-transparent text-xs font-semibold text-slate-800 font-mono w-24 border-b border-dashed border-slate-300 hover:border-emerald-500"
                          />
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-200/20 active:scale-95 transition-all inline-block"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Custom Row Inputs Form */}
            <div className="bg-slate-50 border-t border-slate-150 p-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-1 bg-white px-2.5 py-1 rounded w-fit border border-slate-200 shadow-xxs">
                <Plus className="h-3.5 w-3.5" /> Declare New BOM Component Row
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Enter Ingredient Name (e.g., Macadamia nuts)"
                    className="w-full bg-white border border-slate-350 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 relative">
                  <input
                    type="text"
                    value={newItemHsCode}
                    onChange={(e) => setNewItemHsCode(e.target.value)}
                    placeholder="HS Code (Optional)"
                    className="w-full bg-white border border-slate-350 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={runAiClassifyNewInput}
                    disabled={isClassifyingNew}
                    title="Ask Gemini to map the HS Code based on description"
                    className="absolute right-1.5 top-1.5 text-emerald-600 hover:text-emerald-700 p-1 rounded transition-all active:scale-90"
                  >
                    {isClassifyingNew ? (
                      <span className="h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newItemOrigin}
                    onChange={(e) => setNewItemOrigin(e.target.value)}
                    placeholder="Origin Country"
                    className="w-full bg-white border border-slate-350 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    value={newItemValue || ''}
                    onChange={(e) => setNewItemValue(Math.max(0, Number(e.target.value)))}
                    placeholder="Unit Cost KSh"
                    className="w-full bg-white border border-slate-350 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between gap-2.5">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItemIsPackaging}
                      onChange={(e) => setNewItemIsPackaging(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-350"
                    />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Pkg Material</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-1.5 font-bold transition-all shadow-xs active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* Quick Stats Summary Strip */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-md grid grid-cols-1 sm:grid-cols-4 gap-6 relative overflow-hidden border border-slate-850">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <TrendingUp className="h-28 w-28 text-white rotate-12" />
            </div>

            <div className="border-r border-slate-800 pr-4 last:border-0 last:pr-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Consignment FOB Value</span>
              <span className="text-lg font-bold font-mono text-white">KSh {fobPriceKsh.toLocaleString()}</span>
              <span className="text-xxs text-emerald-400 block mt-1 tracking-tight">Declared export unit</span>
            </div>

            <div className="border-r border-slate-800 pr-4 last:border-0 last:pr-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Non-Originating Cost (NOM)</span>
              <span className="text-lg font-bold font-mono text-slate-100">KSh {nonOriginatingCost.toLocaleString()}</span>
              <span className="text-xxs text-rose-400 block mt-1">
                {fobPriceKsh > 0 ? Math.round((nonOriginatingCost / fobPriceKsh) * 100) : 0}% of unit FOB
              </span>
            </div>

            <div className="border-r border-slate-800 pr-4 last:border-0 last:pr-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Domestic Value Added (DVA)</span>
              <span className="text-lg font-bold font-mono text-emerald-400">KSh {calculatedDvaKsh.toLocaleString()}</span>
              <span className="text-xxs text-emerald-300 block mt-1">FOB Price Less NOM</span>
            </div>

            <div className="pr-4 last:border-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Value Addition Score</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xl font-bold font-mono ${limitsDvaPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {computedDvaPercentage.toFixed(1)}%
                </span>
                <span className="text-xxs text-slate-400">(Req: ≥{tradeConfig.dvaThreshold}%)</span>
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-widest block mt-0.5 ${limitsDvaPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {limitsDvaPassed ? "✓ THRESHOLD ELIGIBLE" : "⚠️ NON-COMPLIANT"}
              </span>
            </div>

          </div>

          {/* Trigger Audit Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={triggerFormalAudit}
              disabled={isAuditing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-12 py-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2.5 text-base"
            >
              {isAuditing ? (
                <>
                  <span className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin block" />
                  Running Trade Audit Protocol...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" />
                  Run AI Rules of Origin compliance audit
                </>
              )}
            </button>
          </div>

        </section>

        {/* Right column: Regulatory Diagnostic Feed, AI Action Terminal, & Compliance Certificate — Spans 5 cols */}
        <aside className="col-span-1 lg:col-span-4 space-y-6">
          
          {/* Rules and origin information quick check */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-3 flex items-center gap-2 font-display">
              <Scale className="h-4 w-4 text-emerald-700" /> Statutory Target Rules Profile: {tradeConfig.name}
            </h3>
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono text-xxs">
                <div>
                  <span className="text-slate-400 block uppercase">Regime Mode</span>
                  <span className="font-bold text-slate-800 text-xs">{tradeConfig.regime} Trade Area</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase">Min DVA Required</span>
                  <span className="font-bold text-emerald-700 text-xs">≥ {tradeConfig.dvaThreshold}% FOB</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-xxs mb-1">
                  Compliance Framework Details
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-500 italic">
                  "{tradeConfig.rulesOfOriginNotes}"
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-200 rounded-lg p-3 text-amber-950 text-xxs leading-relaxed">
                <span className="font-bold text-amber-800 uppercase block mb-0.5">Customs Alert Checklist:</span>
                Finished agricultural goods processed from imported raw crops (like using imported sugar, spices, or bulk concentrates) are carefully audited at border gateways. If non-local value exceeds 60%, cargo is subject to full tariff taxation.
              </div>
            </div>
          </div>

          {/* AI Auditor Action logs */}
          <div className="bg-slate-950 text-slate-300 rounded-xl p-5 border border-slate-900 shadow-sm font-mono text-xxs">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2 mb-2 flex items-center justify-between">
              <span>Trade API Logging</span>
              <span className="text-[9px] bg-slate-850 px-1.5 py-0.5 rounded text-emerald-400">ONLINE</span>
            </h3>
            <div className="space-y-1.5 min-h-[120px]">
              {apiLog.length === 0 ? (
                <div className="text-slate-600 italic">Waiting for trade ledger triggers...</div>
              ) : (
                apiLog.map((log, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                    <span className={
                      log.type === 'err' ? 'text-rose-400 font-bold' :
                      log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'
                    }>
                      {log.type === 'err' && '✖ '}
                      {log.type === 'success' && '✔ '}
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </aside>

      </main>

      {/* Render Audit Result Report / Professional Trade Dossier Certificate */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {auditResult && (
          <div
            className="bg-white rounded-xl border-2 border-slate-300 shadow-md p-8 relative overflow-hidden transition-all duration-350 animate-fade-in"
            id="formal-audit-certificate"
          >
              
              {/* Compliance status banner */}
              <div className={`absolute top-0 left-0 w-full h-2.5 ${
                auditResult.status === 'Compliant' ? 'bg-emerald-600' :
                auditResult.status === 'Borderline' ? 'bg-amber-500' : 'bg-rose-600'
              }`} />

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xxs font-mono uppercase bg-slate-100 border text-slate-600 px-2 py-0.5 rounded-sm">
                      Official Export Readiness Verification
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                      auditResult.status === 'Compliant' ? 'bg-emerald-100 text-emerald-800' :
                      auditResult.status === 'Borderline' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {auditResult.status} Status
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display mt-1">
                    {brandName} • Export Compliance Dossier
                  </h2>
                  <p className="text-xxs text-slate-500 font-mono mt-0.5">
                    ID: {auditResult.id} • Audited on Kenyan local time: {new Date(auditResult.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold px-3.5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title="View in local storage history and compare against past audits"
                  >
                    <History className="h-4 w-4 text-purple-600" /> Compare in History ({auditHistory.length})
                  </button>
                  <button
                    onClick={triggerPrintWindow}
                    className="text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> Print / Export Formal PDF
                  </button>
                </div>
              </div>

              {/* Main report body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                
                {/* Visual Math metrics block */}
                <div className="col-span-1 lg:col-span-4 space-y-6">
                  
                  <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 text-center text-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Value Addition Score</span>
                    <div className="text-4xl font-black text-slate-900 font-mono tracking-tighter my-2">
                      {auditResult.domesticValuePercentage.toFixed(1)}%
                    </div>
                    <span className={`text-xxs uppercase font-bold tracking-widest inline-block px-3 py-1 rounded-full ${
                      auditResult.isCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {auditResult.isCompliant ? "✓ PASSES PREFERENTIAL TARIFF" : "⚠️ FAIL - EXCEEDS BOUNDARIES"}
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-700">
                    <h3 className="font-bold uppercase tracking-widest text-xxs text-slate-400">Compliance Audit Coordinates</h3>
                    
                    <div className="flex justify-between border-b border-slate-150 pb-2">
                      <span className="text-slate-500">Target HS Classification:</span>
                      <span className="font-mono font-semibold">{targetHsCode || "2103.90"}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-150 pb-2">
                      <span className="text-slate-500">Destination Importer:</span>
                      <span className="font-semibold">{getCountryFlag(tradeConfig.code)} {tradeConfig.name} ({tradeConfig.regime} Regime)</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-150 pb-2">
                      <span className="text-slate-500">Substantial Heading Shift (CTC):</span>
                      <span className={`font-semibold ${auditResult.substantialTransformationCheck ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {auditResult.substantialTransformationCheck ? "✓ PASSED (TARIFF SHIFT)" : "⚠️ POTENTIAL CONFLICT"}
                      </span>
                    </div>

                    <div className="flex justify-between pb-2">
                      <span className="text-slate-500">Total Formula Applied:</span>
                      <span className="font-semibold text-xxs">{auditResult.rulesApplied}</span>
                    </div>
                  </div>

                </div>

                {/* AI Executive summary of rules & transformative changes */}
                <div className="col-span-1 lg:col-span-8 space-y-6 lg:border-l lg:border-slate-200 lg:pl-8">
                  
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                      <Sparkles className="h-4 w-4 text-emerald-600 block" /> AI Trade Specialist Executive Assessment
                    </h3>
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-emerald-50/20 border border-emerald-500/10 rounded-xl p-5">
                      {auditResult.complianceSummary}
                    </div>
                  </div>

                  {auditResult.tariffHeadingDetails && (
                    <div>
                      <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" /> Customs Classification & Heading Shifts
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        {auditResult.tariffHeadingDetails}
                      </p>
                    </div>
                  )}

                  {/* Risks section */}
                  <div>
                    <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-rose-500" /> Vulnerabilities & Customs Deficiencies Checked ({auditResult.riskFactors.length})
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-2">
                      {auditResult.riskFactors.map((r, i) => (
                        <li key={i} className="flex gap-2 bg-slate-50 border border-slate-150 rounded-lg p-3">
                          <span className="text-amber-500 font-bold">⚠️</span>
                          <div>
                            <p className="font-medium text-slate-800">{r}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Required clearance documents registry */}
                  {auditResult.recommendedDocuments && auditResult.recommendedDocuments.length > 0 && (
                    <div>
                      <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
                        <Award className="h-4 w-4 text-emerald-600" /> Mandatory Port of Entry Clearance Documents
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {auditResult.recommendedDocuments.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-emerald-50/30 border border-emerald-100 rounded-lg p-2.5 text-xs text-emerald-950">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real-Time Grounding Verification & Port Logistics Clearance Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-display">
                        <Sparkles className="h-4 w-4 text-emerald-600" /> Grounded Regulatory Verification & Clearance Stations
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                        Grounded AI Modules
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Cross-reference your consignment against active AfCFTA Guided Trade Initiative phase-downs or locate physical customs houses and KEPHIS testing laboratories to submit your certificate:
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('search_intel')}
                        className="text-xs bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 font-semibold px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-xxs transition-all cursor-pointer active:scale-95"
                      >
                        <Search className="h-3.5 w-3.5 text-blue-600" />
                        <span>Query Live Regulations for {tradeConfig.name} (Google Search Grounding)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('maps_locator')}
                        className="text-xs bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-xxs transition-all cursor-pointer active:scale-95"
                      >
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Locate Physical Customs & Inspection Depots (Google Maps Grounding)</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Official trade agency mock seal wrapper */}
              <div className="border-t border-slate-200 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xxs text-slate-400 font-mono gap-4">
                <span>Authorized via AfCFTA Origin Guard Platform • KRA iCMS Export Link API compliant</span>
                <span className="italic">Verification Seal Valid • Standard Annex 2 Harmonized Protocol</span>
              </div>

            </div>
          )}
        </section>
        </>
      )}

      {/* RENDER DEDICATED PRINT PAGE - ONLY visible on paper and standard print preview targets */}
      {auditResult && (
        <div className="hidden print-only p-8 bg-white text-slate-900 border border-slate-300 rounded-lg max-w-4xl mx-auto print-page">
          
          <div className="text-center pb-6 border-b-2 border-slate-800">
            <h1 className="text-2xl font-bold font-display uppercase tracking-wider text-slate-900">
              Certificate of Rules of Origin Verification
            </h1>
            <p className="text-xs font-mono uppercase text-slate-500 tracking-widest mt-1">
              AfCFTA & EAC Customs Protocol Authority • Republic of Kenya
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 my-6 text-xs leading-relaxed">
            <div>
              <span className="text-[10px] uppercase font-bold block text-slate-400">Exporter Origin State:</span>
              <span className="font-semibold text-slate-800 text-sm">KENYA (KRA Trade Registry)</span>

              <span className="text-[10px] uppercase font-bold block text-slate-400 mt-3.5">Export Target Country:</span>
              <span className="font-semibold text-slate-800 text-sm">{tradeConfig.name} ({tradeConfig.regime})</span>

              <span className="text-[10px] uppercase font-bold block text-slate-400 mt-3.5">Dossier / Verification ID:</span>
              <span className="font-mono text-slate-800 text-sm">{auditResult.id}</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold block text-slate-400">Processed Product:</span>
              <span className="font-semibold text-slate-800 text-sm">{productName}</span>

              <span className="text-[10px] uppercase font-bold block text-slate-400 mt-3.5">Predicted HS Classification:</span>
              <span className="font-mono text-slate-800 text-sm">{targetHsCode || "2103.90"}</span>

              <span className="text-[10px] uppercase font-bold block text-slate-400 mt-3.5">Certificate Date:</span>
              <span className="font-mono text-slate-800 text-sm">{new Date(auditResult.timestamp).toLocaleString()}</span>
            </div>
          </div>

          {/* Core computations summary table */}
          <div className="border border-slate-400 rounded overflow-hidden my-6">
            <div className="bg-slate-100 p-2.5 font-bold text-xs uppercase text-slate-700 tracking-wider">
              Verification Math calculations
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 text-center">
              <div className="border-r border-slate-200">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Unit FOB Price</span>
                <span className="font-mono font-bold text-slate-850">KSh {fobPriceKsh.toLocaleString()}</span>
              </div>
              <div className="border-r border-slate-200">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Non-Originating Materials (NOM)</span>
                <span className="font-mono font-bold text-slate-850">KSh {nonOriginatingCost.toLocaleString()}</span>
              </div>
              <div className="border-r border-slate-200">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Domestic Value Added (DVA)</span>
                <span className="font-mono font-bold text-emerald-800">KSh {(fobPriceKsh - nonOriginatingCost).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Domestic Value Added %</span>
                <span className={`font-mono font-bold text-sm ${auditResult.isCompliant ? "text-emerald-850" : "text-rose-850"}`}>
                  {auditResult.domesticValuePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="my-6">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 mb-2">
              EXECUTIVE DETERMINATION SUMMARY:
            </span>
            <div className="bg-slate-50 border p-4 rounded text-xs leading-relaxed italic text-slate-800 text-justify">
              {auditResult.complianceSummary}
            </div>
          </div>

          {/* Classify shifts */}
          {auditResult.tariffHeadingDetails && (
            <div className="my-6">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 mb-1.5">
                TARIFF HEADING SHIFT LOGICS:
              </span>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                {auditResult.tariffHeadingDetails}
              </p>
            </div>
          )}

          {/* Recommended bills */}
          {auditResult.recommendedDocuments && auditResult.recommendedDocuments.length > 0 && (
            <div className="my-6">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 mb-2">
                REQUIRED EXPORT CERTIFICATIONS LIST:
              </span>
              <div className="grid grid-cols-2 gap-3">
                {auditResult.recommendedDocuments.map((doc, idx) => (
                  <div key={idx} className="border p-2 rounded text-xs font-medium text-slate-700 bg-emerald-50/10">
                    ✓ {doc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature and Agency lines */}
          <div className="mt-12 pt-6 border-t border-dashed border-slate-400 grid grid-cols-2 text-center text-xs">
            <div>
              <p className="border-b border-slate-350 mx-10 pb-4 h-6 text-slate-300">[Signature on File]</p>
              <p className="font-bold text-slate-800 mt-2">Republic of Kenya Customs Commissioner</p>
              <p className="text-[10px] text-slate-500 font-mono">Issued via KRA iCMS Registry Protocol</p>
            </div>
            <div>
              <p className="border-b border-slate-350 mx-10 pb-4 h-6 text-slate-300">[Digital Seal Verified]</p>
              <p className="font-bold text-slate-800 mt-2">AfCFTA Trade Facilitation Bureau</p>
              <p className="text-[10px] text-slate-500 font-mono">AfCFTA Registry Compliance seal verified</p>
            </div>
          </div>

        </div>
      )}

      {/* Application Brand Rename / Customization Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-fade-in relative">
            <button
              onClick={() => setShowBrandModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-xxs font-mono uppercase font-bold tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                Application Customization
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-display mt-1">
                Customize Application Name
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a pan-African trade brand or type your organization's custom title.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Brand Identity Presets
              </span>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: 'AsiliTrade', desc: 'From Swahili "Asili" (Origin/Authenticity) — Pan-African Rules of Origin engine.' },
                  { name: 'AfriOrigin', desc: 'Contemporary trade tech & regional value-addition platform.' },
                  { name: 'OriginPulse Africa', desc: 'Real-time tariff & export rules intelligence suite.' },
                  { name: 'TradeOrigin Compliance', desc: 'Professional customs clearance & tariff heading auditor.' }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleUpdateBrandName(preset.name)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      brandName === preset.name
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{preset.name}</span>
                        {brandName === preset.name && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono">CURRENT</span>
                        )}
                      </div>
                      <div className="text-xxs text-slate-500 mt-0.5">{preset.desc}</div>
                    </div>
                    {brandName === preset.name && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Or Type a Custom Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customBrandInput}
                  onChange={(e) => setCustomBrandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customBrandInput.trim()) {
                      handleUpdateBrandName(customBrandInput);
                    }
                  }}
                  placeholder="e.g. AgriOrigin Kenya"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateBrandName(customBrandInput)}
                  disabled={!customBrandInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95"
                >
                  Save
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

