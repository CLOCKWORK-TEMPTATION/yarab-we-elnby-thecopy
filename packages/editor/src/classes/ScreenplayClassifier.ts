/**
 * @class ScreenplayClassifier
 * @description مصنف السيناريو - يحتوي على جميع الدوال والـ patterns لتصنيف أسطر السيناريو
 */
export type ClassifiedLine = {
  text: string;
  type: string; // 'scene-header-1' | 'scene-header-3' | 'character' | 'dialogue' | 'action' | 'transition' | 'parenthetical' | 'scene-header-2';
  confidence: number; // 0 to 1
};

export class ScreenplayClassifier {
  static readonly AR_AB_LETTER = "\u0600-\u06FF";
  static readonly EASTERN_DIGITS = "٠٢٣٤٥٦٧٨٩";
  static readonly WESTERN_DIGITS = "0123456789";
  static readonly ACTION_VERB_LIST =
    "يدخل|يخرج|ينظر|يرفع|تبتسم|ترقد|تقف|يبسم|يضع|يقول|تنظر|تربت|تقوم|يشق|تشق|تضرب|يسحب|يلتفت|يقف|يجلس|تجلس|يجري|تجري|يمشي|تمشي|يركض|تركض|يصرخ|اصرخ|يبكي|تبكي|يضحك|تضحك|يغني|تغني|يرقص|ترقص|يأكل|تأكل|يشرب|تشرب|ينام|تنام|يستيقظ|تستيقظ|يكتب|تكتب|يقرأ|تقرأ|يسمع|تسمع|يشم|تشم|يلمس|تلمس|يأخذ|تأخذ|يعطي|تعطي|يفتح|تفتح|يغلق|تغلق|يبدأ|تبدأ|ينتهي|تنتهي|يذهب|تذهب|يعود|تعود|يأتي|تأتي|يموت|تموت|يحيا|تحيا|يقاتل|تقاتل|ينصر|تنتصر|يخسر|تخسر|يكتب|تكتب|يرسم|ترسم|يصمم|تخطط|تخطط|يقرر|تقرر|يفكر|تفكر|يتذكر|تذكر|يحاول|تحاول|يستطيع|تستطيع|يريد|تريد|يحتاج|تحتاج|يبحث|تبحث|يجد|تجد|يفقد|تفقد|يحمي|تحمي|يحمي|تحمي|يراقب|تراقب|يخفي|تخفي|يكشف|تكشف|يكتشف|تكتشف|يعرف|تعرف|يتعلم|تعلن|يعلم|تعلن|يوجه|وجه|يسافر|تسافر|يعود|تعود|يرحل|ترحل|يبقى|تبقى|ينتقل|تنتقل|يتغير|تتغير|ينمو|تنمو|يتطور|تتطور|يواجه|تواجه|يحل|تحل|يفشل|تفشل|ينجح|تنجح|يحقق|تحقن|يبدأ|تبدأ|ينهي|تنهي|يوقف|توقف|يستمر|تستمر|ينقطع|تنقطع|يرتبط|ترتبط|ينفصل|تنفصل|يتزوج|تتزوج|يطلق|يطلق|يولد|تولد|يكبر|تكبر|يشيخ|تشيخ|يمرض|تمرض|يشفي|تشفي|يصاب|تصيب|يتعافى|تعافي|يموت|يقتل|تقتل|يُقتل|تُقتل|يختفي|تختفي|يظهر|تظهر|يختبئ|تخبوء|يطلب|تطلب|يأمر|تأمر|يمنع|تمنع|يسمح|تسمح|يوافق|توافق|يرفض|ترفض|يعتذر|تعتذر|يشكر|تشكر|يحيي|تحيي|يودع|تودع|يجيب|تجيب|يسأل|تسأل|يصيح|تصيح|يهمس|تهمس|يصمت|تصمت|يتكلم|تتكلم|ينادي|تنادي|يحكي|تحكي|يروي|تروي|يقص|تقص|يضحك|تضحك|يبكي|تبكي|يتنهد|تتنهد|يئن|تئن";

