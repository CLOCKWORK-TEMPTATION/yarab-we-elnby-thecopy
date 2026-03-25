import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { collectRelativeFiles, copyManagedTree } from './init-syskit-files.mjs';

const PLATFORM_BUNDLE_DIRECTORIES = [
  { sourceSegments: ['commands'], targetName: 'commands' }
];

export function expandPlatformOutputTargets(platform) {
  const targets = [];
  const seen = new Set();
  const mirrorDirectories = Array.isArray(platform.mirror_directories) ? platform.mirror_directories.filter(Boolean) : [];

  for (const outputFile of platform.output_files || []) {
    if (!seen.has(outputFile)) {
      seen.add(outputFile);
      targets.push(outputFile);
    }

    if (outputFile.includes('/') || outputFile.includes('\\')) continue;

    for (const mirrorDirectory of mirrorDirectories) {
      const mirrorPath = join(mirrorDirectory, outputFile);
      if (seen.has(mirrorPath)) continue;
      seen.add(mirrorPath);
      targets.push(mirrorPath);
    }
  }

  return targets;
}

function getPlatformBundleRoots(platform) {
  const roots = [];
  const seen = new Set();
  const mirrorDirectories = Array.isArray(platform.mirror_directories) ? platform.mirror_directories.filter(Boolean) : [];

  for (const mirrorDirectory of mirrorDirectories) {
    if (!seen.has(mirrorDirectory)) {
      seen.add(mirrorDirectory);
      roots.push(mirrorDirectory);
    }
  }

  for (const outputFile of platform.output_files || []) {
    const normalized = String(outputFile).replace(/\\/g, '/');
    if (!normalized.includes('/')) continue;
    const [root] = normalized.split('/');
    if (!root || seen.has(root)) continue;
    seen.add(root);
    roots.push(root);
  }

  return roots;
}

export function getPlatformBundleRelativeFiles(sourceRoot, selectedPlatforms) {
  const relativeFiles = [];
  const seen = new Set();
  const bundleRoots = [...new Set(selectedPlatforms.flatMap((item) => getPlatformBundleRoots(item)))];

  for (const bundleRoot of bundleRoots) {
    for (const bundleDirectory of PLATFORM_BUNDLE_DIRECTORIES) {
      const sourceDir = join(sourceRoot, ...bundleDirectory.sourceSegments);
      for (const filePath of collectRelativeFiles(sourceDir)) {
        const relativePath = join(bundleRoot, bundleDirectory.targetName, filePath);
        if (seen.has(relativePath)) continue;
        seen.add(relativePath);
        relativeFiles.push(relativePath);
      }
    }
  }

  return relativeFiles;
}

export function copyPlatformBundles(sourceRoot, targetRoot, selectedPlatforms, force, summary) {
  const copiedRoots = new Set();

  for (const platform of selectedPlatforms) {
    for (const bundleRoot of getPlatformBundleRoots(platform)) {
      if (copiedRoots.has(bundleRoot)) continue;
      copiedRoots.add(bundleRoot);

      for (const bundleDirectory of PLATFORM_BUNDLE_DIRECTORIES) {
        copyManagedTree(
          join(sourceRoot, ...bundleDirectory.sourceSegments),
          join(targetRoot, bundleRoot, bundleDirectory.targetName),
          force,
          summary
        );
      }
    }
  }
}

export function buildPlatformStatus(platform, targetRoot) {
  const outputs = expandPlatformOutputTargets(platform);
  const existingOutputs = outputs.filter((item) => existsSync(join(targetRoot, item)));
  let status = 'غير موجود';
  if (existingOutputs.length > 0 && existingOutputs.length < outputs.length) status = 'موجود جزئيًا';
  if (existingOutputs.length > 0 && existingOutputs.length === outputs.length) status = 'موجود بالكامل';

  return {
    ...platform,
    managed_outputs: outputs,
    existing_outputs: existingOutputs,
    status
  };
}
