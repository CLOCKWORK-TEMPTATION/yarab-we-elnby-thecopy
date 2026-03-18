import React from 'react';
import { AgentDef } from './types';
import {
  Shirt,
  Palette,
  MonitorPlay,
  Car,
  MapPin,
  Users,
  Briefcase,
  Skull,
  UserCircle,
  Dog,
  Flame,
  Sparkles,
  Calculator,
  CalendarClock,
  Lightbulb,
  ShieldAlert,
  Truck
} from 'lucide-react';

export const AGENTS: AgentDef[] = [
  // --- Breakdown Agents ---
  {
    key: 'locations',
    label: 'المواقع',
    description: 'أماكن التصوير والديكورات',
    icon: <MapPin className="w-5 h-5" />,
    color: 'bg-green-600',
    type: 'breakdown'
  },
  {
    key: 'costumes',
    label: 'الأزياء',
    description: 'ملابس واكسسوارات',
    icon: <Shirt className="w-5 h-5" />,
    color: 'bg-purple-600',
    type: 'breakdown'
  },
  {
    key: 'makeup',
    label: 'المكياج',
    description: 'مكياج وجروح وشعر',
    icon: <Palette className="w-5 h-5" />,
    color: 'bg-pink-500',
    type: 'breakdown'
  },
  {
    key: 'props',
    label: 'الإكسسوارات',
    description: 'أدوات محمولة',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'bg-yellow-600',
    type: 'breakdown'
  },
  {
    key: 'vehicles',
    label: 'المركبات',
    description: 'سيارات وطائرات',
    icon: <Car className="w-5 h-5" />,
    color: 'bg-red-500',
    type: 'breakdown'
  },
  {
    key: 'stunts',
    label: 'المشاهد الخطرة',
    description: 'أكشن، قتال، أسلحة',
    icon: <Skull className="w-5 h-5" />,
    color: 'bg-red-700',
    type: 'breakdown'
  },
  {
    key: 'extras',
    label: 'الكومبارس',
    description: 'حشود وخلفية بشرية',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-orange-500',
    type: 'breakdown'
  },
  {
    key: 'spfx',
    label: 'مؤثرات خاصة (SPFX)',
    description: 'مطر، نار، دخان حقيقي',
    icon: <Flame className="w-5 h-5" />,
    color: 'bg-orange-700',
    type: 'breakdown'
  },
  {
    key: 'vfx',
    label: 'VFX & CGI',
    description: 'مؤثرات بصرية وشاشات خضراء',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'bg-indigo-500',
    type: 'breakdown'
  },
  {
    key: 'animals',
    label: 'الحيوانات',
    description: 'حيوانات حية',
    icon: <Dog className="w-5 h-5" />,
    color: 'bg-amber-800',
    type: 'breakdown'
  },
  {
    key: 'graphics',
    label: 'الشاشات',
    description: 'محتوى الشاشات',
    icon: <MonitorPlay className="w-5 h-5" />,
    color: 'bg-cyan-600',
    type: 'breakdown'
  },

  // --- Strategic Agents ---
  {
    key: 'creative',
    label: 'Creative Impact Agent (CIA)',
    description: 'مهندس السيناريو التكيفي: يقيم التأثير الفني والبدائل الإبداعية.',
    icon: <Lightbulb className="w-5 h-5" />,
    color: 'bg-yellow-500',
    type: 'strategic'
  },
  {
    key: 'budget',
    label: 'Budget & Finance Agent (BFA)',
    description: 'المدير المالي: تقدير التكاليف الفورية وفرص التوفير.',
    icon: <Calculator className="w-5 h-5" />,
    color: 'bg-emerald-600',
    type: 'strategic'
  },
  {
    key: 'risk',
    label: 'Risk Assessment Agent (RAA)',
    description: 'مقيم المخاطر: التنبؤ بالمشاكل اللوجستية والسلامة.',
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'bg-rose-600',
    type: 'strategic'
  },
  {
    key: 'schedule',
    label: 'Scheduling Optimizer (SOA)',
    description: 'محسن الجدولة: حساب الزمن وتضارب الموارد.',
    icon: <CalendarClock className="w-5 h-5" />,
    color: 'bg-cyan-600',
    type: 'strategic'
  },
  {
    key: 'logistics',
    label: 'Production Logistics (PLA)',
    description: 'المنسق اللوجستي: المعدات، المواقع، والتصاريح.',
    icon: <Truck className="w-5 h-5" />,
    color: 'bg-slate-500',
    type: 'strategic'
  }
];

export const MOCK_SCRIPT = `
مشهد داخلي. غرفة المعيشة - نهار

يجلس أحمد (30) متوترًا على الأريكة، يحدق في شاشة الهاتف المكسورة. الغرفة فوضوية.
صوت سيارة شرطة يقترب من الخارج.

أحمد
(بهمس)
لا يمكن أن يحدث هذا الآن.

يدخل خالد (35) مسرعًا، يرتدي معطفًا جلديًا ملطخًا بالطين، ويحمل حقيبة معدنية فضية.

خالد
هل جهزت السيارة؟ نحتاج للمغادرة فورًا.

أحمد
المحرك يسخن، لكننا نحتاج إلى مفك براغي لإصلاح الباب الخلفي.

خالد يرمي الحقيبة على الطاولة الزجاجية، مما يحدث صوت ارتطام قوي.

خالد
انس الباب. الكلبة "لاسي" تنبح في الخارج، الشرطة هنا.

مشهد خارجي. الشارع أمام المنزل - نهار

تتوقف سيارة الدورية. يخرج ضابطان. تمطر السماء بغزارة (مطر صناعي).
`;
