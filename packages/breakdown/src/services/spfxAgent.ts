import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runSpfxAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Special Effects (SPFX) Supervisor Agent**.
    Analyze the script scene for **Practical Effects (Physical)**.

    FOCUS: Physical effects created ON SET during filming, not in the computer.

    Extract requirements for:
    1. **Atmospherics**: Rain (Rain towers), Wind (Fans), Snow, Fog/Smoke/Haze.
    2. **Pyrotechnics**: Explosions, Fire (Controlled burns), Sparks, Fireworks.
    3. **Ballistics**: Squibs (blood hits on bodies), bullet hits on walls/glass/ground.
    4. **Destruction**: Breakaway walls, shattering glass, debris falling, collapsing structures.
    5. **Liquids**: Running water, plumbing effects, blood pools (if flow is required), slime.

    RULES:
    - **SPFX vs VFX**: If it interacts physically with the actors (e.g., they get wet, wind blows hair), it is SPFX. If it is a monster or a background extension, it is VFX.
    - **Scale**: "Light rain" vs "Hurricane force storm".

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
    console.warn("SPFX Agent failed:", error);
    return [];
  }
};