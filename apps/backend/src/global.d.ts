/**
 * توسيعات TypeScript العامة للمشروع
 * Global TypeScript type augmentations for the project
 */

declare global {
    // توسيع namespace Express لإضافة خاصية user إلى Request
    // Extend Express namespace to add user property to Request
    namespace Express {
        interface Request {
            // بيانات المستخدم المصادق - يتم تعيينها بواسطة middleware المصادقة
            // Authenticated user data - set by authentication middleware
            user?: {
                id: string;
                email: string;
                firstName?: string;
                lastName?: string;
            };
        }
    }
}

// تصدير فارغ لجعل الملف module بدلاً من script
// Empty export to make this file a module instead of a script
export { };
