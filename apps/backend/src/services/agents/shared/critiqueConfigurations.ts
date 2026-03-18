/**
 * Specialized Critique Configurations
 * معايير نقد متخصصة لكل نوع من أنواع الوكلاء
 */

import { TaskType } from "@core/types";
import {
  CritiqueConfiguration,
  CritiqueDimension
} from "./critiqueTypes";

// Re-export types for convenience
export type {
  CritiqueConfiguration,
  CritiqueDimension,
  CritiqueRequest,
  CritiqueContext,
  EnhancedCritiqueResult,
  DimensionScore
} from "./critiqueTypes";

/**
 * معايير تقييم موحدة - يمكن إعادة استخدامها
 */
const COMMON_DIMENSIONS: Record<string, CritiqueDimension> = {
  accuracy: {
    name: "الدقة المعلوماتية",
    description: "مدى التزام التحليل بمعلومات النص الأصلي فقط",
    weight: 0.25,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "التزام تام بالنص، لا ادعاءات خارجية",
        indicators: [
          "كل تحليل مدعوم بأدلة من النص",
          "لا توجد معلومات غير مذكورة",
          "رؤية دقيقة للتفاصيل"
        ]
      },
      {
        level: "good",
        score: 0.8,
        description: "التزام جيد بالنص مع ادعاءات محدودة",
        indicators: [
          "معظم التحليل مدعوم",
          "ادعاءات قليلة خارج النص"
        ]
      },
      {
        level: "satisfactory",
        score: 0.6,
        description: "التزام مقبول مع بعض الانحرافات",
        indicators: ["بعض الانحراف عن النص", "ادعاءات معقولة"]
      },
      {
        level: "needs_improvement",
        score: 0.4,
        description: "انحرافات واضحة عن النص",
        indicators: ["ادعاءات كثيرة غير مدعومة", "تحليلات خيالية"]
      },
      {
        level: "poor",
        score: 0.2,
        description: "لا التزام بالنص",
        indicators: ["تحليل كامل من الخيال", "معلومات خاطئة"]
      }
    ]
  },

  clarity: {
    name: "الوضوح والتنظيم",
    description: "وضوح العرض وتنظيم الأفكار",
    weight: 0.2,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "بنية واضحة تماماً وأفكار مترابطة",
        indicators: [
          "مقدمة واضحة",
          "تسلسل منطقي",
          "خلاصة مركزة"
        ]
      },
      {
        level: "good",
        score: 0.8,
        description: "بنية جيدة مع بعض القفزات",
        indicators: ["تسلسل جيد", "ربط جيد"]
      },
      {
        level: "satisfactory",
        score: 0.6,
        description: "تنظيم مقبول",
        indicators: ["بعض الفوضى", "أفكار مفككة"]
      },
      {
        level: "needs_improvement",
        score: 0.4,
        description: "تنظيم ضعيف",
        indicators: ["فوضى واضحة", "أفكار مبعثرة"]
      },
      {
        level: "poor",
        score: 0.2,
        description: "لا تنظيم",
        indicators: ["فوضى كاملة", "صعوبة المتابعة"]
      }
    ]
  },

  depth: {
    name: "العمق التحليلي",
    description: "عمق التحليل واستنتاج الرؤى",
    weight: 0.3,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "تحليل عميق يكشف عن جوانب خفية",
        indicators: [
          "استنتاجات ذكية",
          "رؤى أصيلة",
          "تحليل متعدد المستويات"
        ]
      },
      {
        level: "good",
        score: 0.8,
        description: "تحليل جيد مع رؤى قيمة",
        indicators: ["استنتاجات سليمة", "رؤى مفيدة"]
      },
      {
        level: "satisfactory",
        score: 0.6,
        description: "تحليل سطحي مقبول",
        indicators: ["ملاحظات عامة", "رؤي محدودة"]
      },
      {
        level: "needs_improvement",
        score: 0.4,
        description: "تحليل سطحي جداً",
        indicators: ["وصف فقط", "لا استنتاجات"]
      },
      {
        level: "poor",
        score: 0.2,
        description: "لا تحليل",
        indicators: ["تلخيص فقط", "لا قيمة مضافة"]
      }
    ]
  }
};

