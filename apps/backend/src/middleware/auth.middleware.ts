import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/auth.service';

/**
 * نوع الطلب المصادق عليه
 * 
 * @description
 * اسم مستعار لـ Request — الخصائص userId و user مُعرّفة عبر module augmentation
 * في global.d.ts، لذا كل Request يحملها تلقائياً بعد مرور وسيط المصادقة.
 * 
 * @deprecated استخدم Request مباشرة — هذا الاسم المستعار للتوافق مع الكود القديم فقط
 */
export type AuthRequest = Request;

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

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      res.status(401).json({ success: false, error: 'غير مصرح - يرجى تسجيل الدخول' });
      return;
    }

    const { userId } = authService.verifyToken(token);
    const user = await authService.getUserById(userId);
    
    if (!user) {
      res.status(401).json({ success: false, error: 'المستخدم غير موجود' });
      return;
    }

    req.userId = userId;
    req.user = user as Express.Request['user'];
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'رمز التحقق غير صالح' });
  }
};
