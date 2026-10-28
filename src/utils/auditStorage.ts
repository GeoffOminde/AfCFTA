/**
 * Local Storage persistence and history management for AfCFTA Rules of Origin Audits
 */
import { AuditResult } from '../types';

const STORAGE_KEY = 'afcfta_audit_history_v1';

// Seed mock historical audits so users can immediately test revisit & comparison functionality
export const INITIAL_SEED_AUDITS: AuditResult[] = [
  {
    id: 'AUD-KE-2024-001-OPTIMIZED',
    productName: 'Laikipia Red Hot Chilli Sauce (Formulation v2 - COMESA Glass)',
    fobPriceKsh: 380,
    targetCountry: 'NG',
    targetHsCode: '2103.90',
    timestamp: '2025-01-18T10:30:00.000Z',
    status: 'Compliant',
    isCompliant: true,
    totalMaterialCostKsh: 250,
    nonOriginatingCostKsh: 105,
    domesticValueAddedKsh: 275,
    domesticValuePercentage: 72.4,
    nonOriginatingPercentage: 27.6,
    rulesApplied: 'AfCFTA Annex 2 on Rules of Origin - Value of Non-Originating Materials (VNOM) Maximum 60% & Chapter 21 Specific Processing Rule',
    substantialTransformationCheck: true,
    complianceSummary: 'FORMULATION FULLY ELIGIBLE: Domestic value added of 72.4% exceeds the required 40.0% threshold for export to Nigeria. The replacement of Chinese bottles with COMESA/Egyptian originating glass and sourcing local Central Kenya habaneros ensures tariff classification shift from Chapter 09/22 to 2103.90.',
    riskFactors: [
      'Preservative additive (Sodium Benzoate) imported from non-member state (China) - acceptable under de minimis ceiling.',
      'Maintain Certificate of Origin from Egyptian supplier for glass bottles (HS 7010.90) in customs dossier.'
    ],
    recommendedDocuments: [
      'AfCFTA Certificate of Origin Form 1',
      'Kenya Bureau of Standards (KEBS) Standardization Mark',
      'Supplier Origin Declaration for Egyptian Glass Bottles',
      'KRA Customs Export Entry (Form C17B)'
    ],
    tariffHeadingDetails: 'Finished product classified under HS 2103.90 (Sauces and preparations therefor). Raw materials shifted from Chapter 9 (spices) and Chapter 22 (vinegar). Meets Change in Tariff Heading (CTH) criteria.',
    items: [
      { id: 'h1', description: 'Raw red habanero chillis (Laikipia farm)', hsCode: '0904.22', originCountry: 'Kenya', isOriginating: true, valueKsh: 65, isPackaging: false, confidence: 0.98, hsClassificationJustification: 'Wholly obtained in Central Kenya highlands.' },
      { id: 'h2', description: 'Organic ginger extract (Meru agricultural coop)', hsCode: '0910.11', originCountry: 'Kenya', isOriginating: true, valueKsh: 25, isPackaging: false, confidence: 0.95, hsClassificationJustification: 'Local agricultural input.' },
      { id: 'h3', description: 'Distilled White Vinegar (Sourced from Spain)', hsCode: '2209.00', originCountry: 'Spain', isOriginating: false, valueKsh: 85, isPackaging: false, confidence: 0.92, hsClassificationJustification: 'Imported processing agent.' },
      { id: 'h4', description: 'Sodium Benzoate (Imported preservative chemical)', hsCode: '2916.31', originCountry: 'China', isOriginating: false, valueKsh: 20, isPackaging: false, confidence: 0.88, hsClassificationJustification: 'Preservative chemical.' },
      { id: 'h5', description: 'Primary Glass Bottles (Imported from Cairo, Egypt)', hsCode: '7010.90', originCountry: 'Egypt', isOriginating: true, valueKsh: 45, isPackaging: true, confidence: 0.94, hsClassificationJustification: 'COMESA/AfCFTA qualifying packaging.' },
      { id: 'h6', description: 'Waterproof synthetic printed label stickers', hsCode: '4821.10', originCountry: 'Kenya', isOriginating: true, valueKsh: 10, isPackaging: true, confidence: 0.90, hsClassificationJustification: 'Manufactured by Nairobi packaging printer.' }
    ]
  },
  {
    id: 'AUD-KE-2024-002-BASELINE',
    productName: 'Laikipia Red Hot Chilli Sauce (Formulation v1 - Imported Packaging Baseline)',
    fobPriceKsh: 380,
    targetCountry: 'NG',
    targetHsCode: '2103.90',
    timestamp: '2024-11-12T14:15:00.000Z',
    status: 'Non-Compliant',
    isCompliant: false,
    totalMaterialCostKsh: 330,
    nonOriginatingCostKsh: 245,
    domesticValueAddedKsh: 135,
    domesticValuePercentage: 35.5,
    nonOriginatingPercentage: 64.5,
    rulesApplied: 'AfCFTA Annex 2 on Rules of Origin - Value of Non-Originating Materials (VNOM) Rule',
    substantialTransformationCheck: true,
    complianceSummary: 'REJECTED FOR PREFERENTIAL TARIFF: Non-originating materials (NOM) constitute 64.5% of FOB selling price, exceeding the statutory 60.0% maximum allowable ceiling for Nigeria. Domestic Value Added of 35.5% is below the required 40.0% statutory threshold.',
    riskFactors: [
      'CRITICAL: Non-originating packaging (Chinese glass bottles KSh 140) pushed total imported content past the 60% threshold.',
      'Imported vinegar from Spain represents 22.4% of total unit cost.',
      'High risk of cargo detention or full CET tariff penalty (35% duty) at Nigerian ports.'
    ],
    recommendedDocuments: [
      'Standard Non-Preferential Commercial Invoice',
      'KEBS Export Quality Permit'
    ],
    tariffHeadingDetails: 'Substantial transformation achieved from Chapter 9 to 2103.90, but failed the secondary Value-Added percentage test.',
    items: [
      { id: 'b1', description: 'Raw red habanero chillis (Laikipia farm)', hsCode: '0904.22', originCountry: 'Kenya', isOriginating: true, valueKsh: 65, isPackaging: false, confidence: 0.98, hsClassificationJustification: 'Wholly obtained in Kenya.' },
      { id: 'b2', description: 'Organic ginger extract (Meru agricultural coop)', hsCode: '0910.11', originCountry: 'Kenya', isOriginating: true, valueKsh: 20, isPackaging: false, confidence: 0.95, hsClassificationJustification: 'Local agricultural input.' },
      { id: 'b3', description: 'Distilled White Vinegar (Sourced from Spain)', hsCode: '2209.00', originCountry: 'Spain', isOriginating: false, valueKsh: 85, isPackaging: false, confidence: 0.92, hsClassificationJustification: 'Imported vinegar.' },
      { id: 'b4', description: 'Sodium Benzoate (Imported preservative chemical)', hsCode: '2916.31', originCountry: 'China', isOriginating: false, valueKsh: 20, isPackaging: false, confidence: 0.88, hsClassificationJustification: 'Preservative chemical.' },
      { id: 'b5', description: 'Primary Glass Bottles (Imported from Guangzhou, China)', hsCode: '7010.90', originCountry: 'China', isOriginating: false, valueKsh: 140, isPackaging: true, confidence: 0.94, hsClassificationJustification: 'Non-originating imported packaging.' }
    ]
  },
  {
    id: 'AUD-KE-2024-003-TEA-GHANA',
    productName: 'Kericho Spiced CTC Black Tea (Export Tin)',
    fobPriceKsh: 550,
    targetCountry: 'GH',
    targetHsCode: '0902.30',
    timestamp: '2025-01-05T09:45:00.000Z',
    status: 'Compliant',
    isCompliant: true,
    totalMaterialCostKsh: 410,
    nonOriginatingCostKsh: 210,
    domesticValueAddedKsh: 340,
    domesticValuePercentage: 61.8,
    nonOriginatingPercentage: 38.2,
    rulesApplied: 'AfCFTA Guided Trade Initiative (GTI) Protocol - Agricultural Rules of Origin',
    substantialTransformationCheck: true,
    complianceSummary: 'PREFERENTIAL TARIFF APPROVED: High domestic value addition (61.8%) complies with the AfCFTA Guided Trade Initiative criteria for Ghana (minimum 30% required). Primary tea content is wholly grown and harvested within the Kericho highlands.',
    riskFactors: [
      'Metal decorative packaging tins imported from China (KSh 210) must be declared under Article 16 (Packaging Materials).',
      'Ensure Phytosanitary Certificate issued by KEPHIS is attached to the AfCFTA Certificate of Origin.'
    ],
    recommendedDocuments: [
      'AfCFTA Certificate of Origin (Green Form)',
      'KEPHIS Plant Health Phytosanitary Certificate',
      'Tea Board of Kenya Export Permit',
      'Ghana Customs Integrated Trade Services (ICUMS) Pre-Arrival Declaration'
    ],
    tariffHeadingDetails: 'Wholly obtained primary input (HS 0902.30) blended with Zanzibar spices under regional origin cumulative rules.',
    items: [
      { id: 't1', description: 'Premium Black Tea leaves wholly obtained', hsCode: '0902.30', originCountry: 'Kenya', isOriginating: true, valueKsh: 160, isPackaging: false, confidence: 0.98, hsClassificationJustification: 'Grown in Kericho.' },
      { id: 't2', description: 'Whole Cardamom pods / Clove blend pieces', hsCode: '0908.31', originCountry: 'Zanzibar', isOriginating: true, valueKsh: 40, isPackaging: false, confidence: 0.91, hsClassificationJustification: 'EAC/AfCFTA originating spice.' },
      { id: 't3', description: 'Embossed aluminum food-grade storage cans', hsCode: '7310.21', originCountry: 'China', isOriginating: false, valueKsh: 210, isPackaging: true, confidence: 0.93, hsClassificationJustification: 'Non-originating container.' }
    ]
  }
];

export function getStoredAuditHistory(): AuditResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial realistic records so the user immediately has historical data to review & compare
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_AUDITS));
      return INITIAL_SEED_AUDITS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SEED_AUDITS;
  } catch (err) {
    console.error('Failed to read audit history from localStorage:', err);
    return INITIAL_SEED_AUDITS;
  }
}

export function saveAuditToHistory(newAudit: AuditResult): AuditResult[] {
  try {
    const current = getStoredAuditHistory();
    // Check if audit with same ID already exists
    const existingIndex = current.findIndex(a => a.id === newAudit.id);
    let updated: AuditResult[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = newAudit;
    } else {
      updated = [newAudit, ...current];
    }
    // Cap at 50 to avoid local storage quota issues
    const capped = updated.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    return capped;
  } catch (err) {
    console.error('Failed to save audit to history:', err);
    return [newAudit];
  }
}

export function deleteAuditFromHistory(id: string): AuditResult[] {
  try {
    const current = getStoredAuditHistory();
    const filtered = current.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete audit from history:', err);
    return [];
  }
}

export function clearAuditHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear audit history:', err);
  }
}

export function exportAuditHistoryJson(audits: AuditResult[]): string {
  return JSON.stringify(audits, null, 2);
}
