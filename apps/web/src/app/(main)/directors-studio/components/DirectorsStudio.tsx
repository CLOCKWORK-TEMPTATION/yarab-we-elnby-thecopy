"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clapperboard,
  Camera,
  Film,
  Users,
  Layers,
  Move3D,
  Sparkles,
  Play,
  Plus,
  FileText,
  Settings,
  LayoutDashboard,
  Video,
  Lightbulb,
  Palette,
  BookOpen,
  Clock,
  TrendingUp,
  Star,
  ArrowLeft,
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import heavy components
const SpatialScenePlanner = dynamic(
  () => import("@/components/ui/spatial-scene-planner"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل مخطط المشهد...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

const AIShotLibrary = dynamic(() => import("@/components/ui/ai-shot-library"), {
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري تحميل مكتبة اللقطات...</p>
      </div>
    </div>
  ),
  ssr: false,
});

// Feature cards data
const FEATURES = [
  {
    id: "scene-planner",
    title: "مخطط المشهد المكاني",
    titleEn: "Spatial Scene Planner",
    description: "تخطيط ثلاثي الأبعاد للمشاهد مع محاكاة الكاميرا",
    icon: Move3D,
    color: "from-purple-500 to-indigo-600",
    status: "available",
  },
  {
    id: "shot-library",
    title: "مكتبة اللقطات الذكية",
    titleEn: "AI Shot Library",
    description: "بحث ذكي في اللقطات المرجعية من أفلام عالمية",
    icon: Film,
    color: "from-blue-500 to-cyan-600",
    status: "available",
  },
  {
    id: "storyboard",
    title: "لوحة القصة",
    titleEn: "Storyboard",
    description: "إنشاء وتحرير لوحات القصة بالذكاء الاصطناعي",
    icon: Layers,
    color: "from-emerald-500 to-teal-600",
    status: "coming-soon",
  },
  {
    id: "actors",
    title: "إدارة الممثلين",
    titleEn: "Actor Management",
    description: "ملاحظات الأداء وتوجيهات الإخراج",
    icon: Users,
    color: "from-orange-500 to-red-600",
    status: "coming-soon",
  },
  {
    id: "lighting",
    title: "تصميم الإضاءة",
    titleEn: "Lighting Design",
    description: "محاكاة الإضاءة ومخططات الإنارة",
    icon: Lightbulb,
    color: "from-yellow-500 to-amber-600",
    status: "coming-soon",
  },
  {
    id: "color",
    title: "لوحة الألوان",
    titleEn: "Color Palette",
    description: "تصميم المزاج البصري والألوان",
    icon: Palette,
    color: "from-pink-500 to-rose-600",
    status: "coming-soon",
  },
];

// Stats data
const STATS = [
  { label: "المشاريع النشطة", value: "3", icon: Clapperboard },
  { label: "المشاهد", value: "24", icon: Camera },
  { label: "اللقطات", value: "156", icon: Video },
  { label: "ساعات العمل", value: "48", icon: Clock },
];

export const DirectorsStudio: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Render feature content
  const renderFeatureContent = () => {
    switch (activeFeature) {
      case "scene-planner":
        return (
          <div className="h-[calc(100vh-200px)]">
            <SpatialScenePlanner sceneName="مشهد 1 - الافتتاحية" />
          </div>
        );
      case "shot-library":
        return (
          <div className="h-[calc(100vh-200px)]">
            <AIShotLibrary />
          </div>
        );
      default:
        return null;
    }
  };

  // If a feature is active, show it full screen
  if (activeFeature) {
    return (
      <div className="min-h-screen bg-background">
        {/* Feature Header */}
        <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFeature(null)}
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                {(() => {
                  const feature = FEATURES.find((f) => f.id === activeFeature);
                  if (!feature) return null;
                  const Icon = feature.icon;
                  return (
                    <>
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${feature.color}`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h1 className="font-semibold">{feature.title}</h1>
                        <p className="text-xs text-muted-foreground">
                          {feature.titleEn}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </header>

        {/* Feature Content */}
        <main>{renderFeatureContent()}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-indigo-900/80 to-violet-900/90" />

        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                               radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right">
              <div className="flex items-center gap-4 justify-center md:justify-start mb-4">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
                  <Clapperboard className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    استوديو المخرجين
                  </h1>
                  <p className="text-xl text-white/80">Directors Studio</p>
                </div>
              </div>
              <p className="text-lg text-white/70 max-w-2xl">
                أدوات متقدمة للإخراج السينمائي - تخطيط المشاهد، مكتبة اللقطات
                الذكية، وأكثر
              </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STATS.map((stat) => (
                <Card
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                >
                  <CardContent className="p-4 text-center">
                    <stat.icon className="h-5 w-5 mx-auto mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs opacity-70">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-card border">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Sparkles className="h-4 w-4" />
              الأدوات
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Clapperboard className="h-4 w-4" />
              المشاريع
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.filter((f) => f.status === "available").map(
                (feature) => (
                  <Card
                    key={feature.id}
                    className="group cursor-pointer card-interactive hover:shadow-xl transition-all duration-300"
                    onClick={() => setActiveFeature(feature.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        >
                          <Play className="h-3 w-3 ml-1" />
                          متاح
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg mb-1">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-xs mb-2">
                        {feature.titleEn}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      النشاط الأخير
                    </CardTitle>
                    <CardDescription>آخر التحديثات على مشاريعك</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    عرض الكل
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      action: "تم إنشاء لقطة جديدة",
                      project: "فيلم الصحراء",
                      time: "منذ 5 دقائق",
                      icon: Camera,
                    },
                    {
                      action: "تم تحديث المشهد 3",
                      project: "مسلسل الليل",
                      time: "منذ ساعة",
                      icon: Video,
                    },
                    {
                      action: "تمت إضافة شخصية جديدة",
                      project: "فيلم الصحراء",
                      time: "منذ 3 ساعات",
                      icon: Users,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.project}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.id}
                  className={`group cursor-pointer transition-all duration-300 ${
                    feature.status === "available"
                      ? "card-interactive hover:shadow-xl"
                      : "opacity-70"
                  }`}
                  onClick={() =>
                    feature.status === "available" &&
                    setActiveFeature(feature.id)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg ${
                          feature.status === "available"
                            ? "group-hover:scale-110"
                            : ""
                        } transition-transform duration-300`}
                      >
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      {feature.status === "available" ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        >
                          <Play className="h-3 w-3 ml-1" />
                          متاح
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 ml-1" />
                          قريباً
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-1">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-xs mb-2">
                      {feature.titleEn}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">مشاريعك</h2>
                <p className="text-muted-foreground">
                  إدارة مشاريع الأفلام والمسلسلات
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                مشروع جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: "فيلم الصحراء",
                  scenes: 12,
                  shots: 78,
                  progress: 45,
                  status: "active",
                },
                {
                  name: "مسلسل الليل",
                  scenes: 24,
                  shots: 156,
                  progress: 30,
                  status: "active",
                },
                {
                  name: "فيلم قصير - الأمل",
                  scenes: 5,
                  shots: 23,
                  progress: 100,
                  status: "completed",
                },
              ].map((project, idx) => (
                <Card key={idx} className="card-interactive">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>
                          {project.scenes} مشاهد • {project.shots} لقطات
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          project.status === "completed"
                            ? "secondary"
                            : "default"
                        }
                        className={
                          project.status === "completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : ""
                        }
                      >
                        {project.status === "completed" ? "مكتمل" : "نشط"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">التقدم</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand to-purple-500 transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Camera className="h-4 w-4 ml-1" />
                          المشاهد
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Video className="h-4 w-4 ml-1" />
                          اللقطات
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>استوديو المخرجين - أدوات إخراج سينمائي متقدمة</p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <BookOpen className="h-4 w-4 ml-2" />
                الدليل
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 ml-2" />
                الإعدادات
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DirectorsStudio;
