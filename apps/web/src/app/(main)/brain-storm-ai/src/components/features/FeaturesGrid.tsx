/**
 * @module FeaturesGrid
 * @description شبكة المميزات أسفل الصفحة
 */

"use client";

import { Brain, Layers, Zap, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeaturesGridProps {
  agentStats: {
    total: number;
    withSelfReflection: number;
  };
}

export default function FeaturesGrid({ agentStats }: FeaturesGridProps) {
  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "ذكاء اصطناعي متقدم",
      desc: `${agentStats.total} وكيل متخصص`,
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "5 فئات متنوعة",
      desc: "أساسي، تحليل، إبداع، تنبؤ، متقدم",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "نظام نقاش ذكي",
      desc: "تعاون حقيقي بين الوكلاء",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "جودة مضمونة",
      desc: `${agentStats.withSelfReflection} وكيل بتأمل ذاتي`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {features.map((feature, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-blue-500 mb-4">{feature.icon}</div>
            <h3 className="font-bold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
