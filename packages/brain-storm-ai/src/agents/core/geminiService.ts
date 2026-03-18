import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { GenerateContentResponse, Part, Content, SafetySetting, GenerateContentCandidate } from "@google/generative-ai";
import type {
  GeminiServiceResult,
  GeminiError,
  GeminiApiError,
  GeminiNetworkError,
  GeminiSchemaError
} from '../../lib/geminiTypes';
import {
  hasCandidates,
  hasValidContent,
  extractTextFromCandidates,
  safeRegexMatch,
  safeRegexMatchGroup,
  isNetworkError,
  isApiError
} from '../../lib/geminiTypes';
import { environment } from '../../config';
import { TaskCategory, TaskType } from '../../types/types';
import {
  PROMPT_PERSONA_BASE,
  TASK_SPECIFIC_INSTRUCTIONS,
  TASKS_EXPECTING_JSON_RESPONSE,
  COMPLETION_ENHANCEMENT_OPTIONS,
  TASK_CATEGORY_MAP
} from '../../config';
import { ENHANCED_TASK_DESCRIPTIONS as TASK_DESCRIPTIONS_FOR_PROMPT } from '../instructions/prompts';
import type { ProcessedFile } from './fileReaderService';

/**
 * @interface ProcessTextsParams
 * @description Defines the parameters for the `processTextsWithGemini` function.
 * @property {ProcessedFile[]} processedFiles - An array of files that have been processed for API submission.
 * @property {TaskType} taskType - The type of task to be performed by the Gemini model.
 * @property {string} specialRequirements - Any special user-defined requirements for the task.
 * @property {string} additionalInfo - Additional information provided by the user.
 * @property {string} [completionScope] - The specific scope for a completion task.
 * @property {TaskType[]} [selectedCompletionEnhancements] - An array of selected enhancements for a completion task.
 * @property {string} [previousContextText] - The text from a previous completion, for iterative tasks.
 */
interface ProcessTextsParams {
  processedFiles: ProcessedFile[];
  taskType: TaskType;
  specialRequirements: string;
  additionalInfo: string;
  completionScope?: string;
  selectedCompletionEnhancements?: TaskType[];
  previousContextText?: string;
}

/**
 * @interface GeminiTaskResultData
 * @description A flexible type to represent the data returned from a Gemini task, which could be a structured object or a raw string.
 */
export type GeminiTaskResultData = Record<string, unknown> | string;

/**
 * @interface GeminiServiceResponse
 * @description Represents the response from the Gemini service, containing either data or an error.
 * @property {GeminiTaskResultData} [data] - The data returned by the Gemini API.
 * @property {string} [rawText] - The raw text response from the API.
 * @property {string} [error] - An error message if the request failed.
 */
export interface GeminiServiceResponse {
  data?: GeminiTaskResultData;
  rawText?: string;
  error?: string;
}

import type { AgentConfig } from "../../config";

/**
 * @function attemptToFixJson
 * @description Attempts to fix a broken JSON string by extracting the content between the first '{' and last '}' or '[' and last ']'.
 * @param {string} jsonString - The potentially broken JSON string.
 * @returns {string} The fixed JSON string or the original string if it cannot be fixed.
 */
const attemptToFixJson = (jsonString: string): string => {
    const objectMatch = safeRegexMatch(jsonString, /\{(?:.|\n)*\}/s);
    if (objectMatch) {
        try {
            JSON.parse(objectMatch);
            return objectMatch;
        } catch (e) {
            // console.warn("attemptToFixJson: Extracted object substring is not valid JSON.", e);
        }
    }
    const arrayMatch = safeRegexMatch(jsonString, /\[(?:.|\n)*\]/s);
    if (arrayMatch) {
        try {
            JSON.parse(arrayMatch);
            return arrayMatch;
        } catch (e) {
            // console.warn("attemptToFixJson: Extracted array substring is not valid JSON.", e);
        }
    }
    return jsonString;
};

/**
 * @function constructPromptParts
 * @description Constructs the array of prompt parts to be sent to the Gemini API based on the task parameters.
 * @param {ProcessTextsParams} params - The parameters for the task.
 * @returns {Part[]} An array of `Part` objects to be sent to the API.
 */
