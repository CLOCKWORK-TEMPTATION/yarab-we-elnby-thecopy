"use client"

import Link from "next/link"
import { platformApps, type PlatformApp } from "@/config/apps.config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AppsOverviewPage() {
  // Get only enabled apps and group them by category
  const enabledApps = platformApps.filter(app => app.enabled)
  
  const appsByCategory = enabledApps.reduce((acc, app) => {
    if (!acc[app.category]) {
      acc[app.category] = []
    }
    acc[app.category].push(app)
    return acc
  }, {} as Record<string, PlatformApp[]>)

  const categoryNames: Record<string, string> = {
    production: "الإنتاج",
    creative: "الإبداع",
    analysis: "التحليل",
    management: "الإدارة",
  }

  const categoryColors: Record<string, string> = {
    production: "from-purple-600 to-pink-600",
    creative: "from-blue-600 to-cyan-600",
    analysis: "from-violet-600 to-purple-600",
    management: "from-green-600 to-emerald-600",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6 md:p-12" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#FFD700] via-yellow-500 to-[#FFD700] bg-clip-text text-transparent">
            منصة النسخة
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-2">
            مجموعة شاملة من 13 تطبيقاً متخصصاً
          </p>
          <p className="text-lg text-gray-400">
            للإنتاج السينمائي والدرامي العربي
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(appsByCategory).map(([category, apps]) => (
            <div
              key={category}
              className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-colors"
            >
              <div className="text-3xl font-bold text-[#FFD700]">{apps.length}</div>
              <div className="text-sm text-gray-400">{categoryNames[category]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Apps Grid by Category */}
      <div className="max-w-7xl mx-auto space-y-12">
        {Object.entries(appsByCategory).map(([category, apps]) => (
          <div key={category}>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <span className={`bg-gradient-to-r ${categoryColors[category]} px-4 py-2 rounded-lg`}>
                {categoryNames[category]}
              </span>
              <span className="text-gray-500">({apps.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.map((app) => (
                <Card
                  key={app.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-[#FFD700]/50"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <span className="text-3xl">{app.icon}</span>
                      <div className="flex-1">
                        <div className="text-xl">{app.nameAr}</div>
                        <div className="text-sm text-gray-400 font-normal">{app.name}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300 mb-4 min-h-[3rem]">
                      {app.description}
                    </CardDescription>

                    <div className="flex items-center justify-between gap-3">
                      {app.badge && (
                        <Badge variant="secondary" className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30">
                          {app.badge}
                        </Badge>
                      )}
                      
                      <Link href={app.path} className="mr-auto">
                        <Button
                          className={`bg-gradient-to-r ${app.color} hover:opacity-90 transition-opacity`}
                          size="sm"
                        >
                          فتح التطبيق ←
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-16 text-center text-gray-400">
        <p className="text-lg">
          منصة متكاملة تجمع بين قوة الذكاء الاصطناعي وأدوات الإنتاج الاحترافية
        </p>
        <div className="mt-4">
          <Link href="/ui">
            <Button variant="outline" className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10">
              العودة إلى القائمة الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
