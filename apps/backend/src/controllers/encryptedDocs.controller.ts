/**
 * Encrypted Documents Controller
 * Zero-Knowledge Document Management
 * 
 * المبادئ:
 * 1. رفض أي payload غير مشفر
 * 2. عدم فك أو تحليل أي محتوى
 * 3. CRUD على blobs مشفرة فقط
 */

import type { Request, Response } from 'express';
import { db } from '../db';
import { encryptedDocuments } from '../db/zkSchema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * التحقق من صحة البيانات المشفرة
 */
function validateEncryptedPayload(data: unknown): {
  valid: boolean;
  error?: string;
} {
  const payload = data as Record<string, unknown>;

  // التحقق من وجود الحقول الإلزامية
  if (!payload.ciphertext || typeof payload.ciphertext !== 'string') {
    return { valid: false, error: 'مفقود أو غير صالح: ciphertext' };
  }

  if (!payload.iv || typeof payload.iv !== 'string') {
    return { valid: false, error: 'مفقود أو غير صالح: iv' };
  }

  if (!payload.wrappedDEK || typeof payload.wrappedDEK !== 'string') {
    return { valid: false, error: 'مفقود أو غير صالح: wrappedDEK' };
  }

  if (!payload.wrappedDEKiv || typeof payload.wrappedDEKiv !== 'string') {
    return { valid: false, error: 'مفقود أو غير صالح: wrappedDEKiv' };
  }

  if (!payload.authTag || typeof payload.authTag !== 'string') {
    return { valid: false, error: 'مفقود أو غير صالح: authTag' };
  }

  if (!payload.version || typeof payload.version !== 'number') {
    return { valid: false, error: 'مفقود أو غير صالح: version' };
  }

  // التحقق من أن البيانات تبدو مشفرة (base64)
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(payload.ciphertext as string)) {
    return { valid: false, error: 'البيانات لا تبدو مشفرة' };
  }

  return { valid: true };
}

/**
 * إنشاء مستند مشفر جديد
 * POST /api/docs
 */
export async function createEncryptedDocument(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'غير مصرح. يرجى تسجيل الدخول.',
      });
      return;
    }

    // التحقق من صحة البيانات المشفرة
    const validation = validateEncryptedPayload(req.body);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error,
      });
      return;
    }

    const { ciphertext, iv, authTag, wrappedDEK, wrappedDEKiv, version } = req.body;

    // حساب حجم النص المشفر
    const ciphertextSize = ciphertext.length;

    // إنشاء المستند
    const [document] = await db
      .insert(encryptedDocuments)
      .values({
        userId,
        ciphertext,
        iv,
        authTag,
        wrappedDEK,
        wrappedDEKiv,
        version,
        ciphertextSize,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        id: document.id,
        version: document.version,
        ciphertextSize: document.ciphertextSize,
        createdAt: document.createdAt,
        lastModified: document.lastModified,
      },
    });
  } catch (error) {
    console.error('Error creating encrypted document:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء المستند',
    });
  }
}

/**
 * جلب مستند مشفر
 * GET /api/docs/:id
 */
export async function getEncryptedDocument(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'غير مصرح. يرجى تسجيل الدخول.',
      });
      return;
    }

    // جلب المستند (التحقق من الملكية)
    const [document] = await db
      .select()
      .from(encryptedDocuments)
      .where(
        and(eq(encryptedDocuments.id, id), eq(encryptedDocuments.userId, userId))
      )
      .limit(1);

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'المستند غير موجود',
      });
      return;
    }

    // إرجاع الحزمة المشفرة فقط
    res.json({
      success: true,
      data: {
        id: document.id,
        ciphertext: document.ciphertext,
        iv: document.iv,
        wrappedDEK: document.wrappedDEK,
        wrappedDEKiv: document.wrappedDEKiv,
        version: document.version,
        ciphertextSize: document.ciphertextSize,
        createdAt: document.createdAt,
        lastModified: document.lastModified,
      },
    });
  } catch (error) {
    console.error('Error fetching encrypted document:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب المستند',
    });
  }
}

/**
 * تحديث مستند مشفر
 * PUT /api/docs/:id
 */
export async function updateEncryptedDocument(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'غير مصرح. يرجى تسجيل الدخول.',
      });
      return;
    }

    // التحقق من صحة البيانات المشفرة
    const validation = validateEncryptedPayload(req.body);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error,
      });
      return;
    }

    const { ciphertext, iv, wrappedDEK, wrappedDEKiv, version } = req.body;

    // التحقق من وجود المستند والملكية
    const [existingDoc] = await db
      .select()
      .from(encryptedDocuments)
      .where(
        and(eq(encryptedDocuments.id, id), eq(encryptedDocuments.userId, userId))
      )
      .limit(1);

    if (!existingDoc) {
      res.status(404).json({
        success: false,
        error: 'المستند غير موجود',
      });
      return;
    }

    // حساب حجم النص المشفر
    const ciphertextSize = ciphertext.length;

    // تحديث المستند
    const [updated] = await db
      .update(encryptedDocuments)
      .set({
        ciphertext,
        iv,
        wrappedDEK,
        wrappedDEKiv,
        version,
        ciphertextSize,
        lastModified: new Date(),
      })
      .where(
        and(eq(encryptedDocuments.id, id), eq(encryptedDocuments.userId, userId))
      )
      .returning();

    res.json({
      success: true,
      data: {
        id: updated.id,
        version: updated.version,
        ciphertextSize: updated.ciphertextSize,
        lastModified: updated.lastModified,
      },
    });
  } catch (error) {
    console.error('Error updating encrypted document:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في تحديث المستند',
    });
  }
}

/**
 * حذف مستند مشفر
 * DELETE /api/docs/:id
 */
export async function deleteEncryptedDocument(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'غير مصرح. يرجى تسجيل الدخول.',
      });
      return;
    }

    // حذف المستند (مع التحقق من الملكية)
    const [deleted] = await db
      .delete(encryptedDocuments)
      .where(
        and(eq(encryptedDocuments.id, id), eq(encryptedDocuments.userId, userId))
      )
      .returning();

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'المستند غير موجود',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: deleted.id,
      },
    });
  } catch (error) {
    console.error('Error deleting encrypted document:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في حذف المستند',
    });
  }
}

/**
 * قائمة المستندات (metadata فقط)
 * GET /api/docs
 */
export async function listEncryptedDocuments(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'غير مصرح. يرجى تسجيل الدخول.',
      });
      return;
    }

    // جلب قائمة المستندات (metadata فقط - بدون محتوى)
    const documents = await db
      .select({
        id: encryptedDocuments.id,
        version: encryptedDocuments.version,
        ciphertextSize: encryptedDocuments.ciphertextSize,
        createdAt: encryptedDocuments.createdAt,
        lastModified: encryptedDocuments.lastModified,
      })
      .from(encryptedDocuments)
      .where(eq(encryptedDocuments.userId, userId))
      .orderBy(desc(encryptedDocuments.lastModified));

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Error listing encrypted documents:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب قائمة المستندات',
    });
  }
}
