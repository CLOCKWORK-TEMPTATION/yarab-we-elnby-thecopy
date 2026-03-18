import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runPropsAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Property Master Agent**.
    Analyze the script scene for **Props**.

    FOCUS: Objects that actors **touch, hold, pick up, or interact with directly**.

    Extract requirements for:
    1. **Hand Props**: Weapons (guns, knives), phones, keys, wallets, glasses, cigarettes, lighters.
    2. **Action Props**: Food being eaten (consumables), drinks being poured/consumed, tools being used, documents being read.
    3. **Hero Props**: Key story items with specific importance (e.g., "The Ancient Golden Amulet").
    4. **Interaction**: Notes on usage (e.g., "Vase - smashed against wall").

    RULES:
    - **Props vs Set Dressing**: If an object sits in the background and is NEVER touched, it is Set Dressing (IGNORE IT). If an actor touches it, it is a Prop.
    - **Props vs Costume**: Jewelry or watches are Costumes unless the actor takes them off or hands them to someone.
    - **Specificity**: "Revolver" instead of "Gun". "Red wine" instead of "Drink".

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
    console.warn("Props Agent failed:", error);
    return [];
  }
};