import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runLocationsAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Location Manager Agent**.
    Analyze the script scene for **Filming Locations and Set Requirements**.

    FOCUS: The physical environment, geography, and architectural features.

    Extract requirements for:
    1. **Setting Type**: Interior (INT) or Exterior (EXT) and time of day (Day/Night).
    2. **Environment Description**: "Dilapidated apartment", "Modern glass office", "Dense pine forest", "Desert highway".
    3. **Architectural Features**: "Large bay window", "Winding staircase", "Fireplace", "Trap door", "Balcony".
    4. **Condition**: "Clean", "Messy", "Destroyed", "Ancient", "Futuristic".
    5. **Practical Needs**: "Working elevator", "Running water", "Practical lighting fixtures".

    RULES:
    - **Distinction**: Focus on the *space*, not the furniture (Set Dressing), unless it is built-in (e.g., "Built-in bookshelves").
    - **Vibe**: capture the era or style (e.g., "Victorian Era", "Cyberpunk").

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
    console.warn("Locations Agent failed:", error);
    return [];
  }
};