/**
 * معايير خاصة بتحليل الشخصية
 */
const CHARACTER_ANALYSIS_DIMENSIONS: CritiqueDimension[] = [
  COMMON_DIMENSIONS.accuracy!,
  {
    name: "العمق النفسي",
    description: "قدرة التحليل على فهم دوافع الشخصية الباطنة",
    weight: 0.3,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "تحليل نفسي عميق يكشف التناقضات الداخلية والدوافع الخفية",
        indicators: [
          "فهم الدوافع غير الظاهرة",
          "تحليل التناقضات الداخلية",
          "ربط السلوك بالخلفية النفسية",
          "استنتاج التطور الشخصي"
        ]
      },
      {
        level: "good",
        score: 0.75,
        description: "تحليل نفسي جيد يفهم معظم الدوافع",
        indicators: [
          "فهم جيد للدوافع",
          "تحليل التناقضات الظاهرة",
          "ربط بالخلفية"
        ]
      },
      {
        level: "satisfactory",
        score: 0.5,
        description: "تحليل نفسي سطحي",
        indicators: [
          "ملاحظات سطحية",
          "دوافع واضحة فقط",
          "لا عمق نفسي"
        ]
      },
      {
        level: "needs_improvement",
        score: 0.25,
        description: "تحليل نفسي ضعيف",
        indicators: [
          "وصف السلوك فقط",
          "لا فهم للدوافع",
          "تحليل سطحي جداً"
        ]
      },
      {
        level: "poor",
        score: 0.1,
        description: "لا تحليل نفسي",
        indicators: [
          "وصف خارجي فقط",
          "أحكام غير مدعومة"
        ]
      }
    ]
  },
  {
    name: "التناسق السلوكي",
    description: "قدرة التحليل على تتبع التناسق في سلوك الشخصية",
    weight: 0.25,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "تتبع دقيق للتناسق/التناقض السلوكي عبر المشاهد",
        indicators: [
          "تتبع التطور الزمني",
          "كشف التناقضات المهمة",
          "تفسير التغيرات السلوكية"
        ]
      },
      {
        level: "good",
        score: 0.75,
        description: "تتبع جيد للتناسق السلوكي",
        indicators: ["ملاحظة التغيرات", "كشف بعض التناقضات"]
      },
      {
        level: "satisfactory",
        score: 0.5,
        description: "تتبع مقبول",
        indicators: ["ملاحظة عامة", "تفاصيل قليلة"]
      },
      {
        level: "needs_improvement",
        score: 0.25,
        description: "تتبع ضعيف",
        indicators: ["إغفال التغيرات", "لا تتبع زمني"]
      },
      {
        level: "poor",
        score: 0.1,
        description: "لا تتبع",
        indicators: ["وصف منفصل", "لا ربط زمني"]
      }
    ]
  },
  {
    name: "العلاقات الشخصية",
    description: "قدرة التحليل على فهم علاقات الشخصية بالآخرين",
    weight: 0.2,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "تحليل متعمق للعلاقات وتأثيرها على الشخصية",
        indicators: [
          "تحليل ديناميكيات العلاقات",
          "فهم التأثير المتبادل",
          "ربط العلاقات بالتطور الشخصي"
        ]
      },
      {
        level: "good",
        score: 0.75,
        description: "تحليل جيد للعلاقات",
        indicators: ["ملاحظة العلاقات الرئيسية", "تحليل التأثير"]
      },
      {
        level: "satisfactory",
        score: 0.5,
        description: "تحليل مقبول",
        indicators: ["ذكر العلاقات", "تحليل سطحي"]
      },
      {
        level: "needs_improvement",
        score: 0.25,
        description: "تحليل ضعيف",
        indicators: ["قائمة أسماء فقط", "لا تحليل"]
      },
      {
        level: "poor",
        score: 0.1,
        description: "لا تحليل",
        indicators: ["إغفال العلاقات", "تركيز على الشخصية فقط"]
      }
    ]
  }
];

/**
 * معايير خاصة بتحليل الحوار
 */
