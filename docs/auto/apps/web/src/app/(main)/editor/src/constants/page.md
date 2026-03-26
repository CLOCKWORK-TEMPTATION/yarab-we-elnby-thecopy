# توثيق: `apps\web\src\app\(main)\editor\src\constants\page.ts`

> مُولَّد تلقائياً — لا تعدّله يدوياً.  
> آخر تحديث: `٢٦‏/٣‏/٢٠٢٦، ٨:٢٠:٣٣ م`

---

# توثيق وحدة `constants/page`

## الوصف
تحتوي هذه الوحدة على الثوابت الهندسية والقياسية المخصصة لضبط أبعاد صفحة A4 (بدقة 96 PPI) وتكوين هوامش تخطيط السيناريو العربي (RTL). 
تكمن أهمية هذه الوحدة في توفير مصدر موحد (Single Source of Truth) للأبعاد للتحكم في التقسيم الصفحي (Pagination)، وحسابات مساحات العرض في المحرر (EditorArea)، وضبط الواجهة الجانبية (Sidebar)، وامتداد الصفحات في Tiptap.

## الثوابت المُصدَّرة (Exported Constants)

جميع الثوابت المُصدَّرة من نوع `number`.

### 1. أبعاد الصفحة والمحتوى
| اسم الثابت | الغرض |
| :--- | :--- |
| `PPI` | دقة الشاشة المستخدمة للتحويل من مليمتر إلى بكسل (96 نقطة لكل بوصة). |
| `PAGE_HEIGHT_PX` | الارتفاع الكلي لصفحة A4 بالبكسل (مُقرب رياضيًا، حوالي 1123px). |
| `PAGE_WIDTH_PX` | العرض الكلي لصفحة A4 بالبكسل (مُقرب رياضيًا، حوالي 794px). |
| `CONTENT_HEIGHT_PX` | الارتفاع الصافي المتاح للمحتوى (الارتفاع الكلي مطروحاً منه الهوامش العلوية والسفلية). |

### 2. هوامش الصفحة الداخلية (Page Margins)
| اسم الثابت | الغرض |
| :--- | :--- |
| `PAGE_MARGIN_TOP_PX` | الهامش العلوي للصفحة (77px). |
| `PAGE_MARGIN_BOTTOM_PX`| الهامش السفلي للصفحة (77px). |
| `PAGE_MARGIN_RIGHT_PX` | الهامش الأيمن للصفحة (120px - الجهة العريضة للتجليد في النصوص العربية). |
| `PAGE_MARGIN_LEFT_PX` | الهامش الأيسر للصفحة (96px). |

### 3. مساحات وتخطيط المحرر (Editor Layout & Spacing)
| اسم الثابت | الغرض |
| :--- | :--- |
| `HEADER_HEIGHT_PX` | ارتفاع المساحة المخصصة للترويسة. |
| `FOOTER_HEIGHT_PX` | ارتفاع المساحة المخصصة للتذييل. |
| `PAGE_GAP_PX` | المسافة الفاصلة بين كل صفحة وأخرى في واجهة المحرر. |
| `EDITOR_DOCUMENT_TOP_MARGIN_PX`| المسافة الثابتة بين أعلى المحرر وأول صفحة ظاهرة. |
| `EDITOR_DOCUMENT_BOTTOM_MARGIN_PX`| الهامش السفلي الثابت لمساحة المحرر الكلية. |

### 4. أبعاد الشريط الجانبي (Sidebar Desktop Dimensions)
| اسم الثابت | الغرض |
| :--- | :--- |
| `EDITOR_SIDEBAR_DESKTOP_WIDTH_PX` | عرض الشريط الجانبي على شاشات سطح المكتب. |
| `EDITOR_SIDEBAR_DESKTOP_RIGHT_PX` | الإزاحة اليمنى (Right offset) للشريط الجانبي. |
| `EDITOR_SIDEBAR_DESKTOP_TOP_PX` | الإزاحة العلوية (Top offset) للشريط الجانبي. |
| `EDITOR_SIDEBAR_DESKTOP_BOTTOM_PX`| الإزاحة السفلية (Bottom offset) للشريط الجانبي. |
| `EDITOR_SIDEBAR_DESKTOP_GAP_PX` | المسافة المحجوزة للفاصل بين الشريط الجانبي ومساحة الصفحات. |
| `EDITOR_SHELL_DESKTOP_MARGIN_RIGHT_PX`| الإزاحة اليمنى لحاوية الصفحات لإبعادها عن الشريط الجانبي. |

## الحالات الحدية والملاحظات (Edge Cases & Notes)
* **التقريب (Sub-pixel Rendering):** يتم استخدام `Math.round` عند حساب أبعاد A4 (`PAGE_HEIGHT_PX` و `PAGE_WIDTH_PX`) لمنع ظهور كسور عشرية في البكسلات، والتي قد تتسبب في تشوه العرض (Blurriness) أو أخطاء في حسابات التقسيم الصفحي في Tiptap.
* **تخطيط RTL:** الهامش الأيمن (`120px`) أعرض من الهامش الأيسر (`96px`) بشكل متعمد ليتوافق مع معايير كتابة السيناريو باللغة العربية، حيث يكون التجليد من جهة اليمين.

## مثال على الاستخدام

```typescript
import { 
  PAGE_WIDTH_PX, 
  PAGE_HEIGHT_PX, 
  CONTENT_HEIGHT_PX,
  PAGE_MARGIN_RIGHT_PX
} from '@/constants/page';

// 1. تطبيق الأبعاد على عنصر واجهة المستخدم (DOM Element)
const pageContainerStyle = {
  width: `${PAGE_WIDTH_PX}px`,
  height: `${PAGE_HEIGHT_PX}px`,
  paddingRight: `${PAGE_MARGIN_RIGHT_PX}px`
};

// 2. التحقق من تجاوز النص لمساحة المحتوى الصافية لإنشاء صفحة جديدة
function checkPagination(currentBlockHeight: number) {
  if (currentBlockHeight > CONTENT_HEIGHT_PX) {
    insertNewPageBreak();
  }
}
```
