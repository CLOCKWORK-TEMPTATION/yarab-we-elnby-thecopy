import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runVfxAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **VFX Supervisor Agent**.
    Analyze the script scene for **Visual Effects (CGI & Compositing)**.

    FOCUS: Effects that will be done in post-production.

    Extract requirements for:
    1. **Digital Environments**: Set extensions (e.g., "Top of skyscraper", "Historical city"), Green Screen/Blue Screen backgrounds.
    2. **Digital Characters/Creatures**: CGI monsters, robots, animals doing impossible things, digital doubles for dangerous stunts.
    3. **Enhancements**: Wire removal, muzzle flashes (if not practical), screen replacements (burning in TV images), reflection removal.
    4. **Impossible Physics**: Magic spells, superpowers, flying objects, energy beams.
    5. **Cleanup**: Removing modern objects from period pieces.

    RULES:
    - **Screens**: If a TV/Phone screen is mentioned, list "Screen Replacement" or "Burn-in".
    - **Distinction**: If it can be done safely on set (like a small fire), it might be SPFX. If it's a massive inferno or unsafe, it's VFX.

    Return JSON: { "items": string[] }
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      items: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["items"]
  };

  try {
    const response = await ai.models.generateContent({
      model: AGENT_MODEL,
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'user', parts: [{ text: `SCENE CONTENT:\n${sceneContent}` }] }
      ],
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return (response.text ? JSON.parse(response.text).items : []) || [];
  } catch (error) {
    console.warn("VFX Agent failed:", error);
    return [];
  }
};