const DIALOGUE_ANALYSIS_DIMENSIONS: CritiqueDimension[] = [
  COMMON_DIMENSIONS.accuracy!,
  {
    name: "تمييز الأصوات",
    description: "قدرة التحليل على التمييز بين أصوات الشخصيات المختلفة",
    weight: 0.3,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "تمييز دقيق لكل صوت شخصية مع تحديد الخصائص الفريدة",
        indicators: [
          "تحديد خصائص كل صوت",
          "الكشف عن الاختلافات الدقيقة",
          "فهم الهدف وراء كل أسلوب"
        ]
      },
      {
        level: "good",
        score: 0.75,
        description: "تمييز جيد لمعظم الأصوات",
        indicators: ["تمييز واضح", "خصائص أساسية"]
      },
      {
        level: "satisfactory",
        score: 0.5,
        description: "تمييز مقبول",
        indicators: ["بعض التمييز", "اختلاط في الأصوات"]
      },
      {
        level: "needs_improvement",
        score: 0.25,
        description: "تمييز ضعيف",
        indicators: ["قليل من التمييز", "أصوات متشابهة"]
      },
      {
        level: "poor",
        score: 0.1,
        description: "لا تمييز",
        indicators: ["معاملة كل شخصية بنفس الأسلوب"]
      }
    ]
  },
  {
    name: "تحليل النص الفرعي",
    description: "قدرة التحليل على كشف ما وراء الأقوال (ما لا يُقال)",
    weight: 0.3,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "كشف متقن للمعاني الخفية والرسائل الضمنية",
        indicators: [
          "فهم المقاصد الخفية",
          "تحليل الصمت والحذف",
          "كشف التوترات غير المعلنة"
        ]
      },
      {
        level: "good",
        score: 0.75,
        description: "كشف جيد للمعاني الضمنية",
        indicators: ["ملاحظة الإشارات", "فهم بعض المعاني الخفية"]
      },
      {
        level: "satisfactory",
        score: 0.5,
        description: "كشف محدود",
        indicators: ["ملاحظات سطحية", "تركيز على الظاهر"]
      },
      {
        level: "needs_improvement",
        score: 0.25,
        description: "كشف ضعيف",
        indicators: ["إغفال النص الفرعي", "حرفية التفسير"]
      },
      {
        level: "poor",
        score: 0.1,
        description: "لا كشف",
        indicators: ["تفسير حرفي فقط", "إغفال المعاني الضمنية"]
      }
    ]
  },
  {
    name: "الطبيعية والواقعية",
    description: "تقييم مدى واقعية الحوار وجاذبيته",
    weight: 0.2,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "تحليل متقن لجودة الحوار وواقعيته",
        indicators: [
          "تقييم التلقائية",
          "تحليل اللغة العامية",
          "ملاحظة التفاصيل الواقعية"
        ]
      },
      {
        level: "good",
        score: 0.75,
        description: "تقييم جيد للحوار",
        indicators: ["ملاحظة الجودة", "تحليل واقعي"]
      },
      {
        level: "satisfactory",
        score: 0.5,
        description: "تقييم مقبول",
        indicators: ["ملاحظات عامة", "تحليل محدود"]
      },
      {
        level: "needs_improvement",
        score: 0.25,
        description: "تقييم ضعيف",
        indicators: ["إغفال الجودة", "تركيز على المحتوى فقط"]
      },
      {
        level: "poor",
        score: 0.1,
        description: "لا تقييم",
        indicators: ["لا اهتمام بالأسلوب"]
      }
    ]
  }
];

/**
 * معايير خاصة بتحليل الحبكة
 */
