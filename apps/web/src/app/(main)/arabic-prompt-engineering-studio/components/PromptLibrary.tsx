// PromptLibrary.tsx
// مكتبة المحفزات الإبداعية

"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  CreativePrompt,
  CreativeGenre,
  WritingTechnique,
  DifficultyLevel,
} from "@/app/(main)/arabic-creative-writing-studio/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VirtualizedGrid } from "@/components/ui/virtualized-grid";

interface PromptLibraryProps {
  onPromptSelect: (prompt: CreativePrompt) => void;
  onEnhancePrompt: (
    prompt: string,
    genre: CreativeGenre,
    technique: WritingTechnique
  ) => Promise<any>;
  loading: boolean;
}

// بيانات المحفزات العربية
const ARABIC_PROMPTS: CreativePrompt[] = [
  {
    id: "fantasy_001",
    title: "إيقاف الزمن",
    description: "شخصية تملك قدرة إيقاف الزمن مع ثمن باهظ",
    genre: "fantasy",
    technique: "character_driven",
    difficulty: "intermediate",
    wordCount: 1000,
    timeEstimate: "45 دقيقة",
    tags: ["سحر", "زمن", "تضحية"],
    arabic:
      "اكتب عن شخصية لديها القدرة على إيقاف الزمن، لكن كل مرة توقفه تكبر سنة واحدة. كيف ستستخدم هذه القدرة؟ وما الثمن الذي ستدفعه؟",
    tips: [
      "فكر في المواقف التي تستحق التضحية بسنة من العمر",
      "اربط القدرة بالنمو العاطفي للشخصية",
      "اجعل كل استخدام له وقع عميق على القصة",
    ],
  },
  {
    id: "fantasy_002",
    title: "التنين الشقيق",
    description: "محارب يكتشف أن التنين هو شقيقه المفقود",
    genre: "fantasy",
    technique: "plot_driven",
    difficulty: "advanced",
    wordCount: 1500,
    timeEstimate: "60 دقيقة",
    tags: ["عائلة", "صراع", "اكتشاف"],
    arabic:
      "محارب لا يريد قتل التنين الذي من المفترض أن يهزمه - لأن التنين هو شقيقه المفقود منذ زمن طويل. كيف سيحل هذا الصراع؟",
    tips: [
      "استكشف الصراع الداخلي بين الواجب والعائلة",
      "اربط قصة الماضي بالحاضر بطريقة مشوقة",
      "فكر في كيفية تحول الأخ إلى تنين",
    ],
  },
  {
    id: "scifi_001",
    title: "الكائنات والحيوانات",
    description: "غزو فضائي يتواصل مع الحيوانات فقط",
    genre: "science_fiction",
    technique: "world_building",
    difficulty: "intermediate",
    wordCount: 1200,
    timeEstimate: "50 دقيقة",
    tags: ["غزو", "تواصل", "حيوانات"],
    arabic:
      "كائنات فضائية تغزو الأرض لكنها تستطيع التواصل مع الحيوانات فقط، وليس البشر. كيف سيغير ذلك ميزان القوى؟",
    tips: [
      "فكر في أنواع الحيوانات المختلفة ودورها",
      "استكشف كيف ستتغير علاقة الإنسان بالحيوانات",
      "اجعل التواصل معقداً وليس مجرد كلام",
    ],
  },
  {
    id: "mystery_001",
    title: "المحقق والعصابة",
    description: "اكتشاف ربط جميع القضايا الباردة بعصابة واحدة",
    genre: "mystery",
    technique: "plot_driven",
    difficulty: "advanced",
    wordCount: 2000,
    timeEstimate: "90 دقيقة",
    tags: ["تحقيق", "مؤامرة", "اكتشاف"],
    arabic:
      "محقق يدرك أن جميع قضاياه الباردة مرتبطة بعصابة سرية واحدة. كيف سيكشف هذه المؤامرة الضخمة؟",
    tips: [
      "اربط القضايا بخيط رفيع لكن منطقي",
      "اجعل الكشف تدريجياً ومشوقاً",
      "فكر في دوافع العصابة الحقيقية",
    ],
  },
  {
    id: "romance_001",
    title: "المصعد والضدان",
    description: "شخصان متضادان يعلقان في مصعد",
    genre: "romance",
    technique: "dialogue_driven",
    difficulty: "beginner",
    wordCount: 800,
    timeEstimate: "30 دقيقة",
    tags: ["حوار", "اكتشاف", "جاذبية"],
    arabic:
      "شخصان علقا في مصعد ويكتشفان أنهما متضادان تماماً في كل شيء. كيف ستتطور علاقتهما في هذا المكان الضيق؟",
    tips: [
      "استخدم الحوار لكشف شخصياتهما",
      "اجعل التضاد مثيراً وليس منفراً",
      "فكر في كيفية تحول الخلاف إلى انجذاب",
    ],
  },
  {
    id: "poetry_001",
    title: "ذكريات متدرجة",
    description: 'قصيدة تبدأ كل سطر بـ"أتذكر"',
    genre: "poetry",
    technique: "sensory_driven",
    difficulty: "beginner",
    wordCount: 200,
    timeEstimate: "20 دقيقة",
    tags: ["ذاكرة", "مشاعر", "تدرج"],
    arabic:
      'أنشئ قصيدة تبدأ كل سطر بـ"أتذكر" وتبني رنيناً عاطفياً يتصاعد مع كل ذكرى.',
    tips: [
      "ابدأ بذكريات بسيطة وتدرج للأعمق",
      "استخدم الحواس في وصف الذكريات",
      "اجعل كل سطر يضيف طبقة عاطفية جديدة",
    ],
  },
];

