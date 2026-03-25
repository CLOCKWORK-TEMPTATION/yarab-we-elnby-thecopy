function groupFinding(finding) {
  if (finding.type === 'out_of_scope') return 'خارج النطاق الحالي';
  if (finding.severity === 'critical') return 'يجب إصلاحه فورًا';
  if (finding.severity === 'high') return 'يجب إصلاحه قبل أي ميزة جديدة';
  return 'يمكن تأجيله بشروط';
}

function listProblems(findings = []) {
  return findings.map((finding) => `- ${finding.problem} — ${finding.fix}`);
}

export function buildRepairPriorityMap(findings = []) {
  const groups = {
    'يجب إصلاحه فورًا': [],
    'يجب إصلاحه قبل أي ميزة جديدة': [],
    'يمكن تأجيله بشروط': [],
    'خارج النطاق الحالي': []
  };

  for (const finding of findings) {
    groups[groupFinding(finding)].push(finding);
  }

  return groups;
}

export function buildFivePhaseActionPlan(findings = []) {
  const priorityMap = buildRepairPriorityMap(findings);

  return {
    phase_1: {
      title: 'المرحلة 1: إيقاف النزيف',
      goal: 'إزالة الانهيارات والبوابات الحرجة التي تمنع الحكم الموثوق.',
      scope: listProblems(priorityMap['يجب إصلاحه فورًا']),
      success: 'لا تبقى أخطاء حرجة تمنع التشغيل أو تسرب أسرار أو كسرًا أساسيًا في الأدوات.'
    },
    phase_2: {
      title: 'المرحلة 2: تثبيت العقود وحدود الطبقات',
      goal: 'إغلاق مخاطر العقود والحدود بين الطبقات والخدمات.',
      scope: listProblems(priorityMap['يجب إصلاحه قبل أي ميزة جديدة']),
      success: 'تستقر العقود الرئيسية ولا تبقى حدود طبقية هشة أو غير موثقة.'
    },
    phase_3: {
      title: 'المرحلة 3: تنظيف المنطق المشترك',
      goal: 'تقليل التكرار والرخاوة في الطبقات المشتركة.',
      scope: listProblems(findings.filter((finding) => ['shared', 'shared_packages'].includes(finding.layer))),
      success: 'تنخفض الرخاوة في المنطق المشترك وتصبح العقود أوضح للصيانة.'
    },
    phase_4: {
      title: 'المرحلة 4: ضبط الواجهة والتكامل',
      goal: 'منع الفشل الصامت وتثبيت عقود التكامل وتجربة الحالات الحدية.',
      scope: listProblems(findings.filter((finding) => ['frontend', 'integration', 'frontend_backend_integration', 'editor_subtree', 'backend'].includes(finding.layer))),
      success: 'تظهر أخطاء التكامل والحالات الحدية بصورة صريحة ويمكن التحقق منها.'
    },
    phase_5: {
      title: 'المرحلة 5: رفع الجاهزية الإنتاجية',
      goal: 'تثبيت المراقبة والجاهزية والأمن التشغيلي قبل الاعتماد.',
      scope: listProblems(findings.filter((finding) => ['production', 'performance', 'security', 'security_production_readiness', 'documentation_drift'].includes(finding.layer))),
      success: 'تتحسن الجاهزية التشغيلية ولا تبقى مخاطر إنتاجية كبيرة غير مغطاة.'
    }
  };
}
