import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/auth.service';
import type { User } from '@/db/schema';

/**
 * واجهة الطلب المصادق عليه
 * 
 * @description
 * توسيع لواجهة Request من Express لتشمل بيانات المستخدم بعد التحقق من الهوية
 */
export interface AuthRequest extends Request {
  /** معرف المستخدم الفريد */
  userId?: string;
  /** بيانات المستخدم كاملة (بدون كلمة المرور) */
  user?: Omit<User, 'passwordHash'>;
}

/**
 * استخراج قيمة المعرّف من معاملات الطلب بشكل آمن
 * 
 * @description
 * Express 5 يُرجع params كـ string | string[] - هذه الدالة تضمن إرجاع string فقط
 * 
 * @param paramValue - قيمة المعامل من req.params
 * @returns القيمة كـ string أو undefined إذا كانت مصفوفة
 */
export function getParamAsString(paramValue: string | string[] | undefined): string | undefined {
  if (Array.isArray(paramValue)) {
    return paramValue[0];
  }
  return paramValue;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    const { userId } = authService.verifyToken(token);
    const user = await authService.getUserById(userId);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'المستخدم غير موجود' });
    }

    req.userId = userId;
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'رمز التحقق غير صالح' });
  }
};
