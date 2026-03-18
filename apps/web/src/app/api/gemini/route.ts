import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Modality } from "@google/genai";

const getApiKey = (): string | null => {
  return process.env.GEMINI_API_KEY || null;
};

let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI | null => {
  const key = getApiKey();
  if (!key) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();

    const ai = getAI();
    if (!ai) {
      return NextResponse.json(
        { error: 'Gemini API Key not configured. Please add GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'generateDesign':
        return await handleGenerateDesign(ai, data);
      case 'transcribeAudio':
        return await handleTranscribeAudio(ai, data);
      case 'analyzeVideo':
        return await handleAnalyzeVideo(ai, data);
      case 'generateGarment':
        return await handleGenerateGarment(ai, data);
      case 'generateVirtualFit':
        return await handleGenerateVirtualFit(ai, data);
      case 'editGarment':
        return await handleEditGarment(ai, data);
      case 'refineScreenplay':
        return await handleRefineScreenplay(ai, data);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

async function handleGenerateDesign(ai: GoogleGenAI, data: any) {
  const { brief } = data;

  const systemInstruction = `You are an expert AI Costume Stylist & Designer for Film/TV.
  Your Goal: Create a "Look" that fits the Drama (Script), Visuals (Camera), Production Reality (Budget/Weather), and **Character Psychology**.

  CORE LOGIC & CONSTRAINTS:
  1. **Psychological Mirroring:** The costume MUST reflect the character's internal arc, secrets, or transformation.
  2. **Script Rule:** Every item must have a dramatic reason.
  3. **Continuity & Safety:** Consider stunts, multiple takes (copies needed), and actor safety (footwear).
  4. **Camera:** Avoid moire patterns (tight grids), pure white (burnout), or noisy fabrics unless requested.
  5. **Language:** The output content MUST be in **Professional Egyptian Arabic** (for descriptions/rationale), but the JSON keys must be in English.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: `${systemInstruction}\n\nCreate a costume design for:\nProject Type: ${brief.projectType}\nScene Context: ${brief.sceneContext}\nCharacter Profile: ${brief.characterProfile}\nPsychological State: ${brief.psychologicalState}\nLocation: ${brief.filmingLocation}\nConstraints: ${brief.productionConstraints}`,
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text || '{}';
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    result = {
      lookTitle: 'تصميم أزياء مخصص',
      dramaticDescription: text,
      breakdown: {},
      rationale: [],
      realWeather: { temp: 72, condition: 'Default' },
      conceptArtUrl: ''
    };
  }

  return NextResponse.json(result);
}

async function handleTranscribeAudio(ai: GoogleGenAI, data: any) {
  const { audioBase64, mimeType } = data;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: [
      { text: 'Transcribe this audio to text, focusing on any creative or costume design notes:' },
      { inlineData: { data: audioBase64, mimeType } }
    ]
  });

  return NextResponse.json({ text: response.text || '' });
}

async function handleAnalyzeVideo(ai: GoogleGenAI, data: any) {
  const { videoBase64, mimeType } = data;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: [
      { text: 'Analyze this video for costume design inspiration. Describe colors, textures, silhouettes, and mood:' },
      { inlineData: { data: videoBase64, mimeType } }
    ]
  });

  return NextResponse.json({ analysis: response.text || '' });
}

async function handleGenerateGarment(ai: GoogleGenAI, data: any) {
  const { prompt, size } = data;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: `Generate a detailed description and visual concept for a garment: ${prompt}. Size reference: ${size}. Include fabric suggestions, color palette, and styling notes.`
  });

  return NextResponse.json({
    description: response.text || '',
    imageUrl: null
  });
}

async function handleGenerateVirtualFit(ai: GoogleGenAI, data: any) {
  const { garmentUrl, personUrl, config } = data;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: `Describe how the garment would look when virtually fitted. Garment: ${garmentUrl}, Person reference: ${personUrl}, Config: ${JSON.stringify(config)}. Provide fit analysis and styling suggestions.`
  });

  return NextResponse.json({
    fitDescription: response.text || '',
    resultUrl: garmentUrl
  });
}

async function handleEditGarment(ai: GoogleGenAI, data: any) {
  const { imageUrl, editPrompt } = data;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: `Describe how to edit this garment image (${imageUrl}) with the following modifications: ${editPrompt}. Provide detailed instructions for the visual changes.`
  });

  return NextResponse.json({
    description: response.text || '',
    imageUrl: imageUrl
  });
}

async function handleRefineScreenplay(ai: GoogleGenAI, data: any) {
  const { lines } = data;

  const prompt = `
    You are an expert Screenplay Formatter specialized in Arabic scripts.
    Analyze the following screenplay lines and correct their classification strictly.
    
    Rules:
    1. 'scene-header-3' MUST be a location name (e.g., "غرفة المكتب") appearing immediately after a master scene header.
    2. Differentiate carefully between 'action' description and 'character' names.
    3. Return ONLY a JSON array.

    Lines:
    ${JSON.stringify(lines)}

    Output format:
    {"lines": [{"text": "...", "type": "scene-header-1" | "scene-header-3" | "action" | "character" | "dialogue"}]}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text || '{}';
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    result = { lines: [] };
  }

  return NextResponse.json(result);
}
