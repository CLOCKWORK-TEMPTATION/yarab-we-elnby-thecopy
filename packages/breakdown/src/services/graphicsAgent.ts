import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runGraphicsAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Playback & Graphics Specialist Agent**.
    Analyze the script scene for **Screen Content (Playback) and Printed Media**.

    FOCUS: Anything that needs to be designed, printed, or displayed on a digital screen.

    Extract requirements for:
    1. **Digital Displays (Playback)**: 
       - Content on TV screens (e.g., "News report about fire").
       - Computer monitors (e.g., "Hacking terminal code", "Social media profile").
       - Mobile devices (e.g., "Text message from 'Mom'", "GPS map app").
    2. **Printed Props**: Newspapers (headlines?), Magazines, Photographs, Files/Dossiers, Letters, Business Cards.
    3. **Environmental Graphics**: Street signs, Shop names, Billboards, Posters, Graffiti, Labels on bottles.

    RULES:
    - **Content Detail**: Specify *what* is seen. "Phone screen" is vague; "Phone screen: Incoming call 'Unknown'" is good.
    - **Period**: Note if graphics need to be vintage (e.g., "1980s newspaper").

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
    console.warn("Graphics Agent failed:", error);
    return [];
  }
};