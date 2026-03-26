import { Schema, Type } from "@google/genai";
import type { ScriptSegmentResponse } from "../../domain/models";
import { GEMINI_MODELS } from "../../domain/constants";
import { validateScriptSegmentResponse } from "../../domain/schemas";
import { logError } from "../../domain/errors";
import { segmentScriptLocally } from "../screenplay/local-segmenter";
import { getGeminiClient } from "./client";

const segmentationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          header: { type: Type.STRING, description: "Scene heading/slugline" },
          content: {
            type: Type.STRING,
            description: "Full scene content excluding header",
          },
        },
        required: ["header", "content"],
      },
    },
  },
  required: ["scenes"],
};

const segmentationPrompt = `You are an expert film script supervisor.
Analyze the following script text and break it down into individual scenes.
A scene usually starts with a SCENE HEADING (Slugline) like "INT. ROOM - DAY" or "EXT. STREET - NIGHT" or Arabic equivalents like "مشهد داخلي" or "مشهد خارجي".

Return a JSON object with a "scenes" array where each scene has:
- "header": The scene heading (slugline)
- "content": The full text of the scene (action, dialogue, parentheticals) excluding the header`;

export const segmentScript = async (
  scriptText: string
): Promise<ScriptSegmentResponse> => {
  const fallback = () => segmentScriptLocally(scriptText);

  try {
    const response = await getGeminiClient().models.generateContent({
      model: GEMINI_MODELS.segmentation,
      contents: [
        { role: "user", parts: [{ text: segmentationPrompt }] },
        { role: "user", parts: [{ text: `SCRIPT:\n${scriptText}` }] },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: segmentationSchema,
      },
    });

    const parsedResponse = response.text ? JSON.parse(response.text) : { scenes: [] };
    const validationResult = validateScriptSegmentResponse(parsedResponse);

    if (!validationResult.success || validationResult.data.scenes.length === 0) {
      const localResult = fallback();
      return localResult.scenes.length > 0 ? localResult : { scenes: [] };
    }

    return validationResult.data;
  } catch (error) {
    logError("segmentScript", error);
    const localResult = fallback();

    if (localResult.scenes.length > 0) {
      return localResult;
    }

    throw new Error("فشل في تقسيم السيناريو.");
  }
};