  static readonly ACTION_VERB_SET = new Set(
    ScreenplayClassifier.ACTION_VERB_LIST.split("|")
      .map((v) => v.trim())
      .filter(Boolean)
  );

  static isActionVerbStart(line: string): boolean {
    const firstToken = line.trim().split(/\s+/)[0] ?? "";
    const normalized = firstToken
      .replace(/[\u200E\u200F\u061C]/g, "")
      .replace(/[^\u0600-\u06FF]/g, "")
      .trim();
    return (
      normalized.length > 0 &&
      ScreenplayClassifier.ACTION_VERB_SET.has(normalized)
    );
  }

  static readonly BASMALA_RE = /^\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*$/i;
  static readonly SCENE_PREFIX_RE =
    /^\s*(?:مشهد|م\.)\s*([0-9]+)\s*(?:[-–—:،]\s*)?(.*)$/i;
  static readonly INOUT_PART = "(?:داخلي|خارجي|د\\.|خ\\.)";
  static readonly TIME_PART =
    "(?:ليل|نهار|ل\\.|ن\\.|صباح|مساء|فجر|ظهر|عصر|مغرب|الغروب|الفجر)";
  static readonly TL_REGEX = new RegExp(
    "(?:" +
    ScreenplayClassifier.INOUT_PART +
    "\\s*-?\\s*" +
    ScreenplayClassifier.TIME_PART +
    "\\s*|" +
    ScreenplayClassifier.TIME_PART +
    "\\s*-?\\s*" +
    ScreenplayClassifier.INOUT_PART +
    ")",
    "i"
  );
  static readonly CHARACTER_RE = new RegExp(
    "^\\s*(?:صوت\\s+)?[" +
    ScreenplayClassifier.AR_AB_LETTER +
    "][" +
    ScreenplayClassifier.AR_AB_LETTER +
    "\\s]{0,30}:?\\s*$"
  );
  static readonly TRANSITION_RE =
    /^\s*(?:قطع|قطع\s+إلى|إلى|مزج|ذوبان|خارج\s+المشهد|CUT TO:|FADE IN:|FADE OUT:)\s*$/i;
  static readonly PARENTHETICAL_SHAPE_RE = /^\s*\(.*?\)\s*$/;

  Patterns: {
    sceneHeader1: RegExp;
    sceneHeader2: {
      time: RegExp;
      inOut: RegExp;
    };
    sceneHeader3: RegExp;
  };

  constructor() {
    const c = (regex: RegExp) => regex;
    this.Patterns = {
      sceneHeader1: c(/^\s*مشهد\s*\d+\s*$/i),
      sceneHeader2: {
        time: /(ليل|نهار|صباح|مساء|فجر|ظهر|عصر| المغرب|الغروب|الفجر)/i,
        inOut: /(داخلي|خارجي|د\.|خ\.)/i,
      },
      sceneHeader3: c(
        /^(مسجد|بيت|منزل|شارع|حديقة|مدرسة|جامعة|مكتب|محل|مستشفى|مطعم|فندق|سيارة|غرفة|قاعة|ممر|سطح|ساحة|مقبرة|مخبز|مكتبة|نهر|بحر|جبل|غابة|سوق|مصنع|بنك|محكمة|سجن|موقف|محطة|مطار|ميناء|كوبرى|نفق|مبنى|قصر|قصر عدلي|فندق|نادي|ملعب|ملهى|بار|كازينو|متحف|مسرح|سينما|معرض|مزرعة|مصنع|مختبر|مستودع|محل|مطعم|مقهى|موقف|مكتب|شركة|كهف|الكهف|غرفة الكهف|كهف المرايا)/i
      ),
    };
  }

