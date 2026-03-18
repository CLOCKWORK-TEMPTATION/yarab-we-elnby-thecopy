/**
 * خدمة Gemini للذكاء الاصطناعي
 * 
 * @description
 * توفر واجهة للتواصل مع Google Gemini AI لتحليل السيناريوهات
 * وتوليد الميزانيات وتقديم التوصيات المهنية
 * 
 * السبب: تُمكّن المستخدم من الحصول على ميزانيات احترافية
 * بناءً على تحليل ذكي للسيناريو دون خبرة سابقة
 */

import { GoogleGenAI } from '@google/genai';
import { 
  Budget, 
  AIAnalysis, 
  Section, 
  Category, 
  LineItem,
  BudgetSchema,
  AIAnalysisSchema 
} from './types';

/**
 * خطأ API من Gemini
 */
interface GeminiApiError extends Error {
  message: string;
  code?: string;
}

/**
 * خدمة Gemini لتحليل السيناريوهات وتوليد الميزانيات
 * 
 * @description
 * تستخدم نموذج Gemini 2.0 Flash لتقديم تحليلات
 * إنتاجية متقدمة وميزانيات دقيقة
 */
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private model = 'gemini-2.0-flash-exp';

  /**
   * مُنشئ الخدمة
   * 
   * @description
   * يُهيئ الاتصال بـ Gemini API باستخدام مفتاح API
   * من متغيرات البيئة
   */
  constructor() {
    const apiKey = process.env.VITE_GEMINI_API_KEY || 
                   process.env.GEMINI_API_KEY || 
                   process.env.API_KEY || 
                   process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * توليد ميزانية من السيناريو
   * 
   * @description
   * يحلل نص السيناريو ويُنشئ ميزانية مفصلة
   * باستخدام قالب الميزانية المُقدم
   * 
   * السبب: أتمتة عملية تقدير التكاليف التي تتطلب
   * عادةً خبرة سنوات في الإنتاج السينمائي
   * 
   * @param scriptContent - نص السيناريو
   * @param template - قالب الميزانية الأساسي
   * @returns ميزانية مُولّدة
   * @throws خطأ إذا فشل التوليد
   */
  async generateBudgetFromScript(scriptContent: string, template: Budget): Promise<Budget> {
    if (!this.ai) {
      throw new Error("مفتاح Gemini API غير موجود. يرجى إعداد GEMINI_API_KEY في ملف .env");
    }

    const prompt = this.buildBudgetPrompt(scriptContent, template);

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 8192,
        }
      });

      const text = response.text();
      if (!text) throw new Error("لم يتم استلام استجابة من الذكاء الاصطناعي");

      const cleanedText = this.cleanJsonResponse(text);

      try {
        const budget = JSON.parse(cleanedText) as Budget;
        return this.validateAndFixBudget(budget);
      } catch (parseError: unknown) {
        // تسجيل الخطأ الأصلي للتصحيح مع الحفاظ على رسالة واضحة للمستخدم
        const errorDetails = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        throw new Error(`استجابة الذكاء الاصطناعي ليست JSON صالحة (${errorDetails}). يرجى المحاولة مرة أخرى.`);
      }
    } catch (error: unknown) {
      throw this.handleApiError(error);
    }
  }

  /**
   * تحليل السيناريو
   * 
   * @description
   * يُجري تحليلاً شاملاً للسيناريو لتحديد
   * المتطلبات الإنتاجية والمخاطر وفرص التوفير
   * 
   * السبب: يوفر رؤى استراتيجية تُساعد في
   * التخطيط الأمثل للإنتاج
   * 
   * @param scriptContent - نص السيناريو
   * @returns تحليل شامل للإنتاج
   */
  async analyzeScript(scriptContent: string): Promise<AIAnalysis> {
    if (!this.ai) {
      throw new Error("مفتاح Gemini API غير موجود");
    }

    const prompt = `
      You are a veteran Film Production Analyst and Line Producer with expertise in production planning and budgeting.
      
      COMPREHENSIVE SCRIPT ANALYSIS:
      Perform an in-depth analysis of this script for production planning purposes.
      
      SCRIPT:
      ${scriptContent.substring(0, 15000)}
      
      ANALYSIS FRAMEWORK:
      
      1. PRODUCTION SUMMARY:
         - Genre and tone identification
         - Production scale assessment
         - Key production challenges
         - Unique requirements or concerns
         - Estimated crew size needed
         - Equipment tier recommendation
      
      2. DETAILED RECOMMENDATIONS:
         - Optimal shooting schedule structure
         - Location scouting priorities
         - Casting strategy suggestions
         - Equipment package recommendations
         - Post-production workflow advice
         - Budget allocation priorities
         - Cost-saving strategies without compromising quality
      
      3. RISK FACTORS IDENTIFICATION:
         - Weather-dependent scenes
         - Complex stunt sequences
         - VFX-heavy scenes
         - Difficult locations
         - Large crowd scenes
         - Animal or child actors
         - Night shoots or underwater work
         - Permit or legal concerns
         - Time-sensitive elements
      
      4. COST OPTIMIZATION OPPORTUNITIES:
         - Location bundling possibilities
         - Schedule efficiency improvements
         - Equipment sharing opportunities
         - Crew multi-tasking potential
         - VFX vs practical effects analysis
         - Stock footage usage possibilities
         - Regional tax incentive opportunities
         - Co-production or partnership options
      
      5. SHOOTING SCHEDULE ESTIMATION:
         - Count total scenes from script
         - Estimate pages per day (2-5 based on complexity)
         - Calculate total shooting days
         - Recommend prep period (2-4 weeks)
         - Estimate post-production timeline
         - Suggest rehearsal time needed
      
      Return ONLY a JSON object with this exact structure:
      {
        "summary": "Detailed 3-4 sentence production overview including genre, scale, key challenges, and opportunities",
        "recommendations": [
          "Specific actionable recommendation 1",
          "Specific actionable recommendation 2",
          "Specific actionable recommendation 3",
          "Specific actionable recommendation 4",
          "Specific actionable recommendation 5"
        ],
        "riskFactors": [
          "Identified risk factor 1 with mitigation",
          "Identified risk factor 2 with mitigation",
          "Identified risk factor 3 with mitigation",
          "Identified risk factor 4 with mitigation"
        ],
        "costOptimization": [
          "Cost optimization strategy 1",
          "Cost optimization strategy 2",
          "Cost optimization strategy 3",
          "Cost optimization strategy 4",
          "Cost optimization strategy 5"
        ],
        "shootingSchedule": {
          "totalDays": 25,
          "phases": {
            "preProduction": 20,
            "production": 25,
            "postProduction": 45
          }
        }
      }
    `;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        topP: 0.85,
      }
    });

    try {
      const result = JSON.parse(this.cleanJsonResponse(response.text() || '{}')) as AIAnalysis;
      return result;
    } catch (parseError: unknown) {
      const errorDetails = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      throw new Error(`فشل في تحليل استجابة الذكاء الاصطناعي (${errorDetails}). يرجى المحاولة مرة أخرى.`);
    }
  }

  /**
   * بناء موجه توليد الميزانية
   * 
   * @description
   * يُنشئ النص التوجيهي التفصيلي لنموذج الذكاء الاصطناعي
   * 
   * @param scriptContent - نص السيناريو
   * @param template - قالب الميزانية
   * @returns النص التوجيهي
   */
  private buildBudgetPrompt(scriptContent: string, template: Budget): string {
    return `
      You are a world-class Film Line Producer with 30+ years of experience in feature films, commercials, and international productions.
      
      ADVANCED SCRIPT ANALYSIS TASK:
      Analyze the following movie script and generate an extremely detailed, industry-standard budget breakdown.
      
      SCRIPT CONTENT:
      ${scriptContent.substring(0, 30000)}
      
      COMPREHENSIVE ANALYSIS FRAMEWORK:
      
      1. PRODUCTION SCALE DETECTION:
         - Identify production type (indie, mid-budget, studio)
         - Estimate optimal crew size based on scenes
         - Calculate shooting days from scene count and complexity
         - Determine equipment tier needed
      
      2. LOCATION ANALYSIS:
         - Count unique locations mentioned
         - Categorize locations (studio, practical, outdoor)
         - Estimate permit costs and location fees
         - Factor in travel and logistics
      
      3. CAST REQUIREMENTS:
         - Count speaking roles (lead, supporting, day players)
         - Estimate background actors per scene
         - Calculate stunt requirements and coordinators
         - Include casting costs
      
      4. TECHNICAL REQUIREMENTS:
         - Identify camera packages needed (cinema, DSLR, specialty)
         - Assess lighting requirements per location
         - Determine sound equipment needs
         - Calculate grip and electric crew size
      
      5. SPECIAL ELEMENTS:
         - VFX shots estimation from script
         - Practical effects and special makeup
         - Vehicle and animal coordination
         - Stunt choreography complexity
      
      6. POST-PRODUCTION SCOPE:
         - Editing timeline based on footage ratio
         - Color grading complexity
         - Sound design and mixing requirements
         - Music composition vs licensing
         - VFX rendering and compositing time
      
      BUDGETING METHODOLOGY (2026 RATES):
      
      ABOVE THE LINE:
      - Director: $50K-$500K (based on scale)
      - Producers: 4-6% of budget
      - Cast: SAG-AFTRA or non-union rates
      - Writers: WGA or independent rates
      
      PRODUCTION:
      - Crew rates: Union scale or market rate
      - Equipment: Tier 1 ($5K/day), Tier 2 ($2K/day), Tier 3 ($500/day)
      - Locations: $500-$5000/day per location
      - Transportation: Based on crew size and locations
      
      POST-PRODUCTION:
      - Editing: $200-$500/day for editor
      - VFX: $500-$2000 per shot
      - Sound mix: $300-$800/day
      - Color: $400-$1200/day
      - Music: $5K-$100K based on needs
      
      INTELLIGENT ESTIMATION RULES:
      - Auto-scale crew size to production scope
      - Match equipment to production value
      - Factor regional cost variations
      - Include prep and wrap time (20% of shooting days)
      - Add insurance (2-3% of budget)
      - Include contingency (10-15% per section)
      - Calculate fringes and taxes (20-35%)
      
      QUALITY CHECKS:
      1. Verify all amounts are realistic market rates
      2. Ensure ratios are correct (e.g., crew to shoot days)
      3. Cross-check similar productions benchmarks
      4. Validate equipment matches production needs
      5. Confirm post timeline is achievable
      
      OUTPUT REQUIREMENTS:
      1. Return ONLY valid JSON, no markdown or explanatory text
      2. Maintain exact template structure
      3. All numbers must be positive integers or zero
      4. Calculate: total = amount × rate (verify accuracy)
      5. Sum all totals correctly to grandTotal
      6. Fill metadata with extracted script information
      
      BUDGET TEMPLATE TO POPULATE:
      ${JSON.stringify(template, null, 2)}
      
      Generate a professional, accurate, and comprehensive budget based on deep script analysis.
    `;
  }

  /**
   * تنظيف استجابة JSON
   * 
   * @description
   * يُزيل أي نص إضافي حول بيانات JSON
   * 
   * @param text - النص الخام
   * @returns نص JSON نظيف
   */
  private cleanJsonResponse(text: string): string {
    return text
      .trim()
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '')
      .replace(/\n/g, '')
      .replace(/\s{2,}/g, ' ');
  }

  /**
   * التحقق من صحة الميزانية وإصلاحها
   * 
   * @description
   * يتحقق من بنية الميزانية ويُصلح أي
   * حسابات خاطئة في المجاميع
   * 
   * @param budget - الميزانية للتحقق منها
   * @returns الميزانية المُصححة
   */
  private validateAndFixBudget(budget: Budget): Budget {
    if (!budget.sections || !Array.isArray(budget.sections)) {
      throw new Error("بنية الميزانية غير صالحة: الأقسام مفقودة");
    }

    let calculatedGrandTotal = 0;

    budget.sections.forEach((section: Section) => {
      let sectionTotal = 0;

      section.categories.forEach((category: Category) => {
        let categoryTotal = 0;

        category.items.forEach((item: LineItem) => {
          item.amount = Number(item.amount) || 0;
          item.rate = Number(item.rate) || 0;
          item.total = item.amount * item.rate;
          categoryTotal += item.total;
        });

        category.total = categoryTotal;
        sectionTotal += categoryTotal;
      });

      section.total = sectionTotal;
      calculatedGrandTotal += sectionTotal;
    });

    budget.grandTotal = calculatedGrandTotal;
    return budget;
  }

  /**
   * معالجة أخطاء API
   * 
   * @description
   * يُحوّل أخطاء API إلى رسائل مفهومة للمستخدم
   * 
   * @param error - الخطأ الأصلي
   * @returns خطأ مع رسالة واضحة
   */
  private handleApiError(error: unknown): Error {
    const apiError = error as GeminiApiError;
    const message = apiError.message || '';
    
    if (message.includes('API key')) {
      return new Error("مفتاح API غير صالح. يرجى التحقق من إعدادات Gemini API.");
    } else if (message.includes('quota')) {
      return new Error("تم تجاوز حصة API. يرجى المحاولة لاحقاً أو التحقق من الفواتير.");
    } else if (message.includes('permission')) {
      return new Error("رُفض إذن API. يرجى التأكد من صلاحيات مفتاح Gemini.");
    } else {
      return new Error(`فشل توليد الميزانية: ${message || 'حدث خطأ غير معروف'}`);
    }
  }

  /**
   * التحقق من بنية الميزانية
   * 
   * @description
   * يفحص صحة بنية كائن الميزانية
   * 
   * @param budget - الميزانية للفحص
   * @returns نتيجة الفحص مع قائمة الأخطاء
   */
  validateBudgetStructure(budget: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!budget || typeof budget !== 'object') {
      errors.push('الميزانية ليست كائناً صالحاً');
      return { isValid: false, errors };
    }

    const budgetObj = budget as Record<string, unknown>;

    if (!Array.isArray(budgetObj.sections)) {
      errors.push('أقسام الميزانية ليست مصفوفة');
    } else {
      (budgetObj.sections as Record<string, unknown>[]).forEach(
        (section: Record<string, unknown>, sectionIndex: number) => {
          if (!section.categories || !Array.isArray(section.categories)) {
            errors.push(`القسم ${sectionIndex}: الفئات ليست مصفوفة`);
          }
        }
      );
    }

    if (typeof budgetObj.grandTotal !== 'number') {
      errors.push('المجموع الكلي ليس رقماً');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * مقارنة ميزانيتين
   * 
   * @description
   * يُجري مقارنة تفصيلية بين ميزانيتين
   * لتحديد الفروقات والتوصيات
   * 
   * @param budget1 - الميزانية الأولى
   * @param budget2 - الميزانية الثانية
   * @returns تقرير المقارنة
   */
  async compareBudgets(budget1: Budget, budget2: Budget): Promise<Record<string, unknown>> {
    if (!this.ai) {
      throw new Error("مفتاح Gemini API غير موجود");
    }

    const prompt = `
      You are an expert film production budget analyst. Compare these two film budgets comprehensively.
      
      Budget 1: ${JSON.stringify(budget1.metadata || {}, null, 2)}
      Grand Total 1: $${budget1.grandTotal.toLocaleString()}
      
      Budget 2: ${JSON.stringify(budget2.metadata || {}, null, 2)}
      Grand Total 2: $${budget2.grandTotal.toLocaleString()}
      
      DETAILED COMPARISON ANALYSIS:
      
      1. COST DIFFERENCES:
         - Identify major cost variations per category
         - Calculate percentage differences
         - Highlight significant variances (>15%)
      
      2. EFFICIENCY ANALYSIS:
         - Which budget is more cost-effective?
         - Are there areas of over-spending?
         - Are there under-budgeted items?
      
      3. RECOMMENDATIONS:
         - How to optimize the higher budget
         - What the lower budget might be missing
         - Best practices from both
         - Ideal middle-ground approach
      
      4. RISK ASSESSMENT:
         - Which budget has better contingency planning?
         - Identify potential cost overruns
         - Safety margin analysis
      
      Return JSON with structure:
      {
        "totalDifference": 150000,
        "percentageDifference": 15.5,
        "differences": [
          {
            "category": "Production Staff",
            "budget1": 144375,
            "budget2": 180000,
            "difference": 35625,
            "percentage": 24.7,
            "analysis": "Budget 2 allocates more for experienced crew"
          }
        ],
        "recommendations": [
          "Consider hiring mid-level rather than senior staff to save 20%",
          "Budget 1's equipment package seems insufficient for scope"
        ],
        "efficiencyScore": {
          "budget1": 8.5,
          "budget2": 7.2
        },
        "summary": "Comprehensive comparison summary with key insights"
      }
    `;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    return JSON.parse(this.cleanJsonResponse(response.text() || '{}')) as Record<string, unknown>;
  }

  /**
   * تحسين الميزانية
   * 
   * @description
   * يُقدم اقتراحات لتقليل التكاليف
   * مع الحفاظ على جودة الإنتاج
   * 
   * @param budget - الميزانية الحالية
   * @param targetReduction - مبلغ التخفيض المستهدف
   * @returns خطة التحسين
   */
  async optimizeBudget(budget: Budget, targetReduction: number): Promise<Record<string, unknown>> {
    if (!this.ai) {
      throw new Error("مفتاح Gemini API غير موجود");
    }

    const prompt = `
      You are a film production budget optimization expert. 
      
      Current Budget: $${budget.grandTotal.toLocaleString()}
      Target Reduction: $${targetReduction.toLocaleString()} (${((targetReduction / budget.grandTotal) * 100).toFixed(1)}%)
      
      OPTIMIZATION TASK:
      Analyze the budget and suggest specific cost reductions to meet the target WITHOUT compromising production quality.
      
      OPTIMIZATION STRATEGIES:
      1. Equipment: Rent vs buy, package deals, tier alternatives
      2. Crew: Multi-role staff, efficient scheduling
      3. Locations: Bundling, studio vs practical
      4. Post-production: Timeline optimization, batch processing
      5. Talent: Negotiation strategies, deferred payments
      6. Schedule: Reducing shoot days through efficiency
      
      CONSTRAINTS:
      - Maintain production quality standards
      - Don't compromise safety or legal requirements
      - Keep creative vision intact
      - Realistic and actionable suggestions
      
      Return JSON:
      {
        "recommendations": [
          {
            "category": "Camera Equipment",
            "currentCost": 48125,
            "proposedCost": 35000,
            "savings": 13125,
            "strategy": "Rent cinema package monthly instead of weekly",
            "impact": "Low - same quality, longer term commitment"
          }
        ],
        "totalSavings": 150000,
        "feasibilityScore": 8.5,
        "riskLevel": "low",
        "summary": "Overall optimization strategy summary"
      }
    `;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    return JSON.parse(this.cleanJsonResponse(response.text() || '{}')) as Record<string, unknown>;
  }
}

/** مثيل خدمة Gemini المُشترك */
export const geminiService = new GeminiService();

/**
 * توليد ميزانية من السيناريو (للتوافق مع الإصدارات السابقة)
 */
export const generateBudgetFromScript = async (
  scriptContent: string, 
  template: Budget
): Promise<Budget> => {
  return geminiService.generateBudgetFromScript(scriptContent, template);
};

/**
 * التحقق من بنية الميزانية (للتوافق مع الإصدارات السابقة)
 */
export const validateBudgetStructure = (
  budget: unknown
): { isValid: boolean; errors: string[] } => {
  return geminiService.validateBudgetStructure(budget);
};

export { geminiService as default };
