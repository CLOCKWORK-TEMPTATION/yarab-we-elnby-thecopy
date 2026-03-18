import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runMakeupHairAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Makeup & Hair Artist Agent**.
    Analyze the script scene for **Cosmetics, Hair, Wounds, and Prosthetics**.

    FOCUS: The physical appearance of the actors' faces, skin, and hair.

    Extract requirements for:
    1. **Cosmetic Look**: "Glamorous evening makeup", "Natural/No-makeup look", "Fatigued/Sickly pale".
    2. **Hair**: Specific styles (e.g., "Messy bedhead", "Tight military bun", "Wet hair", "Wig needed").
    3. **SFX Makeup**: Cuts, bruises, fresh blood vs dried blood, burns, scars, tattoos.
    4. **Environmental Effects**: Sweat (heavy/light), dirt/grime on face/body, tears.
    5. **Prosthetics**: Aging effects, creature features, limb attachments.

    RULES:
    - **Continuity**: Note changes (e.g., "Face gets muddier", "Lipstick smudged").
    - **Specificity**: "Gash on forehead" is better than "Cut".
    - **Exclusions**: Do not list clothing items.

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
    console.warn("Makeup & Hair Agent failed:", error);
    return [];
  }
};