  static easternToWesternDigits(s: string): string {
    const map: { [key: string]: string } = {
      "٠": "0",
      "١": "1",
      "٢": "2",
      "٣": "3",
      "٤": "4",
      "٥": "5",
      "٦": "6",
      "٧": "7",
      "٨": "8",
      "٩": "9",
    };
    return s.replace(/[٠٢٣٤٥٦٧٨٩]/g, (char) => map[char] || char);
  }

  static stripTashkeel(s: string): string {
    return s.replace(/[\u064B-\u065F\u0670]/g, "");
  }

  static normalizeSeparators(s: string): string {
    return s.replace(/[-–—]/g, "-").replace(/[،,]/g, ",").replace(/\s+/g, " ");
  }

  static normalizeLine(input: string): string {
    return ScreenplayClassifier.stripTashkeel(
      ScreenplayClassifier.normalizeSeparators(input)
    )
      .replace(/[\u200f\u200e\ufeff\t]+/g, "")
      .trim();
  }

  static textInsideParens(s: string): string {
    const match = s.match(/^\s*\((.*?)\)\s*$/);
    return match ? match[1] || "" : "";
  }

  static hasSentencePunctuation(s: string): boolean {
    return /[\.!\؟\?]/.test(s);
  }

  static wordCount(s: string): number {
    return s.trim() ? s.trim().split(/\s+/).length : 0;
  }

  static isBlank(line: string): boolean {
    return !line || line.trim() === "";
  }

  static isBasmala(line: string): boolean {
    const normalizedLine = line.trim();
    const basmalaPatterns = [
      /^بسم\s+الله\s+الرحمن\s+الرحيم$/i,
      /^[{}]*\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*[{}]*$/i,
    ];
    return basmalaPatterns.some((pattern) => pattern.test(normalizedLine));
  }

  static isSceneHeaderStart(line: string): boolean {
    return ScreenplayClassifier.SCENE_PREFIX_RE.test(line);
  }

  static isTransition(line: string): boolean {
    return ScreenplayClassifier.TRANSITION_RE.test(line);
  }

  static isParenShaped(line: string): boolean {
    return ScreenplayClassifier.PARENTHETICAL_SHAPE_RE.test(line);
  }

  static isCharacterLine(
    line: string,
    context?: { lastFormat: string; isInDialogueBlock: boolean }
  ): boolean {
    if (
      ScreenplayClassifier.isSceneHeaderStart(line) ||
      ScreenplayClassifier.isTransition(line) ||
      ScreenplayClassifier.isParenShaped(line)
    ) {
      return false;
    }

    const wordCount = ScreenplayClassifier.wordCount(line);
    if (wordCount > 7) return false;

    const normalized = ScreenplayClassifier.normalizeLine(line);
    if (ScreenplayClassifier.isActionVerbStart(normalized)) return false;

    const hasColon = line.includes(":");
    const arabicCharacterPattern =
      /^[\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+[:\s]*$/;

    if (hasColon && line.trim().endsWith(":")) {
      return true;
    }

    if (arabicCharacterPattern.test(line)) {
      return true;
    }

    if (!hasColon) return false;

    if (context) {
      if (context.isInDialogueBlock) {
        if (context.lastFormat === "character") {
          return (
            ScreenplayClassifier.CHARACTER_RE.test(line) ||
            arabicCharacterPattern.test(line)
          );
        }
        if (context.lastFormat === "dialogue") {
          return false;
        }
      }

      if (context.lastFormat === "action" && hasColon) {
        return (
          ScreenplayClassifier.CHARACTER_RE.test(line) ||
          arabicCharacterPattern.test(line)
        );
      }
    }

    return (
      ScreenplayClassifier.CHARACTER_RE.test(line) ||
      arabicCharacterPattern.test(line)
    );
  }

  static isLikelyAction(line: string): boolean {
    if (
      ScreenplayClassifier.isBlank(line) ||
      ScreenplayClassifier.isBasmala(line) ||
      ScreenplayClassifier.isSceneHeaderStart(line) ||
      ScreenplayClassifier.isTransition(line) ||
      ScreenplayClassifier.isCharacterLine(line) ||
      ScreenplayClassifier.isParenShaped(line)
    ) {
      return false;
    }

    const normalized = ScreenplayClassifier.normalizeLine(line);

    const actionStartPatterns = [
      /^\s*[-–—]?\s*(?:نرى|ننظر|نسمع|نلاحظ|يبدو|يظهر|يبدأ|ينتهي|يستمر|يتوقف|يتحرك|يحدث|يكون|يوجد|توجد|تظهر)/,
      /^\s{0,10}[-–—]?\s{0,10}[يت][\u0600-\u06FF]+\s+\S/,
    ];

    for (const pattern of actionStartPatterns) {
      if (pattern.test(line)) {
        return true;
      }
    }

    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      return true;
    }

    return false;
  }

