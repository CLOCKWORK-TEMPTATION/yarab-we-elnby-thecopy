import React, { useState } from 'react';
import { ScenarioAnalysis, ScenarioOption } from '../types';
import { 
  Calculator, 
  Lightbulb, 
  ShieldAlert, 
  CalendarClock, 
  Truck, 
  CheckCircle2, 
  BarChart3,
  AlertTriangle
} from 'lucide-react';

interface ScenarioNavigatorProps {
  analysis: ScenarioAnalysis;
  onClose: () => void;
}

const MetricBar: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="flex justify-between items-center text-xs text-slate-400">
      <span className="flex items-center gap-1">{icon} {label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-500 ${color}`} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const ScenarioNavigator: React.FC<ScenarioNavigatorProps> = ({ analysis, onClose }) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(analysis.scenarios[0]?.id || '');

  const activeScenario = analysis.scenarios.find(s => s.id === activeScenarioId);

  if (!activeScenario) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-blue-500" />
              مركز قيادة الإنتاج (Production Command Center)
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              المهندس المعماري للسيناريو التكيفي: استكشاف سيناريوهات "ماذا لو" ومقارنة التأثيرات.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            إغلاق
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar: Scenario List */}
          <div className="w-1/3 border-l border-slate-700 bg-slate-900/50 p-4 overflow-y-auto">
            <h3 className="text-xs uppercase font-bold text-slate-500 mb-4 tracking-wider">السيناريوهات المقترحة</h3>
            <div className="space-y-3">
              {analysis.scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setActiveScenarioId(scenario.id)}
                  className={`
                    w-full text-right p-4 rounded-xl border transition-all relative
                    ${activeScenarioId === scenario.id 
                      ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-900/20' 
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-400'}
                  `}
                >
                  {scenario.recommended && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                      <CheckCircle2 className="w-3 h-3" /> موصى به
                    </span>
                  )}
                  <h4 className={`font-bold mb-1 ${activeScenarioId === scenario.id ? 'text-blue-400' : 'text-slate-200'}`}>
                    {scenario.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                  
                  {/* Mini Bars */}
                  <div className="flex gap-1 mt-3 h-1">
                    <div className="bg-emerald-500 rounded-full" style={{ width: `${scenario.metrics.budget}%`, opacity: 0.7 }} title="Budget" />
                    <div className="bg-yellow-500 rounded-full" style={{ width: `${scenario.metrics.creative}%`, opacity: 0.7 }} title="Creative" />
                    <div className="bg-rose-500 rounded-full" style={{ width: `${scenario.metrics.risk}%`, opacity: 0.7 }} title="Risk" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content: Scenario Details */}
          <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
            
            {/* Top Metrics Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <MetricBar 
                    label="الميزانية (التكلفة)" 
                    value={activeScenario.metrics.budget} 
                    color="bg-emerald-500"
                    icon={<Calculator className="w-3 h-3" />}
                  />
               </div>
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <MetricBar 
                    label="التأثير الإبداعي" 
                    value={activeScenario.metrics.creative} 
                    color="bg-yellow-500"
                    icon={<Lightbulb className="w-3 h-3" />}
                  />
               </div>
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <MetricBar 
                    label="المخاطر والسلامة" 
                    value={activeScenario.metrics.risk} 
                    color="bg-rose-500"
                    icon={<ShieldAlert className="w-3 h-3" />}
                  />
               </div>
               <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <MetricBar 
                    label="تعقيد الجدولة" 
                    value={activeScenario.metrics.schedule} 
                    color="bg-cyan-500"
                    icon={<CalendarClock className="w-3 h-3" />}
                  />
               </div>
            </div>

            {/* Agent Insights Grid */}
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" />
              رؤى الوكلاء المتخصصين (Agent Insights)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CIA */}
              <div className="bg-yellow-500/5 border border-yellow-500/20 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-yellow-500">
                  <Lightbulb className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Creative Impact Agent (CIA)</h4>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {activeScenario.agentInsights.creative}
                </p>
              </div>

              {/* BFA */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-emerald-500">
                  <Calculator className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Budget & Finance Agent (BFA)</h4>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {activeScenario.agentInsights.budget}
                </p>
              </div>

              {/* RAA */}
              <div className="bg-rose-500/5 border border-rose-500/20 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-rose-500">
                  <ShieldAlert className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Risk Assessment Agent (RAA)</h4>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {activeScenario.agentInsights.risk}
                </p>
              </div>

              {/* SOA */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-cyan-500">
                  <CalendarClock className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Scheduling Optimization (SOA)</h4>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {activeScenario.agentInsights.schedule}
                </p>
              </div>
              
              {/* PLA */}
              <div className="col-span-1 md:col-span-2 bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <Truck className="w-5 h-5" />
                  <h4 className="font-bold text-sm">Production Logistics (PLA)</h4>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {activeScenario.agentInsights.logistics}
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioNavigator;