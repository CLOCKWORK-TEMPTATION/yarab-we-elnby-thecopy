/**
 * @fileoverview المكون الرئيسي لتطبيق تفريغ السيناريو
 * 
 * هذا المكون هو نقطة الدخول الرئيسية لتطبيق BreakBreak AI.
 * يستخدم خطافات مخصصة لفصل المنطق عن العرض.
 * 
 * السبب: نفصل المنطق عن واجهة المستخدم لتحسين قابلية الصيانة
 * والاختبار، ونستخدم Toast بدلاً من alert للتجربة الأفضل.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Clapperboard, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { MOCK_SCRIPT, AGENTS } from './constants';
import { Scene, SceneBreakdown, ScenarioAnalysis } from './types';
import ResultsView from './components/ResultsView';
import ChatBot from './components/ChatBot';
import ToastContainer from './components/ToastContainer';
import { useScriptProcessor } from './hooks/useScriptProcessor';
import { useSceneManager } from './hooks/useSceneManager';
import { useToast } from './hooks/useToast';
import { logError } from './config';

/**
 * المكون الرئيسي للتطبيق
 * 
 * يوفر واجهة لإدخال السيناريو وعرض نتائج التحليل.
 * يستخدم خطافات مخصصة لإدارة الحالة والمنطق.
 */
function App() {
  const [scriptText, setScriptText] = useState(MOCK_SCRIPT);
  
  // استخدام الخطافات المخصصة
  const { 
    isSegmenting, 
    error, 
    view, 
    processScript, 
    reset: resetProcessor, 
    clearError 
  } = useScriptProcessor();
  
  const { 
    scenes, 
    setScenes,
    updateScene, 
    restoreVersion 
  } = useSceneManager();
  
  const { toasts, error: showError, dismiss } = useToast();

  /**
   * يعالج السيناريو ويعرض النتائج أو الأخطاء
   * 
   * السبب: نستخدم Toast للأخطاء بدلاً من alert
   * لتجربة مستخدم أفضل
   */
  const handleProcessScript = useCallback(async () => {
    if (!scriptText.trim()) {
      showError('الرجاء إدخال نص السيناريو');
      return;
    }

    const result = await processScript(scriptText);
    
    if (result.success && result.scenes) {
      setScenes(result.scenes);
    } else if (result.error) {
      showError(result.error.message);
      logError('App.handleProcessScript', new Error(result.error.message));
    }
  }, [scriptText, processScript, setScenes, showError]);

  /**
   * يحدث بيانات مشهد معين
   * 
   * السبب: نمرر الدالة للمكونات الفرعية للتحديث
   */
  const handleUpdateScene = useCallback((
    id: number, 
    breakdown: SceneBreakdown | undefined, 
    scenarios?: ScenarioAnalysis
  ) => {
    updateScene(id, breakdown, scenarios);
  }, [updateScene]);

  /**
   * يستعيد إصدار قديم من المشهد
   */
  const handleRestoreVersion = useCallback((sceneId: number, versionId: string) => {
    restoreVersion(sceneId, versionId);
  }, [restoreVersion]);

  /**
   * يعيد تعيين التطبيق للبدء من جديد
   */
  const handleReset = useCallback(() => {
    resetProcessor();
    setScenes([]);
    clearError();
  }, [resetProcessor, setScenes, clearError]);

  /**
   * تصفية الوكلاء لعرض معاينة في صفحة الإدخال
   * 
   * السبب: نستخدم useMemo لتجنب إعادة الحساب غير الضرورية
   */
  const previewAgents = useMemo(() => 
    AGENTS.filter(a => a.type === 'breakdown').slice(0, 4), 
  []);

  return (
    <div className="min-h-screen pb-20">
      {/* الرأس */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Clapperboard className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 hidden sm:block">
              BreakBreak AI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {view === 'results' && (
              <button 
                onClick={handleReset}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                تحليل جديد
              </button>
             )}
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {view === 'input' ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-bold text-white leading-tight">
                نظام تفريغ السيناريو السينمائي <br/>
                <span className="text-blue-500">بالذكاء الاصطناعي</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                قم بلصق السيناريو الخاص بك، وسيقوم النظام بتقسيمه وتفعيل "مساعد الإنتاج الاستباقي" لتوليد سيناريوهات العمل.
              </p>
            </div>

            {/* عرض رسالة الخطأ */}
            {error !== null && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error.message}</p>
              </div>
            )}

            <div className="bg-slate-800 rounded-2xl p-1 shadow-2xl shadow-blue-900/10 border border-slate-700">
              <div className="bg-slate-900 rounded-xl overflow-hidden relative group">
                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="مشهد داخلي. المطبخ - ليل..."
                  className="w-full h-96 p-6 bg-slate-900 text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-base leading-relaxed"
                  dir="auto"
                />
                
                {/* تلميح بصري */}
                <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-mono text-slate-400 border border-slate-700 pointer-events-none">
                  INT. SCRIPT EDITOR
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleProcessScript}
                disabled={isSegmenting || !scriptText.trim()}
                className={`
                  relative overflow-hidden group
                  bg-gradient-to-r from-blue-600 to-indigo-600 
                  hover:from-blue-500 hover:to-indigo-500
                  text-white px-10 py-4 rounded-full font-bold text-lg
                  shadow-xl shadow-blue-900/30 transition-all transform hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                <div className="flex items-center gap-3">
                  {isSegmenting ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      جاري معالجة السيناريو...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      ابدأ التحليل والتفريغ
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* شبكة الميزات */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-800">
               {previewAgents.map(agent => (
                 <div key={agent.key} className="flex flex-col items-center gap-2 text-center p-4 bg-slate-800/30 rounded-lg">
                    <div className={`p-2 rounded-full ${agent.color} bg-opacity-20 text-slate-200`}>
                      {agent.icon}
                    </div>
                    <span className="text-xs text-slate-400">{agent.label}</span>
                 </div>
               ))}
            </div>

          </div>
        ) : (
          <ResultsView 
            scenes={scenes} 
            onUpdateScene={handleUpdateScene} 
            onRestoreVersion={handleRestoreVersion}
          />
        )}
        
        {/* روبوت المحادثة */}
        <ChatBot />
        
        {/* حاوية الإشعارات */}
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </main>
    </div>
  );
}

export default App;