const PLOT_ANALYSIS_DIMENSIONS: CritiqueDimension[] = [
  COMMON_DIMENSIONS.accuracy!,
  {
    name: "تحليل السببية",
    description: "قدرة التحليل على تتبع علاقات السبب والنتيجة",
    weight: 0.3,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "تحليل دقيق للعلاقات السببية المعقدة",
        indicators: [
          "تتبع السلاسل السببية",
          "كشف الأسباب الخفية",
          "تحليل النتائج غير المباشرة"
        ]
      },
      {
        level: "good",
        score: 0.75,
        description: "تحليل جيد للسببية",
        indicators: ["تتبع واضح", "فهم العلاقات"]
      },
      {
        level: "satisfactory",
        score: 0.5,
        description: "تحليل مقبول",
        indicators: ["بعض التتبع", "علاقات واضحة فقط"]
      },
      {
        level: "needs_improvement",
        score: 0.25,
        description: "تحليل ضعيف",
        indicators: ["تتبع محدود", "إغفال السببية"]
      },
      {
        level: "poor",
        score: 0.1,
        description: "لا تحليل",
        indicators: ["وصف الأحداث فقط"]
      }
    ]
  },
  {
    name: "تحليل الإيقاع",
    description: "قدرة التحليل على تقييم إيقاع السرد وتنوعه",
    weight: 0.25,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "تحليل متقن للإيقاع وتأثيره الدرامي",
        indicators: [
          "تتبع تغيرات الإيقاع",
          "تحليل التوتر والاسترخاء",
          "فهم التنوع الإيقاعي"
        ]
      },
      {
        level: "good",
        score: 0.75,
        description: "تحليل جيد للإيقاع",
        indicators: ["ملاحظة التغيرات", "فهم التأثير"]
      },
      {
        level: "satisfactory",
        score: 0.5,
        description: "تحليل مقبول",
        indicators: ["ملاحظات عامة", "تحليل محدود"]
      },
      {
        level: "needs_improvement",
        score: 0.25,
        description: "تحليل ضعيف",
        indicators: ["إغفال الإيقاع", "تركيز على الأحداث"]
      },
      {
        level: "poor",
        score: 0.1,
        description: "لا تحليل",
        indicators: ["لا اهتمام بالإيقاع"]
      }
    ]
  },
  {
    name: "تحليل البنية السردية",
    description: "قدرة التحليل على فهم البنية العامة للحبكة",
    weight: 0.25,
    rubric: [
      {
        level: "excellent",
        score: 1.0,
        description: "تحليل عميق للبنية السردية",
        indicators: [
          "تحديد البنية",
          "فهم الفصول",
          "تحليل الذروة والنهاية"
        ]
      },
      {
        level: "good",
        score: 0.75,
        description: "تحليل جيد للبنية",
        indicators: ["تحديد واضح", "فهم جيد"]
      },
      {
        level: "satisfactory",
        score: 0.5,
        description: "تحليل مقبول",
        indicators: ["بعض الفهم", "تفاصيل محدودة"]
      },
      {
        level: "needs_improvement",
        score: 0.25,
        description: "تحليل ضعيف",
        indicators: ["فهم محدود", "إغفال البنية"]
      },
      {
        level: "poor",
        score: 0.1,
        description: "لا تحليل",
        indicators: ["لا فهم للبنية"]
      }
    ]
  }
];

/**
 * تكوينات النقد لكل نوع وكيل
 */
