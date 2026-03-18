// ============================================
// TYPES & INTERFACES
// ============================================

export interface Scene {
  id: number;
  header: string;
  content: string;
  isAnalyzed: boolean;
  analysis?: SceneBreakdown;
  scenarios?: ScenarioAnalysis;
  versions?: Version[];
}

export interface Version {
  id: string;
  timestamp: number;
  label: string;
  analysis?: SceneBreakdown;
  scenarios?: ScenarioAnalysis;
}

export interface CastMember {
  name: string;
  role: string;
  age: string;
  gender: string;
  description: string;
  motivation: string;
}

export interface SceneBreakdown {
  cast: CastMember[];
  costumes: string[];
  makeup: string[];
  graphics: string[];
  vehicles: string[];
  locations: string[];
  extras: string[];
  props: string[];
  stunts: string[];
  animals: string[];
  spfx: string[];
  vfx: string[];
}

export interface ImpactMetrics {
  budget: number;
  schedule: number;
  risk: number;
  creative: number;
}

export interface ScenarioOption {
  id: string;
  name: string;
  description: string;
  metrics: ImpactMetrics;
  agentInsights: {
    logistics: string;
    budget: string;
    schedule: string;
    creative: string;
    risk: string;
  };
  recommended: boolean;
}

export interface ScenarioAnalysis {
  scenarios: ScenarioOption[];
}

export type AgentKey = keyof SceneBreakdown | 'logistics' | 'budget' | 'schedule' | 'creative' | 'risk';

export interface AgentDef {
  key: AgentKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  type: 'breakdown' | 'strategic';
}

export interface ScriptSegmentResponse {
  scenes: {
    header: string;
    content: string;
  }[];
}

// ============================================
// CAST BREAKDOWN TYPES (Enhanced)
// ============================================

export interface ExtendedCastMember extends CastMember {
  id: string;
  nameArabic?: string;
  roleCategory: 'Lead' | 'Supporting' | 'Bit Part' | 'Silent' | 'Group' | 'Mystery';
  ageRange: string;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Unknown';
  visualDescription: string;
  motivation: string;
  personalityTraits?: string[];
  relationships?: { character: string; type: string }[];
  scenePresence?: {
    sceneNumbers: number[];
    dialogueLines: number;
    silentAppearances: number;
  };
}

export interface CastAnalysisOptions {
  apiKey?: string;
  model?: string;
  language?: 'ar' | 'en' | 'both';
}

export interface CastAnalysisResult {
  members: ExtendedCastMember[];
  summary: {
    totalCharacters: number;
    leadCount: number;
    supportingCount: number;
    maleCount: number;
    femaleCount: number;
    estimatedAgeRanges: Record<string, number>;
  };
  insights: string[];
  warnings: string[];
}