const GENRE_LABELS: Record<CreativeGenre, string> = {
  fantasy: "🧙‍♂️ الخيال والفانتازيا",
  science_fiction: "🚀 الخيال العلمي",
  mystery: "🔍 الغموض والإثارة",
  romance: "💝 الرومانسية",
  historical_fiction: "🏛️ الخيال التاريخي",
  literary_fiction: "📚 الأدب الراقي",
  poetry: "🎭 الشعر",
  cross_genre: "🌟 متعدد الأنواع",
};

const TECHNIQUE_LABELS: Record<WritingTechnique, string> = {
  character_driven: "👥 مدفوعة بالشخصيات",
  world_building: "🌍 بناء العالم",
  plot_driven: "📈 مدفوعة بالأحداث",
  dialogue_driven: "💬 مدفوعة بالحوار",
  sensory_driven: "👁️ حسية التفاصيل",
  atmospheric: "🌙 جوية",
  experimental: "🔬 تجريبية",
};

const DIFFICULTY_LABELS: Record<
  DifficultyLevel,
  { label: string; color: string }
> = {
  beginner: { label: "🌱 مبتدئ", color: "text-green-600" },
  intermediate: { label: "🌿 متوسط", color: "text-yellow-600" },
  advanced: { label: "🌳 متقدم", color: "text-red-600" },
  academic: { label: "🎓 أكاديمي", color: "text-purple-600" },
};

