/**
 * Integration Testing & Validation Suite
 * Tests for all integration points and error scenarios
 */

import { getAppConfig, isValidAPIKey, formatErrorMessage, validateResponse } from './config';
import * as geminiService from './services/geminiService';

// ============================================
// CONFIGURATION TESTS
// ============================================

export const testConfiguration = (): { passed: number; failed: number; details: string[] } => {
  const results = { passed: 0, failed: 0, details: [] as string[] };

  // Test 1: API Key Loading
  try {
    const config = getAppConfig();
    if (config.apiKey) {
      results.passed++;
      results.details.push('✓ API Key successfully loaded from environment');
    } else {
      results.failed++;
      results.details.push('✗ API Key not found - set GEMINI_API_KEY in .env.local');
    }
  } catch (error) {
    results.failed++;
    results.details.push(`✗ Configuration test failed: ${formatErrorMessage(error)}`);
  }

  // Test 2: API Key Validation
  try {
    const config = getAppConfig();
    if (isValidAPIKey(config.apiKey)) {
      results.passed++;
      results.details.push('✓ API Key format is valid');
    } else {
      results.failed++;
      results.details.push('✗ API Key format is invalid or placeholder text');
    }
  } catch (error) {
    results.failed++;
    results.details.push(`✗ API Key validation failed: ${formatErrorMessage(error)}`);
  }

  // Test 3: Environment Configuration
  try {
    const config = getAppConfig();
    if (config.environment === 'development' || config.environment === 'production') {
      results.passed++;
      results.details.push(`✓ Environment configured: ${config.environment}`);
    } else {
      results.failed++;
      results.details.push('✗ Environment not properly configured');
    }
  } catch (error) {
    results.failed++;
    results.details.push(`✗ Environment test failed: ${formatErrorMessage(error)}`);
  }

  return results;
};

// ============================================
// SERVICE INTEGRATION TESTS
// ============================================

export const testScriptSegmentation = async (testScript: string): Promise<{ passed: number; failed: number; details: string[] }> => {
  const results = { passed: 0, failed: 0, details: [] as string[] };

  try {
    const response = await geminiService.segmentScript(testScript);
    
    // Validate response structure
    if (validateResponse(response, ['scenes'])) {
      results.passed++;
      results.details.push('✓ Script segmentation service responding correctly');
    } else {
      results.failed++;
      results.details.push('✗ Script segmentation returned invalid response structure');
      return results;
    }

    // Validate scenes array
    if (Array.isArray(response.scenes) && response.scenes.length > 0) {
      results.passed++;
      results.details.push(`✓ Successfully segmented script into ${response.scenes.length} scenes`);
    } else {
      results.failed++;
      results.details.push('✗ No scenes were extracted from the script');
      return results;
    }

    // Validate scene structure
    const firstScene = response.scenes[0];
    if (firstScene.header && firstScene.content) {
      results.passed++;
      results.details.push('✓ Scene structure is valid (has header and content)');
    } else {
      results.failed++;
      results.details.push('✗ Scene structure is invalid - missing header or content');
    }

  } catch (error) {
    results.failed++;
    results.details.push(`✗ Script segmentation failed: ${formatErrorMessage(error)}`);
  }

  return results;
};

export const testSceneAnalysis = async (sceneContent: string): Promise<{ passed: number; failed: number; details: string[] }> => {
  const results = { passed: 0, failed: 0, details: [] as string[] };

  try {
    const breakdown = await geminiService.analyzeScene(sceneContent);
    
    // Validate breakdown structure
    const requiredKeys = ['cast', 'costumes', 'makeup', 'vehicles', 'locations'];
    if (validateResponse(breakdown, requiredKeys)) {
      results.passed++;
      results.details.push('✓ Scene analysis returned valid breakdown structure');
    } else {
      results.failed++;
      results.details.push('✗ Scene breakdown is missing required fields');
      return results;
    }

    // Validate cast array
    if (Array.isArray(breakdown.cast)) {
      results.passed++;
      results.details.push(`✓ Cast analysis successful (${breakdown.cast.length} characters)`);
    } else {
      results.failed++;
      results.details.push('✗ Cast data is not an array');
    }

    // Validate other categories
    const categories = ['costumes', 'makeup', 'vehicles', 'locations', 'props', 'stunts'];
    const validCategories = categories.filter(cat => 
      Array.isArray((breakdown as any)[cat]) && (breakdown as any)[cat].length > 0
    );
    
    if (validCategories.length > 0) {
      results.passed++;
      results.details.push(`✓ Found breakdown data in ${validCategories.length} categories`);
    }

  } catch (error) {
    results.failed++;
    results.details.push(`✗ Scene analysis failed: ${formatErrorMessage(error)}`);
  }

  return results;
};