export const CRITIQUE_CONFIGURATIONS: Map<TaskType, CritiqueConfiguration> =
  new Map([
    // وكلاء تحليل الشخصية
    [
      TaskType.CHARACTER_DEEP_ANALYZER,
      {
        agentType: TaskType.CHARACTER_DEEP_ANALYZER,
        agentName: "محلل الشخصية العميق",
        category: "advanced",
        dimensions: CHARACTER_ANALYSIS_DIMENSIONS,
        thresholds: {
          excellent: 0.85,
          good: 0.7,
          satisfactory: 0.55,
          needsImprovement: 0.4
        },
        maxIterations: 3,
        enableAutoCorrection: true
      }
    ],
    [
      TaskType.CHARACTER_NETWORK,
      {
        agentType: TaskType.CHARACTER_NETWORK,
        agentName: "محلل شبكة الشخصيات",
        category: "analysis",
        dimensions: [
          COMMON_DIMENSIONS.accuracy!,
          {
            name: "تحليل العلاقات",
            description: "قدرة التحليل على رسم خريطة العلاقات",
            weight: 0.35,
            rubric: [
              {
                level: "excellent",
                score: 1.0,
                description: "خريطة علاقات دقيقة وشاملة",
                indicators: [
                  "تحديد جميع العلاقات",
                  "تصنيف أنواع العلاقات",
                  "تحليل قوة كل علاقة"
                ]
              },
              {
                level: "good",
                score: 0.75,
                description: "خريطة علاقات جيدة",
                indicators: ["معظم العلاقات", "تصنيف واضح"]
              },
              {
                level: "satisfactory",
                score: 0.5,
                description: "خريطة مقبولة",
                indicators: ["العلاقات الرئيسية", "بعض التصنيف"]
              },
              {
                level: "needs_improvement",
                score: 0.25,
                description: "خريطة ضعيفة",
                indicators: ["علاقات قليلة", "لا تصنيف"]
              },
              {
                level: "poor",
                score: 0.1,
                description: "لا خريطة",
                indicators: ["قائمة أسماء فقط"]
              }
            ]
          },
          {
            name: "تحليل الديناميكيات",
            description: "فهم التغيرات في العلاقات",
            weight: 0.25,
            rubric: [
              {
                level: "excellent",
                score: 1.0,
                description: "تحليل متقن لتغيرات العلاقات",
                indicators: [
                  "تتبع التطور",
                  "فهم الأسباب",
                  "تحليل التأثير"
                ]
              },
              {
                level: "good",
                score: 0.75,
                description: "تحليل جيد للتغيرات",
                indicators: ["ملاحظة التغير", "فهم الأسباب"]
              },
              {
                level: "satisfactory",
                score: 0.5,
                description: "تحليل مقبول",
                indicators: ["بعض التغيرات", "تفسير محدود"]
              },
              {
                level: "needs_improvement",
                score: 0.25,
                description: "تحليل ضعيف",
                indicators: ["إغفال التغيرات", "وصف ثابت"]
              },
              {
                level: "poor",
                score: 0.1,
                description: "لا تحليل",
                indicators: ["وصف حالي فقط"]
              }
            ]
          },
          COMMON_DIMENSIONS.clarity!
        ],
        thresholds: {
          excellent: 0.85,
          good: 0.7,
          satisfactory: 0.55,
          needsImprovement: 0.4
        },
        maxIterations: 3,
        enableAutoCorrection: true
      }
    ],

    // وكلاء تحليل الحوار
    [
      TaskType.DIALOGUE_ADVANCED_ANALYZER,
      {
        agentType: TaskType.DIALOGUE_ADVANCED_ANALYZER,
        agentName: "محلل الحوار المتقدم",
        category: "advanced",
        dimensions: DIALOGUE_ANALYSIS_DIMENSIONS,
        thresholds: {
          excellent: 0.85,
          good: 0.7,
          satisfactory: 0.55,
          needsImprovement: 0.4
        },
        maxIterations: 3,
        enableAutoCorrection: true
      }
    ],
    [
      TaskType.DIALOGUE_FORENSICS,
      {
        agentType: TaskType.DIALOGUE_FORENSICS,
        agentName: "محلل الحوار الجنائي",
        category: "analysis",
        dimensions: DIALOGUE_ANALYSIS_DIMENSIONS,
        thresholds: {
          excellent: 0.8,
          good: 0.65,
          satisfactory: 0.5,
          needsImprovement: 0.35
        },
        maxIterations: 2,
        enableAutoCorrection: true
      }
    ],

    // وكلاء تحليل الحبكة
    [
      TaskType.PLOT_PREDICTOR,
      {
        agentType: TaskType.PLOT_PREDICTOR,
        agentName: "التنبؤ بالحبكة",
        category: "predictive",
        dimensions: PLOT_ANALYSIS_DIMENSIONS,
        thresholds: {
          excellent: 0.85,
          good: 0.7,
          satisfactory: 0.55,
          needsImprovement: 0.4
        },
        maxIterations: 3,
        enableAutoCorrection: true
      }
    ],
    [
      TaskType.CONFLICT_DYNAMICS,
      {
        agentType: TaskType.CONFLICT_DYNAMICS,
        agentName: "محلل ديناميكيات الصراع",
        category: "analysis",
        dimensions: [
          COMMON_DIMENSIONS.accuracy!,
          {
            name: "تحليل الصراع",
            description: "قدرة التحليل على فهم أنواع الصراعات",
            weight: 0.35,
            rubric: [
              {
                level: "excellent",
                score: 1.0,
                description: "تحليل شامل للصراعات",
                indicators: [
                  "تحديد جميع أنواع الصراع",
                  "تحليل تطور الصراع",
                  "فهم الأسباب والنتائج"
                ]
              },
              {
                level: "good",
                score: 0.75,
                description: "تحليل جيد للصراعات",
                indicators: ["أنواع واضحة", "تطور جيد"]
              },
              {
                level: "satisfactory",
                score: 0.5,
                description: "تحليل مقبول",
                indicators: ["صراعات رئيسية", "بعض التطور"]
              },
              {
                level: "needs_improvement",
                score: 0.25,
                description: "تحليل ضعيف",
                indicators: ["صراعات قليلة", "لا عمق"]
              },
              {
                level: "poor",
                score: 0.1,
                description: "لا تحليل",
                indicators: ["وصف الأحداث فقط"]
              }
            ]
          },
          {
            name: "تحليل التوتر",
            description: "فهم مستويات التوتر وتغيراتها",
            weight: 0.25,
            rubric: [
              {
                level: "excellent",
                score: 1.0,
                description: "تحليل دقيق للتوتر",
                indicators: [
                  "تتبع مستويات التوتر",
                  "فهم نقاط الذروة",
                  "تحليل الارتخاء"
                ]
              },
              {
                level: "good",
                score: 0.75,
                description: "تحليل جيد للتوتر",
                indicators: ["ملاحظة التغيرات", "نقاط واضحة"]
              },
              {
                level: "satisfactory",
                score: 0.5,
                description: "تحليل مقبول",
                indicators: ["بعض الملاحظات", "تفاصيل محدودة"]
              },
              {
                level: "needs_improvement",
                score: 0.25,
                description: "تحليل ضعيف",
                indicators: ["إغفال التوتر", "لا تتبع"]
              },
              {
                level: "poor",
                score: 0.1,
                description: "لا تحليل",
                indicators: ["لا اهتمام بالتوتر"]
              }
            ]
          },
          COMMON_DIMENSIONS.clarity!
        ],
        thresholds: {
          excellent: 0.85,
          good: 0.7,
          satisfactory: 0.55,
          needsImprovement: 0.4
        },
        maxIterations: 3,
        enableAutoCorrection: true
      }
    ],

    // التكوين الافتراضي للوكلاء الأخرى
    [
      TaskType.ANALYSIS,
      {
        agentType: TaskType.ANALYSIS,
        agentName: "التحليل الأساسي",
        category: "core",
        dimensions: [
          COMMON_DIMENSIONS.accuracy!,
          COMMON_DIMENSIONS.depth!,
          COMMON_DIMENSIONS.clarity!!
        ],
        thresholds: {
          excellent: 0.8,
          good: 0.65,
          satisfactory: 0.5,
          needsImprovement: 0.35
        },
        maxIterations: 2,
        enableAutoCorrection: true
      }
    ]
  ]);