const constructPromptParts = (params: ProcessTextsParams): Part[] => {
  const {
    processedFiles,
    taskType,
    specialRequirements,
    additionalInfo,
    completionScope,
    selectedCompletionEnhancements,
    previousContextText
  } = params;
  const parts: Part[] = [];

  let taskSpecificRole = "";
  const taskDescription = (TASK_DESCRIPTIONS_FOR_PROMPT as Record<string, string>)[taskType] || "مهمة عامة";
  const category = TASK_CATEGORY_MAP[taskType];
  const taskLabel = taskDescription.split(':')[0]?.trim() || taskDescription;

  switch(category) {
    case TaskCategory.CORE:
      if (taskType === TaskType.COMPLETION) {
        taskSpecificRole = `بصفتك كاتب سيناريو وخبير استكمال نصوص درامية، مع قدرة على دمج تحليلات متقدمة إذا طُلب منك ذلك.`;
      } else {
        taskSpecificRole = `بصفتك خبير تحليل درامي ونقدي، متخصص في "${taskLabel}".`;
      }
      break;
    case TaskCategory.ANALYSES:
        taskSpecificRole = `بصفتك خبير تحليل درامي متخصص في "${taskLabel}".`;
      break;
    case 'creative':
      taskSpecificRole = `بصفتك كاتب سيناريو ومؤلف مبدع متخصص في "${taskLabel}".`;
      break;
    case 'predictive':
      taskSpecificRole = `بصفتك مستشرف وخبير استراتيجي في تطوير الدراما متخصص في "${taskLabel}".`;
      break;
    case 'advanced_modules':
      const fullTaskDesc = (TASK_DESCRIPTIONS_FOR_PROMPT as Record<string, string>)[taskType];
      let moduleNameOnly = taskLabel;
      if (fullTaskDesc) {
        const colonIndex = fullTaskDesc.indexOf(':');
        const dashIndex = fullTaskDesc.indexOf('-');
        if (colonIndex !== -1) {
          const endIndex = dashIndex !== -1 ? dashIndex : fullTaskDesc.length;
          moduleNameOnly = fullTaskDesc.substring(colonIndex + 1, endIndex).trim();
        }
      }
      taskSpecificRole = `بصفتك خبير متخصص في "${moduleNameOnly}", قادر على إجراء تحليلات معمقة وتقديم نتائج منظمة بناءً على المكونات المحددة للوحدة.`;
      break;
    default:
      if (taskType.toString().includes('analysis') || taskType.toString().includes('analyzer')) {
        taskSpecificRole = `بصفتك خبير تحليل درامي متخصص في "${taskLabel}".`;
      } else if (taskType.toString().includes('creative') || taskType.toString().includes('generator') || taskType.toString().includes('builder')) {
        taskSpecificRole = `بصفتك كاتب سيناريو ومؤلف مبدع متخصص في "${taskLabel}".`;
      } else {
        taskSpecificRole = `بصفتك مساعد ذكي متعدد المهام في مجال الدراما والكتابة الإبداعية، متخصص في "${taskLabel}".`;
      }
      break;
  }

  parts.push({ text: PROMPT_PERSONA_BASE.replace('CritiqueConstruct AI', `CritiqueConstruct AI. ${taskSpecificRole}`) });

  const taskInstructions = TASK_SPECIFIC_INSTRUCTIONS[taskType];
  if (taskInstructions) {
    parts.push({ text: `\n\n## المهمة المحددة: ${taskDescription}\n${taskInstructions}` });
  } else {
    parts.push({ text: `\n\n## المهمة المحددة: ${taskDescription}\n(لا توجد تعليمات مفصلة لهذا النوع من المهام في الوقت الحالي، اعتمد على فهمك العام للمهمة من خلال وصفها العام.)` });
  }

  if (previousContextText) {
    parts.push({ text: "\n\n## سياق الاستكمال السابق:\n" });
    parts.push({ text: "تم تقديم النص التالي كنتيجة لعملية استكمال سابقة. المطلوب هو مواصلة العمل بناءً على هذا السياق بالإضافة إلى الملفات الأصلية (إذا كانت لا تزال ذات صلة ولم يتم تضمينها بالكامل في هذا السياق) وضمن 'نطاق الاستكمال المطلوب' الجديد." });
    parts.push({ text: "\n--- بداية السياق السابق ---\n" });
    parts.push({ text: previousContextText });
    parts.push({ text: "\n--- نهاية السياق السابق ---\n" });
    parts.push({ text: "يرجى الآن معالجة الملفات الحالية (إذا كانت منفصلة عن السياق أعلاه) والاستمرار في الاستكمال." });
  }

  processedFiles.forEach((file, index) => {
    parts.push({ text: `\n\n--- الملف المقدم ${index + 1}: ${file.name} (نوع MIME: ${file.mimeType}) ---` });

    if (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') {
      if (file.isBase64 && file.content && !file.content.startsWith('[Error:') && !file.content.startsWith('[ملاحظة:')) {
        parts.push({ inlineData: { mimeType: file.mimeType, data: file.content } });
        if (file.mimeType === 'application/pdf'){
            parts.push({text: "[ملاحظة: تم إرسال ملف PDF كبيانات. قد يتمكن النموذج من معالجة المحتوى إذا كان PDF يحتوي على طبقة نصية أو إذا كان النموذج يدعم OCR على ملفات PDF المرسلة بهذه الطريقة. إذا كان المحتوى النصي للـ PDF هو الأساس، يفضل تحويله إلى .txt أو .docx.]"});
        }
      } else if (file.content.startsWith('[Error:') || file.content.startsWith('[ملاحظة:')) {
        parts.push({ text: file.content });
      } else {
         parts.push({ text: `[الملف ${file.name} (${file.mimeType}) كان من المتوقع أن يكون base64 ولكن لم تتم معالجته بشكل صحيح أو أن محتواه فارغ.]`});
      }
    } else if (file.mimeType === 'text/plain' || file.mimeType === 'text/markdown') {
      if (file.content.startsWith('[Error:') || file.content.startsWith('[ملاحظة:')) {
        parts.push({ text: file.content });
      } else {
        parts.push({ text: file.content });
      }
    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      if (file.content.startsWith('[Error:') || file.content.startsWith('[ملاحظة:')) {
        parts.push({ text: file.content });
      } else {
        parts.push({ text: `محتوى من ملف DOCX (${file.name}):\n${file.content}` });
      }
    } else if (file.mimeType === 'application/msword') {
      parts.push({ text: file.content });
    } else {
      parts.push({ text: file.content });
    }
    parts.push({ text: `--- نهاية الملف ${index + 1}: ${file.name} ---` });
  });

  let userRequirementsSection = "\n\n## مواصفات المستخدم الإضافية:\n";
  let hasUserSpecs = false;
  if (specialRequirements) {
    userRequirementsSection += `المتطلبات الخاصة: ${specialRequirements}\n`;
    hasUserSpecs = true;
  }
  if (additionalInfo) {
    userRequirementsSection += `معلومات إضافية: ${additionalInfo}\n`;
    hasUserSpecs = true;
  }
  if (completionScope) {
    userRequirementsSection += `**نطاق الاستكمال المطلوب:** ${completionScope}\n`;
    hasUserSpecs = true;
  }

  if (taskType === TaskType.COMPLETION && selectedCompletionEnhancements && selectedCompletionEnhancements.length > 0) {
    userRequirementsSection += `\n**تحسينات الاستكمال المطلوبة (يجب دمجها بفعالية في النص المستكمل):**\n`;
    selectedCompletionEnhancements.forEach(enhancementId => {
      const enhancementDetail = COMPLETION_ENHANCEMENT_OPTIONS.find(opt => opt.id === enhancementId);
      const enhancementInstructions = TASK_SPECIFIC_INSTRUCTIONS[enhancementId] || `تطبيق مبادئ ${enhancementDetail?.label || enhancementId}.`;

      let goalSummary = enhancementDetail?.label || enhancementId;
      const goalText = safeRegexMatchGroup(enhancementInstructions, /\*\*الهدف:\*\*\s*([^\r\n]+)/, 1);
      if (goalText) {
        goalSummary = goalText;
      }

      userRequirementsSection += `- **${enhancementDetail?.label || enhancementId}:** ${goalSummary}. (راجع التعليمات التفصيلية لهذه المهمة إذا لزم الأمر).\n`;
    });
    hasUserSpecs = true;
  }


  if (!hasUserSpecs) {
    userRequirementsSection += `لم يتم تقديم متطلبات محددة أو نطاق استكمال أو تحسينات من المستخدم بخلاف الملفات ونوع المهمة.\n`;
  }
  parts.push({ text: userRequirementsSection });

  const jsonReminderTasks = TASKS_EXPECTING_JSON_RESPONSE.map(t => {
    const desc = (TASK_DESCRIPTIONS_FOR_PROMPT as Record<string, string>)[t];
    return desc?.split(':')[0]?.trim() || t;
  }).join(', ');
  parts.push({ text: `\n\n**تذكير بتعليمات الإخراج الصارمة**: اللغة العربية الفصحى. إذا كانت المهمة تتطلب إخراج JSON (مثل مهام: ${jsonReminderTasks}), يجب أن يكون ردك الأساسي هو كائن JSON صالح يتبع الواجهة المحددة للمهمة، وقد يكون محاطًا بـ \`\`\`json ... \`\`\`.` });

  return parts;
};

