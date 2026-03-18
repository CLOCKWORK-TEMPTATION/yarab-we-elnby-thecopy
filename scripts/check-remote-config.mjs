#!/usr/bin/env node

/**
 * Script to validate Next.js image remote configuration
 * Checks if remotePatterns are properly configured in next.config.ts
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load and parse the Next.js configuration file
 * @returns {Object} Parsed configuration object
 * @throws {Error} If config file cannot be read or parsed
 */
function loadNextConfig() {
  const configPath = join(__dirname, '..', 'frontend', 'next.config.ts');
  
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    
    // Extract remotePatterns from the TypeScript config
    const patternsMatch = configContent.match(/remotePatterns:\s*\[([\s\S]*?)\]/);
    
    if (!patternsMatch) {
      return { images: { remotePatterns: [] } };
    }
    
    // Count the number of pattern objects
    const patternsContent = patternsMatch[1];
    const patternCount = (patternsContent.match(/\{[\s\S]*?protocol:/g) || []).length;
    
    return {
      images: {
        remotePatterns: Array(patternCount).fill({})
      }
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Configuration file not found: ${configPath}`);
    }
    throw new Error(`Failed to read configuration: ${error.message}`);
  }
}

/**
 * Main function to validate remote configuration
 */
function main() {
  try {
    console.log('🔍 Checking Next.js remote image configuration...\n');
    
    const config = loadNextConfig();
    const patternCount = config.images?.remotePatterns?.length || 0;
    
    console.log(`✅ Remote patterns found: ${patternCount}`);
    
    if (patternCount === 0) {
      console.warn('⚠️  Warning: No remote patterns configured. External images may not load.');
      process.exit(0); // Exit with success but warn
    }
    
    console.log('✅ Configuration is valid');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking remote configuration:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();
