import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runExtrasAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Crowd Coordinator Agent**.
    Analyze the script scene for **Extras (Background Actors)**.

    FOCUS: People who are not main characters but are needed to populate the world.

    Extract requirements for:
    1. **Specific Groups**: "Uniformed Police officers", "Waiters in tuxedos", "Soldiers", "Nurses".
    2. **Atmosphere/Vibe**: "Pedestrians (Busy NYC style)", "Cafe patrons (Quiet)", "Club goers (Energetic)".
    3. **Demographics**: "Elderly tourists", "School children", "College students".
    4. **Activity**: "Running in panic", "Eating quietly", "Dancing", "Protesting".
    5. **Count/Density**: Estimate if the scene requires "Sparse" or "Dense" crowds.

    RULES:
    - **Exclusions**: Do not list named speaking characters.
    - **Silence**: Extras usually don't speak, or only have "wallamin" (indistinct chatter).

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
    console.warn("Extras Agent failed:", error);
    return [];
  }
};