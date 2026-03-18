/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Client-side Gemini service that calls server-side API routes
 */

import { DesignBrief, ProfessionalDesignResult, SimulationConfig, FitAnalysisResult, ImageGenerationSize } from "../types";
import { fileToBase64 } from "../lib/utils";

const API_ENDPOINT = '/api/gemini';

async function callGeminiAPI(action: string, data: any): Promise<any> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

/**
 * الدالة الرئيسية لتحليل السيناريو وتوليد تصميم الأزياء.
 */
export const generateProfessionalDesign = async (brief: DesignBrief): Promise<ProfessionalDesignResult> => {
  const result = await callGeminiAPI('generateDesign', { brief });

  return {
    lookTitle: result.lookTitle || 'تصميم مخصص',
    dramaticDescription: result.dramaticDescription || '',
    breakdown: result.breakdown || {
      basics: '',
      layers: '',
      shoes: '',
      accessories: '',
      materials: '',
      colorPalette: ''
    },
    rationale: result.rationale || [],
    productionNotes: result.productionNotes || {
      copies: '1',
      distressing: 'لا يوجد',
      cameraWarnings: 'لا يوجد',
      weatherAlt: 'لا يوجد',
      budgetAlt: 'لا يوجد'
    },
    imagePrompt: result.imagePrompt || '',
    conceptArtUrl: result.conceptArtUrl || 'https://placehold.co/512x512/1a1a1a/d4b483?text=Design+Concept',
    realWeather: result.realWeather || { temp: 72, condition: 'Default', location: '' }
  };
};

/**
 * Transcribe audio using Gemini.
 */
export const transcribeAudio = async (audioBlob: Blob | File): Promise<string> => {
  const base64 = await fileToBase64(audioBlob as File);
  const result = await callGeminiAPI('transcribeAudio', {
    audioBase64: base64,
    mimeType: audioBlob.type || 'audio/webm'
  });
  return result.text || '';
};

/**
 * Analyze video content for costume design inspiration.
 */
export const analyzeVideoContent = async (videoFile: File): Promise<string> => {
  const base64 = await fileToBase64(videoFile);
  const result = await callGeminiAPI('analyzeVideo', {
    videoBase64: base64,
    mimeType: videoFile.type
  });
  return result.analysis || '';
};

/**
 * Generate a garment asset.
 */
export const generateGarmentAsset = async (
  prompt: string,
  size: ImageGenerationSize = '1K'
): Promise<{ url: string; name: string }> => {
  const result = await callGeminiAPI('generateGarment', { prompt, size });
  return {
    url: result.imageUrl || 'https://placehold.co/512x512/1a1a1a/d4b483?text=Garment',
    name: prompt.slice(0, 30)
  };
};

/**
 * Generate a virtual fit result.
 */
export const generateVirtualFit = async (
  garmentUrl: string,
  personImageUrl: string,
  config: SimulationConfig
): Promise<FitAnalysisResult> => {
  const result = await callGeminiAPI('generateVirtualFit', {
    garmentUrl,
    personUrl: personImageUrl,
    config
  });

  return {
    compatibilityScore: result.compatibilityScore || 85,
    safetyIssues: result.safetyIssues || [],
    fabricNotes: result.fabricNotes || result.fitDescription || 'تحليل التناسب',
    movementPrediction: result.movementPrediction || 'متوقع'
  };
};

/**
 * Generate a stress test video description.
 */
export const generateStressTestVideo = async (
  garmentUrl: string,
  config: SimulationConfig
): Promise<{ videoUrl: string; report: string }> => {
  return {
    videoUrl: '',
    report: 'اختبار الإجهاد غير متاح حاليًا - يتطلب تكوين API إضافي'
  };
};

/**
 * Edit a garment image with AI.
 */
export const editGarmentImage = async (
  imageFileOrUrl: File | string,
  editPrompt: string
): Promise<{ url: string; name: string }> => {
  const imageUrl = typeof imageFileOrUrl === 'string'
    ? imageFileOrUrl
    : await fileToBase64(imageFileOrUrl);
  const result = await callGeminiAPI('editGarment', { imageUrl, editPrompt });
  return {
    url: result.imageUrl || imageUrl,
    name: editPrompt.slice(0, 30)
  };
};
