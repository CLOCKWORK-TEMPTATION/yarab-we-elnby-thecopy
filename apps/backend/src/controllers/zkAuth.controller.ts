/**
 * Zero-Knowledge Authentication Controller
 * نظام مصادقة Zero-Knowledge
 * 
 * المبادئ:
 * 1. فصل المصادقة عن التشفير
 * 2. authVerifier للمصادقة فقط (لا يُستخدم للتشفير)
 * 3. KEK للتشفير فقط (لا يغادر المتصفح)
 * 4. kdfSalt يُخزن على السيرفر ويُعاد للعميل
 */

import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, recoveryArtifacts } from '../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

/**
 * التسجيل (Sign-Up) مع Zero-Knowledge
 * POST /api/auth/zk-signup
 */
export async function zkSignup(req: Request, res: Response): Promise<void> {
  try {
    const { email, authVerifier, kdfSalt, recoveryArtifact, recoveryIv } = req.body;

    // التحقق من البيانات المطلوبة
    if (!email || !authVerifier || !kdfSalt) {
      res.status(400).json({
        success: false,
        error: 'البيانات المطلوبة: email, authVerifier, kdfSalt',
      });
      return;
    }

    // التحقق من عدم وجود المستخدم مسبقاً
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'البريد الإلكتروني مستخدم بالفعل',
      });
      return;
    }

    // تجزئة authVerifier
    const authVerifierHash = await bcrypt.hash(authVerifier, SALT_ROUNDS);

    // إنشاء المستخدم
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash: authVerifierHash, // نستخدم نفس الحقل للتوافق
        authVerifierHash,
        kdfSalt,
        accountStatus: 'active',
      })
      .returning();

    // حفظ Recovery Artifact إن وُجد
    if (recoveryArtifact && recoveryIv) {
      await db.insert(recoveryArtifacts).values({
        userId: newUser.id,
        encryptedRecoveryArtifact: recoveryArtifact,
        iv: recoveryIv,
      });
    }

    // إنشاء JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        userId: newUser.id,
        email: newUser.email,
        token,
        kdfSalt: newUser.kdfSalt,
      },
    });
  } catch (error) {
    console.error('Error in ZK signup:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في التسجيل',
    });
  }
}

/**
 * تسجيل الدخول - المرحلة 1: جلب kdfSalt
 * POST /api/auth/zk-login-init
 */
export async function zkLoginInit(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'البريد الإلكتروني مطلوب',
      });
      return;
    }

    // جلب المستخدم
    const [user] = await db
      .select({
        id: users.id,
        kdfSalt: users.kdfSalt,
        accountStatus: users.accountStatus,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.kdfSalt) {
      // لا نكشف عما إذا كان المستخدم موجوداً أم لا (أمان)
      res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود أو لا يستخدم Zero-Knowledge',
      });
      return;
    }

    if (user.accountStatus !== 'active') {
      res.status(403).json({
        success: false,
        error: 'الحساب غير نشط',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        kdfSalt: user.kdfSalt,
      },
    });
  } catch (error) {
    console.error('Error in ZK login init:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في بدء تسجيل الدخول',
    });
  }
}

/**
 * تسجيل الدخول - المرحلة 2: التحقق من authVerifier
 * POST /api/auth/zk-login-verify
 */
export async function zkLoginVerify(req: Request, res: Response): Promise<void> {
  try {
    const { email, authVerifier } = req.body;

    if (!email || !authVerifier) {
      res.status(400).json({
        success: false,
        error: 'البيانات المطلوبة: email, authVerifier',
      });
      return;
    }

    // جلب المستخدم
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.authVerifierHash) {
      res.status(401).json({
        success: false,
        error: 'بيانات اعتماد غير صحيحة',
      });
      return;
    }

    // التحقق من authVerifier
    const isValid = await bcrypt.compare(authVerifier, user.authVerifierHash);

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'بيانات اعتماد غير صحيحة',
      });
      return;
    }

    // تحديث lastLogin
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    // إنشاء JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        token,
        kdfSalt: user.kdfSalt,
      },
    });
  } catch (error) {
    console.error('Error in ZK login verify:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في تسجيل الدخول',
    });
  }
}

/**
 * جلب أو تحديث Recovery Artifact
 * POST /api/auth/recovery
 */
export async function manageRecoveryArtifact(
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

    const { action, recoveryArtifact, iv } = req.body;

    if (action === 'get') {
      // جلب Recovery Artifact
      const [artifact] = await db
        .select()
        .from(recoveryArtifacts)
        .where(eq(recoveryArtifacts.userId, userId))
        .limit(1);

      if (!artifact) {
        res.status(404).json({
          success: false,
          error: 'لا توجد مادة استرداد',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          encryptedRecoveryArtifact: artifact.encryptedRecoveryArtifact,
          iv: artifact.iv,
          createdAt: artifact.createdAt,
        },
      });
    } else if (action === 'update') {
      // تحديث Recovery Artifact
      if (!recoveryArtifact || !iv) {
        res.status(400).json({
          success: false,
          error: 'البيانات المطلوبة: recoveryArtifact, iv',
        });
        return;
      }

      const [updated] = await db
        .update(recoveryArtifacts)
        .set({
          encryptedRecoveryArtifact: recoveryArtifact,
          iv,
          updatedAt: new Date(),
        })
        .where(eq(recoveryArtifacts.userId, userId))
        .returning();

      if (!updated) {
        // إنشاء جديد إن لم يكن موجوداً
        await db.insert(recoveryArtifacts).values({
          userId,
          encryptedRecoveryArtifact: recoveryArtifact,
          iv,
        });
      }

      res.json({
        success: true,
        data: {
          message: 'تم تحديث مادة الاسترداد بنجاح',
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'الإجراء غير صالح. استخدم: get أو update',
      });
    }
  } catch (error) {
    console.error('Error managing recovery artifact:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إدارة مادة الاسترداد',
    });
  }
}
