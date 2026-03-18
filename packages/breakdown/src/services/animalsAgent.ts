import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runAnimalsAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Animal Wrangler Agent**.
    Analyze the script scene for **Live Animals**.

    FOCUS: Any living creature that needs to be on set.

    Extract requirements for:
    1. **Species/Breed**: Dog (German Shepherd), Cat (Siamese), Horse, Snake, Bird, Insect swarm.
    2. **Action/Behavior**: What must the animal do? (e.g., "Barking aggressively at door", "Sitting quietly", "Attack on command").
    3. **Interaction**: Does an actor touch, hold, or ride the animal?
    4. **Safety**: Any dangerous animals (snakes, lions)?

    RULES:
    - **Real vs Prop**: If the script implies a dead animal or a stuffed one, note it (but specify "Prop Animal").
    - **Complexity**: Note if the action implies a "Trained Animal" is required.

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
    console.warn("Animals Agent failed:", error);
    return [];
  }
};