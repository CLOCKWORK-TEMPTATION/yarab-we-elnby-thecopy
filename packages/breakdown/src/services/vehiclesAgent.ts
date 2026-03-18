import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runVehiclesAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Transportation Coordinator Agent**.
    Analyze the script scene for **Vehicles**.

    FOCUS: Cars, motorcycles, trucks, aircraft, boats, trains, and specialized machinery.

    Extract requirements for:
    1. **Picture Cars**: Specific vehicles driven or ridden by main characters (Make/Model/Color if specified).
    2. **Background Vehicles**: Parked cars, taxi fleets, police cruisers, military convoys.
    3. **Condition**: "Brand new", "Rusted", "Crashed", "Bullet-riddled".
    4. **Action**: "Speeding", "Screeching to a halt", "Idling", "Door open".

    RULES:
    - **Generic vs Specific**: If script says "traffic", note "Background Traffic". If it says "A red Ferrari swerves", note "Picture Car: Red Ferrari".
    - **Modifications**: Note if special equipment is needed (e.g., "Police car with working siren/lights").

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
    console.warn("Vehicles Agent failed:", error);
    return [];
  }
};