export const PromptLibrary: React.FC<PromptLibraryProps> = ({
  onPromptSelect,
  onEnhancePrompt,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<CreativeGenre | "all">(
    "all"
  );
  const [selectedTechnique, setSelectedTechnique] = useState<
    WritingTechnique | "all"
  >("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    DifficultyLevel | "all"
  >("all");
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  // تصفية المحفزات
  const filteredPrompts = useMemo(() => {
    return ARABIC_PROMPTS.filter((prompt) => {
      const matchesSearch =
        searchTerm === "" ||
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.arabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.tags.some((tag) => tag.includes(searchTerm));

      const matchesGenre =
        selectedGenre === "all" || prompt.genre === selectedGenre;
      const matchesTechnique =
        selectedTechnique === "all" || prompt.technique === selectedTechnique;
      const matchesDifficulty =
        selectedDifficulty === "all" ||
        prompt.difficulty === selectedDifficulty;

      return (
        matchesSearch && matchesGenre && matchesTechnique && matchesDifficulty
      );
    });
  }, [searchTerm, selectedGenre, selectedTechnique, selectedDifficulty]);

  // عرض بطاقة المحفز
  const renderPromptCard = useCallback(
    (prompt: CreativePrompt) => {
      const isExpanded = expandedPrompt === prompt.id;

      return (
        <Card key={prompt.id} className="hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <CardTitle className="text-xl mb-2">{prompt.title}</CardTitle>
              <Badge
                variant="secondary"
                className={DIFFICULTY_LABELS[prompt.difficulty].color}
              >
                {DIFFICULTY_LABELS[prompt.difficulty].label}
              </Badge>
            </div>

            <CardDescription className="mb-4">
              {prompt.description}
            </CardDescription>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{GENRE_LABELS[prompt.genre]}</Badge>
              <Badge variant="outline">
                {TECHNIQUE_LABELS[prompt.technique]}
              </Badge>
              {prompt.timeEstimate && (
                <Badge variant="outline">⏱️ {prompt.timeEstimate}</Badge>
              )}
            </div>

            {isExpanded && (
              <div className="border-t pt-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2">📝 المحفز الكامل:</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {prompt.arabic}
                  </p>
                </div>

                {prompt.tips && prompt.tips.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">💡 نصائح للكتابة:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {prompt.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm text-gray-600">
                    🏷️ الكلمات المفتاحية:
                  </span>
                  {prompt.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setExpandedPrompt(isExpanded ? null : prompt.id)}
              >
                {isExpanded ? "▲ أخفِ التفاصيل" : "▼ عرض التفاصيل"}
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    onEnhancePrompt(
                      prompt.arabic,
                      prompt.genre,
                      prompt.technique
                    )
                  }
                  disabled={loading}
                  variant="outline"
                >
                  🚀 تحسين
                </Button>
                <Button onClick={() => onPromptSelect(prompt)}>
                  ✍️ ابدأ الكتابة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
    [expandedPrompt, onPromptSelect, onEnhancePrompt, loading]
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          📚 مكتبة المحفزات الإبداعية
        </h2>

        {/* شريط البحث والفلاتر */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 البحث
              </label>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث في المحفزات..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📂 النوع الأدبي
              </label>
              <Select
                value={selectedGenre}
                onValueChange={(value) =>
                  setSelectedGenre(value as CreativeGenre | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {Object.entries(GENRE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 التقنية
              </label>
              <Select
                value={selectedTechnique}
                onValueChange={(value) =>
                  setSelectedTechnique(value as WritingTechnique | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع التقنيات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التقنيات</SelectItem>
                  {Object.entries(TECHNIQUE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 المستوى
              </label>
              <Select
                value={selectedDifficulty}
                onValueChange={(value) =>
                  setSelectedDifficulty(value as DifficultyLevel | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستويات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  {Object.entries(DIFFICULTY_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* عداد النتائج */}
        <div className="text-gray-600 mb-4">
          تم العثور على {filteredPrompts.length} محفز من أصل{" "}
          {ARABIC_PROMPTS.length}
        </div>
      </div>

      {/* قائمة المحفزات */}
      {filteredPrompts.length > 6 ? (
        <VirtualizedGrid
          items={filteredPrompts}
          renderItem={(prompt) => renderPromptCard(prompt)}
          columnCount={2}
          itemHeight={450}
          itemWidth={550}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrompts.map(renderPromptCard)}
        </div>
      )}

      {filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            لا توجد محفزات مطابقة
          </h3>
          <p className="text-gray-500">جرب تعديل معايير البحث أو المرشحات</p>
        </div>
      )}
    </div>
  );
};

export default PromptLibrary;
