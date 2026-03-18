import { ANALYSIS_INSTRUCTIONS } from './analysis_instructions';
import { CREATIVE_INSTRUCTIONS } from './creative_instructions';
import { INTEGRATED_INSTRUCTIONS } from './integrated_instructions';
import { CHARACTER_DEEP_ANALYZER_INSTRUCTIONS } from './character_deep_analyzer_instructions';
import { DIALOGUE_FORENSICS_INSTRUCTIONS } from './dialogue_forensics_instructions';
import { RHYTHM_MAPPING_INSTRUCTIONS } from './rhythm_mapping_instructions';
import { CULTURAL_HISTORICAL_ANALYZER_INSTRUCTIONS } from './cultural_historical_analyzer_instructions';
import { SCENE_GENERATOR_INSTRUCTIONS } from './scene_generator_instructions';
import { COMPLETION_INSTRUCTIONS } from './completion_instructions';
import { WORLD_BUILDER_INSTRUCTIONS } from './world_builder_instructions';
import { ADAPTIVE_REWRITING_INSTRUCTIONS } from './adaptive_rewriting_instructions';
import { PLATFORM_ADAPTER_INSTRUCTIONS } from './platform_adapter_instructions';
import { AUDIENCE_RESONANCE_INSTRUCTIONS } from './audience_resonance_instructions';
import { TENSION_OPTIMIZER_INSTRUCTIONS } from './tension_optimizer_instructions';

export const INSTRUCTIONS_MAP: Record<string, string> = {
  'analysis': ANALYSIS_INSTRUCTIONS,
  'creative': CREATIVE_INSTRUCTIONS,
  'integrated': INTEGRATED_INSTRUCTIONS,
  'character-analyzer': CHARACTER_DEEP_ANALYZER_INSTRUCTIONS,
  'dialogue-forensics': DIALOGUE_FORENSICS_INSTRUCTIONS,
  'rhythm-mapping': RHYTHM_MAPPING_INSTRUCTIONS,
  'cultural-analyzer': CULTURAL_HISTORICAL_ANALYZER_INSTRUCTIONS,
  'scene-generator': SCENE_GENERATOR_INSTRUCTIONS,
  'completion': COMPLETION_INSTRUCTIONS,
  'world-builder': WORLD_BUILDER_INSTRUCTIONS,
  'adaptive-rewriting': ADAPTIVE_REWRITING_INSTRUCTIONS,
  'platform-adapter': PLATFORM_ADAPTER_INSTRUCTIONS,
  'audience-resonance': AUDIENCE_RESONANCE_INSTRUCTIONS,
  'tension-optimizer': TENSION_OPTIMIZER_INSTRUCTIONS,
};
