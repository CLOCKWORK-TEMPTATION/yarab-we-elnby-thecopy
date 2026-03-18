/**
 * @fileoverview مكون عرض نتائج تحليل المشاهد
 * 
 * هذا المكون يعرض قائمة المشاهد المستخرجة مع خيارات التحليل
 * والتنقل بين الإصدارات.
 * 
 * السبب: نفصل عرض النتائج لتسهيل الصيانة وإعادة الاستخدام،
 * ونستخدم useCallback لتحسين الأداء مع القوائم الكبيرة.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Scene, AgentKey, ScenarioAnalysis, SceneBreakdown } from '../types';
import { AGENTS } from '../constants';
import AgentCard from './AgentCard';
import ScenarioNavigator from './ScenarioNavigator';
import CastBreakdownView from './CastBreakdownView';
import ToastContainer from './ToastContainer';
import { useToast } from '../hooks/useToast';
import { logError } from '../config';
import { ChevronDown, ChevronUp, CheckCircle, BrainCircuit, BarChart3, Loader2, History, Clock, RotateCcw } from 'lucide-react';
import * as geminiService from '../services/geminiService';

/**
 * خصائص المكون
 */
interface ResultsViewProps {
  /** قائمة المشاهد */
  scenes: Scene[];
  /** دالة تحديث المشهد */
  onUpdateScene: (id: number, breakdown: SceneBreakdown | undefined, scenarios?: ScenarioAnalysis) => void;
  /** دالة استعادة إصدار سابق */
  onRestoreVersion: (sceneId: number, versionId: string) => void;
}

/**
 * مكون عرض النتائج
 * 
 * يعرض قائمة المشاهد مع إمكانية التوسيع والتحليل واستعادة الإصدارات.
 */
