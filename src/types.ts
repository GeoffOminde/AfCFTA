export interface BOMItem {
  id: string;
  description: string;
  hsCode: string;
  originCountry: string;
  isOriginating: boolean; // True if it's Kenyan or from a trade-facilitated African source under Rules of Origin
  valueKsh: number;
  weightKg?: number;
  supplierName?: string;
  isPackaging?: boolean;
  notes?: string;
  confidence?: number; // Mapped via AI (0 to 1)
  hsClassificationJustification?: string;
}

export interface AuditResult {
  id: string;
  productName: string;
  fobPriceKsh: number;
  targetCountry: string; // The importing country
  items: BOMItem[];
  totalMaterialCostKsh: number;
  nonOriginatingCostKsh: number; // Value of Non-Originating Materials (NOM)
  domesticValueAddedKsh: number; // FOB - NOM
  domesticValuePercentage: number; // (DVA / FOB) * 100
  nonOriginatingPercentage: number; // (NOM / FOB) * 100
  isCompliant: boolean;
  status: 'Compliant' | 'Borderline' | 'Non-Compliant';
  rulesApplied: string;
  substantialTransformationCheck: boolean; // Tariff shift check (e.g. CTC at 4-digit level)
  complianceSummary: string;
  riskFactors: string[];
  tariffHeadingDetails?: string;
  recommendedDocuments?: string[];
  targetHsCode?: string;
  timestamp: string;
}

export interface CountryTradeConfig {
  code: string;
  name: string;
  regime: 'AfCFTA' | 'EAC' | 'COMESA';
  dvaThreshold: number; // e.g. 30 for 30%, 35 for 35%, 40 for 40%
  nomThreshold: number; // e.g. 60 for 60%, 70 for 70%
  rulesOfOriginNotes: string;
}

export const COUNTRY_TRADE_CONFIGS: CountryTradeConfig[] = [
  {
    code: 'RW',
    name: 'Rwanda',
    regime: 'EAC',
    dvaThreshold: 35,
    nomThreshold: 60,
    rulesOfOriginNotes: 'EAC Common External Tariff applies. Standard 35% local value-added or change in tariff heading status strictly verified. Packaging rules require originating materials for primary container.'
  },
  {
    code: 'UG',
    name: 'Uganda',
    regime: 'EAC',
    dvaThreshold: 35,
    nomThreshold: 60,
    rulesOfOriginNotes: 'Under EAC Treaty, goods require 35% DVA or change in 4-digit HS heading for preferential treatment. Agricultural raw inputs must be wholly obtained within the EAC partner states.'
  },
  {
    code: 'NG',
    name: 'Nigeria',
    regime: 'AfCFTA',
    dvaThreshold: 40,
    nomThreshold: 60,
    rulesOfOriginNotes: 'AfCFTA Rules of Origin Annex 2 applies. Strict value limits: non-originating ingredients cannot exceed 60% of FOB price. Substantial transformation/processing in Kenya must be clearly documented with industrial recipes.'
  },
  {
    code: 'GH',
    name: 'Ghana',
    regime: 'AfCFTA',
    dvaThreshold: 30,
    nomThreshold: 60,
    rulesOfOriginNotes: 'Part of the AfCFTA Guided Trade Initiative. Requires 30% DVA for general industrial foods. Agricultural inputs must show Change of Tariff Classification (CTC) at Heading (4-digit) split level.'
  },
  {
    code: 'ZM',
    name: 'Zambia',
    regime: 'COMESA',
    dvaThreshold: 35,
    nomThreshold: 60,
    rulesOfOriginNotes: 'COMESA simplified trade regime or AfCFTA rules apply. Non-originating material limit of 60% or value-addition minimum state-gate of 35% FOB. Certifications of origin are scrutinised closely.'
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    regime: 'EAC',
    dvaThreshold: 35,
    nomThreshold: 60,
    rulesOfOriginNotes: 'Member of EAC, standard rules of tariff transformations apply where processing must result in a shift from importing HS heading. Wholly obtained status required for primary crop inputs.'
  }
];

export interface SearchGroundingSource {
  title: string;
  uri: string;
}

export interface SearchGroundingResult {
  query: string;
  text: string;
  sources: SearchGroundingSource[];
  searchQueries?: string[];
  timestamp: string;
  isAiGrounded: boolean;
}

export interface MapsGroundingPlace {
  title: string;
  uri: string;
  snippets?: string[];
  address?: string;
}

export interface MapsGroundingResult {
  query: string;
  corridor?: string;
  text: string;
  places: MapsGroundingPlace[];
  timestamp: string;
  isAiGrounded: boolean;
}
