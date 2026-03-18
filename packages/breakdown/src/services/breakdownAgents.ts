import { SceneBreakdown } from "../types";
import { runMakeupHairAgent } from "./makeupHairAgent";
import { runGraphicsAgent } from "./graphicsAgent";
import { runVehiclesAgent } from "./vehiclesAgent";
import { runLocationsAgent } from "./locationsAgent";
import { runExtrasAgent } from "./extrasAgent";
import { runPropsAgent } from "./propsAgent";
import { runStuntsAgent } from "./stuntsAgent";
import { runAnimalsAgent } from "./animalsAgent";
import { runSpfxAgent } from "./spfxAgent";
import { runVfxAgent } from "./vfxAgent";
import { runCostumeAgent } from "./costumeAgent";

/**
 * Orchestrates all technical agents in parallel.
 * This replaces the monolithic technical breakdown function.
 */
export const runAllBreakdownAgents = async (
  sceneContent: string,
  apiKey?: string
): Promise<Omit<SceneBreakdown, 'cast'>> => {
  
  // Define all keys we need to populate in SceneBreakdown (excluding cast)
  const keys: Array<keyof Omit<SceneBreakdown, 'cast'>> = [
    'costumes', 'makeup', 'graphics', 'vehicles', 'locations', 
    'extras', 'props', 'stunts', 'animals', 'spfx', 'vfx'
  ];

  // Map keys to their specific agent functions
  const promises = keys.map(key => {
    switch (key) {
      case 'makeup': return runMakeupHairAgent(sceneContent, apiKey);
      case 'graphics': return runGraphicsAgent(sceneContent, apiKey);
      case 'vehicles': return runVehiclesAgent(sceneContent, apiKey);
      case 'locations': return runLocationsAgent(sceneContent, apiKey);
      case 'extras': return runExtrasAgent(sceneContent, apiKey);
      case 'props': return runPropsAgent(sceneContent, apiKey);
      case 'stunts': return runStuntsAgent(sceneContent, apiKey);
      case 'animals': return runAnimalsAgent(sceneContent, apiKey);
      case 'spfx': return runSpfxAgent(sceneContent, apiKey);
      case 'vfx': return runVfxAgent(sceneContent, apiKey);
      case 'costumes': return runCostumeAgent(sceneContent, apiKey);
      default: return Promise.resolve([]);
    }
  });

  // Run all agents in parallel
  const results = await Promise.all(promises);

  // Construct the result object
  const breakdown: Partial<Omit<SceneBreakdown, 'cast'>> = {};
  keys.forEach((key, index) => {
    breakdown[key] = results[index];
  });

  return breakdown as Omit<SceneBreakdown, 'cast'>;
};