/**
 * الحصول على تكوين النقد لنوع وكيل معين
 */
export function getCritiqueConfiguration(
  taskType: TaskType
): CritiqueConfiguration | null {
  // البحث المباشر
  if (CRITIQUE_CONFIGURATIONS.has(taskType)) {
    return CRITIQUE_CONFIGURATIONS.get(taskType)!;
  }

  // البحث عن تكوين افتراضي حسب الفئة
  const typeStr = taskType.toString().toLowerCase();

  if (
    typeStr.includes("character") ||
    typeStr.includes("شخصية")
  ) {
    return CRITIQUE_CONFIGURATIONS.get(
      TaskType.CHARACTER_DEEP_ANALYZER
    )!;
  }

  if (
    typeStr.includes("dialogue") ||
    typeStr.includes("حوار")
  ) {
    return CRITIQUE_CONFIGURATIONS.get(
      TaskType.DIALOGUE_ADVANCED_ANALYZER
    )!;
  }

  if (
    typeStr.includes("plot") ||
    typeStr.includes("حبكة") ||
    typeStr.includes("صراع")
  ) {
    return CRITIQUE_CONFIGURATIONS.get(TaskType.PLOT_PREDICTOR)!;
  }

  // التكوين الافتراضي
  return CRITIQUE_CONFIGURATIONS.get(TaskType.ANALYSIS)!;
}

/**
 * الحصول على جميع التكوينات
 */
export function getAllCritiqueConfigurations(): CritiqueConfiguration[] {
  return Array.from(CRITIQUE_CONFIGURATIONS.values());
}