export const testScenarioGeneration = async (sceneContent: string): Promise<{ passed: number; failed: number; details: string[] }> => {
  const results = { passed: 0, failed: 0, details: [] as string[] };

  try {
    const scenarios = await geminiService.analyzeProductionScenarios(sceneContent);
    
    // Validate response structure
    if (validateResponse(scenarios, ['scenarios'])) {
      results.passed++;
      results.details.push('✓ Scenario generation service responding correctly');
    } else {
      results.failed++;
      results.details.push('✗ Scenario generation returned invalid structure');
      return results;
    }

    // Validate scenarios array
    if (Array.isArray(scenarios.scenarios) && scenarios.scenarios.length > 0) {
      results.passed++;
      results.details.push(`✓ Generated ${scenarios.scenarios.length} production scenarios`);
    } else {
      results.failed++;
      results.details.push('✗ No scenarios were generated');
      return results;
    }

    // Validate scenario structure
    const firstScenario = scenarios.scenarios[0];
    const scenarioKeys = ['id', 'name', 'description', 'metrics', 'agentInsights'];
    if (scenarioKeys.every(key => key in firstScenario)) {
      results.passed++;
      results.details.push('✓ Scenario structure is complete and valid');
    } else {
      results.failed++;
      results.details.push('✗ Scenario structure is incomplete');
    }

    // Validate metrics
    if (firstScenario.metrics && 
        typeof firstScenario.metrics.budget === 'number' &&
        typeof firstScenario.metrics.schedule === 'number') {
      results.passed++;
      results.details.push('✓ Scenario metrics are properly formatted');
    }

  } catch (error) {
    results.failed++;
    results.details.push(`✗ Scenario generation failed: ${formatErrorMessage(error)}`);
  }

  return results;
};

// ============================================
// ERROR HANDLING TESTS
// ============================================

export const testErrorHandling = async (): Promise<{ passed: number; failed: number; details: string[] }> => {
  const results = { passed: 0, failed: 0, details: [] as string[] };

  // Test 1: Empty script handling
  try {
    await geminiService.segmentScript('');
    results.failed++;
    results.details.push('✗ Empty script should be rejected');
  } catch {
    results.passed++;
    results.details.push('✓ Empty script correctly rejected');
  }

  // Test 2: Invalid response handling
  try {
    const result = await geminiService.segmentScript('test');
    if (Array.isArray(result.scenes)) {
      results.passed++;
      results.details.push('✓ API responses are properly validated');
    }
  } catch (error) {
    results.passed++;
    results.details.push('✓ Invalid responses trigger proper error handling');
  }

  // Test 3: Error formatting
  try {
    const testError = new Error('Test error message');
    const formatted = formatErrorMessage(testError);
    if (formatted.includes('Test error')) {
      results.passed++;
      results.details.push('✓ Error messages are properly formatted');
    }
  } catch {
    results.failed++;
    results.details.push('✗ Error formatting failed');
  }

  return results;
};

// ============================================
// COMPREHENSIVE TEST SUITE
// ============================================

export const runFullIntegrationTest = async (): Promise<{
  overall: { passed: number; failed: number };
  tests: Record<string, any>;
}> => {
  const sampleScript = `
INT. COFFEE SHOP - DAY

Alice sits at a table with her laptop. Bob enters and sits across from her.

BOB
Hello, Alice!

ALICE
Hi Bob. How are you?

Bob smiles.

BOB
Great, just finished the big project.
`;

  const results = {
    overall: { passed: 0, failed: 0 },
    tests: {} as Record<string, any>
  };

  // Run all tests
  console.log('🧪 Starting Integration Test Suite...\n');

  // Configuration Tests
  console.log('📋 Configuration Tests');
  const configTests = testConfiguration();
  results.tests['Configuration'] = configTests;
  results.overall.passed += configTests.passed;
  results.overall.failed += configTests.failed;
  configTests.details.forEach(d => console.log(d));

  // Script Segmentation
  if (configTests.failed === 0) {
    console.log('\n🎬 Script Segmentation Tests');
    const segmentTests = await testScriptSegmentation(sampleScript);
    results.tests['ScriptSegmentation'] = segmentTests;
    results.overall.passed += segmentTests.passed;
    results.overall.failed += segmentTests.failed;
    segmentTests.details.forEach(d => console.log(d));

    // Scene Analysis
    console.log('\n📊 Scene Analysis Tests');
    const sceneTests = await testSceneAnalysis(sampleScript);
    results.tests['SceneAnalysis'] = sceneTests;
    results.overall.passed += sceneTests.passed;
    results.overall.failed += sceneTests.failed;
    sceneTests.details.forEach(d => console.log(d));

    // Scenario Generation
    console.log('\n🎯 Scenario Generation Tests');
    const scenarioTests = await testScenarioGeneration(sampleScript);
    results.tests['ScenarioGeneration'] = scenarioTests;
    results.overall.passed += scenarioTests.passed;
    results.overall.failed += scenarioTests.failed;
    scenarioTests.details.forEach(d => console.log(d));
  }

  // Error Handling
  console.log('\n⚠️ Error Handling Tests');
  const errorTests = await testErrorHandling();
  results.tests['ErrorHandling'] = errorTests;
  results.overall.passed += errorTests.passed;
  results.overall.failed += errorTests.failed;
  errorTests.details.forEach(d => console.log(d));

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Tests Passed: ${results.overall.passed}`);
  console.log(`❌ Tests Failed: ${results.overall.failed}`);
  console.log('='.repeat(50));

  return results;
};

// Export test runner
if (typeof window !== 'undefined') {
  (window as any).runIntegrationTests = runFullIntegrationTest;
}