const MAX_RETRIES = 1;

/**
 * @function processTextsWithGemini
 * @description Processes texts and files with the Gemini API, handling prompt construction, API calls, response parsing, and error handling.
 * @param {ProcessTextsParams} params - The parameters for the Gemini API call.
 * @param {number} [retries=0] - The current number of retries for the API call.
 * @returns {Promise<GeminiServiceResponse>} A promise that resolves with the response from the Gemini service.
 */
export class GeminiService {
  private ai: GoogleGenerativeAI | null = null;
  private config: AgentConfig;
  private apiKey: string;

  constructor(apiKey: string, config: AgentConfig) {
    this.apiKey = apiKey;
    this.config = config;
    if (apiKey) {
      this.ai = new GoogleGenerativeAI(apiKey);
    }
  }

  private ensureInitialized(): void {
    if (!this.ai) {
      throw new Error("لم يتم تعيين مفتاح Gemini API في ملف التكوين.");
    }
  }

  public async processTextsWithGemini(params: ProcessTextsParams, retries: number = 0): Promise<GeminiServiceResponse> {
    this.ensureInitialized();
    try {
      const model = this.ai!.getGenerativeModel({ model: this.config.model });
      const promptParts = constructPromptParts(params);

      const contents: Content[] = [{ role: "user", parts: promptParts }];

      const shouldExpectJson = TASKS_EXPECTING_JSON_RESPONSE.includes(params.taskType);

      const safetySettings: SafetySetting[] = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ];

      const result = await model.generateContent({
        contents,
        safetySettings,
        generationConfig: {
          temperature: this.config.temperature,
          topK: this.config.topK,
          topP: this.config.topP,
          maxOutputTokens: this.config.maxOutputTokens,
        }
      });

    const response: GenerateContentResponse = result.response;

    if (!hasCandidates(response)) {
        return { error: "أرجع Gemini استجابة بدون مرشحين صالحين." };
    }

    const rawTextOutput = extractTextFromCandidates(response.candidates);

    if (!rawTextOutput) {
        const firstCandidate = response.candidates[0];
        if (firstCandidate && firstCandidate.finishReason !== "STOP") {
             return { error: ` أنهى Gemini المعالجة بسبب: ${firstCandidate.finishReason}. قد يكون المحتوى قد تم حظره أو انتهى بشكل غير متوقع.` };
        }
        return { error: "أرجع Gemini استجابة نصية فارغة." };
    }

    let jsonStr = rawTextOutput.trim();
    const fenceRegex = /^(?:\s*```(?:json)?\s*\n?)?([\s\S]*?)(?:\n?\s*```\s*)?$/s;
    const extractedJson = safeRegexMatchGroup(jsonStr, fenceRegex, 1);
    if (extractedJson) {
      jsonStr = extractedJson.trim();
    }

    if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
      try {
        const parsedData: GeminiTaskResultData = JSON.parse(jsonStr);
        return { data: parsedData, rawText: rawTextOutput };
      } catch (e) {
        const fixedJsonStr = attemptToFixJson(jsonStr);
        try {
            const parsedData: GeminiTaskResultData = JSON.parse(fixedJsonStr);
            return { data: parsedData, rawText: rawTextOutput };
        } catch (e2) {
            console.error("فشل في تحليل JSON حتى بعد محاولة الإصلاح:", e2, "\nالنص الأصلي:", rawTextOutput, "\nالنص الذي تمت محاولة إصلاحه:", fixedJsonStr);
            if (shouldExpectJson) {
                return { data: rawTextOutput, rawText: rawTextOutput, error: "تم استلام نص غير متوقع بدلاً من JSON. يتم عرض النص الخام." };
            }
            return { data: rawTextOutput, rawText: rawTextOutput };
        }
      }
    }