  /**
   * نظام النافذة المنزلقة (Sliding Window) للمعالجة الدقيقة
   * ينظر للسطر السابق واللاحق لتحديد النوع بدقة
   */
  static classifyBatch(text: string): ClassifiedLine[] {
  const lines = text.split(/\r?\n/);
  const results: ClassifiedLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim();

    // تخطي الأسطر الفارغة
    if (!currentLine) {
      continue;
    }

    // تجهيز النافذة
    const prevType = results.length > 0 ? results[results.length - 1].type : null;
    const nextLineRaw = i < lines.length - 1 ? lines[i + 1].trim() : "";

    const type = this.determineTypeWithContext(currentLine, prevType, nextLineRaw);

    results.push({
      text: currentLine,
      type: type,
      confidence: 0.9 // قيمة افتراضية للمعالجة المحلية
    });
  }

  return results;
}

  private static determineTypeWithContext(current: string, prevType: string | null, nextRaw: string): string {
  // 1. العناوين الرئيسية (الأقوى دائماً)
  if (this.isSceneHeaderStart(current)) return 'scene-header-1';
  if (this.isTransition(current)) return 'transition';

  // 2. عناوين الأماكن الفرعية (Scene Header 3)
  // الشرط: يأتي بعد عنوان رئيسي أو فرعي + قصير + ليس انتقالاً
  if (prevType === 'scene-header-1' || prevType === 'scene-header-2' || prevType === 'scene-header-3') {
    // هل هو قصير ولا يحتوي على فعل أكشن صريح؟
    const wordCount = current.split(/\s+/).length;
    if (wordCount <= 6 && !current.includes(':') && !this.isTransition(current)) {
      return 'scene-header-3';
    }
  }

  // 3. الشخصيات (Character)
  // المنطق المستقبلي (Lookahead): لو السطر اللي بعدي شكله حوار، يبقى أنا شخصية أكيد
  if (this.looksLikeDialogue(nextRaw)) {
    // شروط إضافية: الشخصية عادة قصيرة ولا تنتهي بنقطة
    if (current.length < 50 && !current.endsWith('.')) {
      return 'character';
    }
  }

  // Also check standard character patterns if lookahead wasn't definitive but it looks like a character
  if (this.isCharacterLine(current)) {
    return 'character';
  }

  // 4. الحوار (Dialogue)
  if (prevType === 'character' || prevType === 'parenthetical') {
    return 'dialogue';
  }

  // 5. الملاحظات (Parenthetical)
  if (current.startsWith('(') && current.endsWith(')')) {
    if (prevType === 'character' || prevType === 'dialogue') {
      return 'parenthetical';
    }
  }

  // الافتراضي دائماً هو الأكشن
  return 'action';
}

  // دالة مساعدة سريعة للنظر للمستقبل
  private static looksLikeDialogue(nextLine: string): boolean {
  if (!nextLine) return false;
  // الحوار لا يبدأ عادة بكلمات المفاتيح الخاصة بالمشاهد
  if (this.isSceneHeaderStart(nextLine)) return false;
  if (this.isTransition(nextLine)) return false;
  // الحوار عادة نص حر
  return true;
}
}