const ResultsView: React.FC<ResultsViewProps> = ({ scenes, onUpdateScene, onRestoreVersion }) => {
  const [expandedSceneId, setExpandedSceneId] = useState<number | null>(scenes.length > 0 ? scenes[0].id : null);
  const [analyzingIds, setAnalyzingIds] = useState<Set<number>>(new Set());
  const [strategizingIds, setStrategizingIds] = useState<Set<number>>(new Set());
  const [showNavigatorForScene, setShowNavigatorForScene] = useState<number | null>(null);
  
  // تتبع الإصدار المحدد للمعاينة: { sceneId: versionId | null }
  const [previewVersion, setPreviewVersion] = useState<Record<number, string | null>>({});
  
  // استخدام نظام الإشعارات بدلاً من alert
  const { toasts, error: showError, success: showSuccess, dismiss } = useToast();

  /**
   * يبدل حالة توسيع المشهد
   */
  const toggleScene = useCallback((id: number) => {
    setExpandedSceneId(prev => prev === id ? null : id);
  }, []);

  /**
   * يحلل مشهد معين
   * 
   * السبب: نستخدم Toast للأخطاء بدلاً من alert للتجربة الأفضل
   */
  const handleAnalyzeScene = useCallback(async (e: React.MouseEvent, scene: Scene) => {
    e.stopPropagation();
    if (analyzingIds.has(scene.id)) return;

    setAnalyzingIds(prev => new Set(prev).add(scene.id));
    setExpandedSceneId(scene.id);
    
    // إعادة تعيين معاينة الإصدار عند التحليل الجديد
    setPreviewVersion(prev => ({ ...prev, [scene.id]: null }));

    try {
      const breakdown = await geminiService.analyzeScene(scene.content);
      // تمرير السيناريوهات الموجودة إن وجدت
      onUpdateScene(scene.id, breakdown, scene.scenarios);
      showSuccess('تم تحليل المشهد بنجاح');
    } catch (err) {
      logError('ResultsView.handleAnalyzeScene', err);
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      showError(`فشل التحليل: ${errorMessage}`);
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(scene.id);
        return next;
      });
    }
  }, [analyzingIds, onUpdateScene, showError, showSuccess]);

  /**
   * يشغل تحليل السيناريوهات الاستراتيجية
   */
  const handleRunStrategy = useCallback(async (e: React.MouseEvent, scene: Scene) => {
    e.stopPropagation();
    if (strategizingIds.has(scene.id)) return;
    
    setStrategizingIds(prev => new Set(prev).add(scene.id));
    
    try {
      const scenarios = await geminiService.analyzeProductionScenarios(scene.content);
      onUpdateScene(scene.id, scene.analysis, scenarios);
      setShowNavigatorForScene(scene.id);
      showSuccess('تم توليد السيناريوهات بنجاح');
    } catch (err) {
      logError('ResultsView.handleRunStrategy', err);
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      showError(`فشل تحليل السيناريوهات: ${errorMessage}`);
    } finally {
      setStrategizingIds(prev => {
        const next = new Set(prev);
        next.delete(scene.id);
        return next;
      });
    }
  }, [strategizingIds, onUpdateScene, showError, showSuccess]);

  /**
   * يحدد إصدار للمعاينة
   */
  const handleVersionSelect = useCallback((sceneId: number, versionId: string | null) => {
    setPreviewVersion(prev => ({ ...prev, [sceneId]: versionId }));
  }, []);

  /**
   * يستعيد إصدار سابق بعد التأكيد
   */
  const handleRestoreClick = useCallback((sceneId: number, versionId: string) => {
    // نستخدم confirm المدمج لأنه قرار مهم يحتاج تأكيد
    if (window.confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم حفظ الوضع الحالي كنسخة جديدة.')) {
      onRestoreVersion(sceneId, versionId);
      setPreviewVersion(prev => ({ ...prev, [sceneId]: null }));
      showSuccess('تم استعادة النسخة بنجاح');
    }
  }, [onRestoreVersion, showSuccess]);

  /**
   * تحديد البيانات النشطة لنافذة مركز القيادة
   * 
   * السبب: نستخدم useMemo لتجنب الحسابات المتكررة
   */
  const activeSceneForNavigator = useMemo(() => 
    scenes.find(s => s.id === showNavigatorForScene),
  [scenes, showNavigatorForScene]);
  
  const activeNavigatorVersionId = showNavigatorForScene ? previewVersion[showNavigatorForScene] : null;
  
  const activeNavigatorData = useMemo(() => {
    if (!activeSceneForNavigator) return null;
    return activeNavigatorVersionId 
      ? activeSceneForNavigator.versions?.find(v => v.id === activeNavigatorVersionId) 
      : activeSceneForNavigator;
  }, [activeSceneForNavigator, activeNavigatorVersionId]);

  /**
   * تصفية وكلاء التفريغ
   * 
   * السبب: cast تم إزالته من AGENTS، نستخدم useMemo للتحسين
   */
  const breakdownAgents = useMemo(() => 
    AGENTS.filter(a => a.type === 'breakdown'),
  []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BrainCircuit className="text-blue-500" />
          المشاهد المستخرجة
          <span className="text-sm bg-slate-700 px-3 py-1 rounded-full text-slate-300 font-normal">
            {scenes.length}
          </span>
        </h2>
      </div>

      <div className="space-y-4">
        {scenes.map((scene) => {
          const isExpanded = expandedSceneId === scene.id;
          const isProcessing = analyzingIds.has(scene.id);
          const isStrategizing = strategizingIds.has(scene.id);
          const isDone = scene.isAnalyzed;

          // Resolve Active Data based on Version Selection
          const activeVersionId = previewVersion[scene.id];
          const activeData = activeVersionId 
            ? scene.versions?.find(v => v.id === activeVersionId) 
            : scene;
            
          const displayAnalysis = activeData?.analysis;
          const displayScenarios = activeData?.scenarios;
          const isHistoryView = !!activeVersionId;

          return (
            <div 
              key={scene.id} 
              className={`
                bg-slate-800 rounded-xl overflow-hidden border 
                ${isExpanded ? 'border-blue-500/50 shadow-lg shadow-blue-900/10' : 'border-slate-700'}
              `}
            >
              {/* Scene Header Bar */}
              <div 
                onClick={() => toggleScene(scene.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-750 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-900 text-slate-400 text-xs px-2 py-1 rounded font-mono">
                      SCENE {scene.id}
                    </span>
                    <h3 className="font-bold text-lg text-slate-200 uppercase tracking-wide">
                      {scene.header}
                    </h3>
                  </div>
                  {!isExpanded && (
                    <p className="text-slate-500 text-sm truncate max-w-2xl pr-14">
                      {scene.content.substring(0, 100)}...
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Strategy Button */}
                    {isDone && (
                         <button
                         onClick={(e) => {
                           e.stopPropagation();
                           if (displayScenarios) {
                             setShowNavigatorForScene(scene.id);
                           } else if (!isHistoryView) {
                             handleRunStrategy(e, scene);
                           }
                         }}
                         disabled={isStrategizing || (isHistoryView && !displayScenarios)}
                         className={`
                             flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border
                             ${isStrategizing 
                             ? 'bg-slate-800 border-slate-700 text-slate-400' 
                             : 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 hover:bg-indigo-600/30'}
                             ${(isHistoryView && !displayScenarios) ? 'opacity-50 cursor-not-allowed' : ''}
                         `}
                         title="تحليل السيناريوهات الاستراتيجية (Command Center)"
                         >
                         {isStrategizing ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                         ) : (
                             <BarChart3 className="w-4 h-4" />
                         )}
                         <span className="hidden md:inline">
                             {displayScenarios ? 'فتح مركز القيادة' : 'محاكاة الإنتاج'}
                         </span>
                         </button>
                    )}

                  {isDone ? (
                    <span className="flex items-center gap-1 text-green-400 text-sm font-medium px-3">
                      <CheckCircle className="w-4 h-4" />
                      <span className="hidden md:inline">تم التحليل</span>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleAnalyzeScene(e, scene)}
                      disabled={isProcessing}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${isProcessing 
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}
                      `}
                    >
                      {isProcessing ? 'جاري العمل...' : 'تحليل المشهد'}
                    </button>
                  )}
                  
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-700 bg-slate-900/50 p-6 space-y-8 animate-fadeIn">
                  
                  {/* Version History Selector */}
                  {(scene.versions && scene.versions.length > 0) && (
                    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 flex items-center gap-3 overflow-x-auto">
                      <div className="flex items-center gap-2 text-slate-400 text-sm px-2 border-l border-slate-800 shrink-0">
                        <History className="w-4 h-4" />
                        <span>سجل التغييرات:</span>
                      </div>
                      
                      <button
                        onClick={() => handleVersionSelect(scene.id, null)}
                        className={`
                          px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
                          ${!activeVersionId 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
                        `}
                      >
                        الحالية (الأحدث)
                      </button>

                      {scene.versions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => handleVersionSelect(scene.id, version.id)}
                          className={`
                            px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1
                            ${activeVersionId === version.id
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
                          `}
                        >
                          <Clock className="w-3 h-3" />
                          {version.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Scene Text */}
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative group">
                     {isHistoryView && (
                       <div className="absolute top-2 left-2 flex items-center gap-2">
                         <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                           <History className="w-3 h-3" />
                           وضع الأرشيف
                         </span>
                         {activeVersionId && (
                           <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreClick(scene.id, activeVersionId);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-1 rounded-full shadow-lg transition-all flex items-center gap-1 border border-blue-400/50 animate-fadeIn"
                           >
                             <RotateCcw className="w-3 h-3" />
                             استعادة هذه النسخة
                           </button>
                         )}
                       </div>
                     )}
                    <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">نص المشهد</h4>
                    <p className="text-slate-300 whitespace-pre-line leading-relaxed font-serif text-lg">
                      {scene.content}
                    </p>
                  </div>
                  
                  {/* --- NEW CAST BREAKDOWN SECTION --- */}
                  <CastBreakdownView 
                    cast={displayAnalysis ? displayAnalysis.cast : []} 
                    isProcessing={isProcessing} 
                  />

                  {/* Other Agents Grid */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4 font-semibold flex items-center gap-2">
                       تفارير التفريغ (Breakdown Reports)
                       {isHistoryView && <span className="text-xs font-normal text-slate-500">(نسخة قديمة)</span>}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {breakdownAgents.map((agent) => (
                        <AgentCard
                          key={agent.key}
                          agent={agent}
                          items={displayAnalysis && agent.key in displayAnalysis ? displayAnalysis[agent.key as keyof SceneBreakdown] : []}
                          isProcessing={isProcessing}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Render Command Center Overlay */}
      {showNavigatorForScene && activeNavigatorData?.scenarios && (
          <ScenarioNavigator 
            analysis={activeNavigatorData.scenarios} 
            onClose={() => setShowNavigatorForScene(null)} 
          />
      )}
      
      {/* حاوية الإشعارات */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
};

export default ResultsView;