    if (shouldExpectJson) {
        return { data: rawTextOutput, rawText: rawTextOutput, error: "تم استلام نص غير متوقع بدلاً من JSON. يتم عرض النص الخام." };
    }

    return { data: rawTextOutput, rawText: rawTextOutput };

  } catch (e: unknown) {
    console.error(`خطأ في معالجة النصوص مع Gemini (محاولة ${retries}/${MAX_RETRIES}):`, e);

    const error = e as GeminiError & { status?: number; message?: string; toString?: () => string; response?: { error?: { message?: string } } };

    if (retries < MAX_RETRIES && (error.status && error.status >= 500 || (error.message && error.message.toLowerCase().includes("network error")) ) ) {
      console.log(`إعادة المحاولة (${retries + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      return this.processTextsWithGemini(params, retries + 1);
    }

    let errorMessage = error.message || "حدث خطأ غير معروف مع Gemini API.";
      if (error.toString && error.toString().toLowerCase().includes("api_key")) {
          errorMessage = "مفتاح Gemini API مفقود أو غير صالح. يرجى التأكد من تكوين متغير البيئة API_KEY بشكل صحيح.";
      } else if (error.message && error.message.toLowerCase().includes("request entity size is larger than limit")) {
        errorMessage = "حجم الملفات المرسلة أو حجم السياق الكلي يتجاوز الحد المسموح به من Gemini API. يرجى محاولة تقليل حجم الملفات أو عددها، أو تقصير نطاق الاستكمال إذا كنت تستخدم الاستكمال التكراري.";
      } else if (error.message && (error.message.toLowerCase().includes("unsupported mime type") || error.message.toLowerCase().includes("invalid_argument"))) {
        errorMessage = "واجهت Gemini API مشكلة في معالجة أحد أنواع الملفات المرفوعة أو محتواها. يرجى التحقق من أن الملفات هي من الأنواع المدعومة (نصوص، صور، PDF، DOCX بعد المعالجة) وأنها غير تالفة.";
      } else if (error.status && (error.status === 400 || error.status.toString() === 'INVALID_ARGUMENT')) {
          errorMessage = `خطأ في الطلب إلى Gemini API (قد يكون بسبب محتوى غير متوقع أو تنسيق خاطئ): ${error.message || 'وسيطات غير صالحة.'}`;
      } else if (error.status && error.status >= 500) {
          errorMessage = `واجه خادم Gemini API مشكلة (خطأ ${error.status}). يرجى المحاولة مرة أخرى لاحقًا. ${error.message || ''}`;
      }

      if (error.response && error.response.error && error.response.error.message) {
          errorMessage = `خطأ من Gemini API: ${error.response.error.message}`;
      } else if (error.message && error.message.includes("content") && error.message.includes("blocked")) {
          errorMessage = `تم حظر المحتوى بواسطة Gemini API بسبب سياسات الأمان. ${error.message}`;
      }

      return { error: errorMessage };
    }
  }
}