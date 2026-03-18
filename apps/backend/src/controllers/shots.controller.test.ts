import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shotsController } from './shots.controller';
import { Request, Response } from 'express';
import { z } from 'zod';

// Mock dependencies
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('@/db/schema', () => ({
  shots: { id: 'shots.id', sceneId: 'shots.sceneId' },
  scenes: { id: 'scenes.id', projectId: 'scenes.projectId' },
  projects: { id: 'projects.id', userId: 'projects.userId' },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  desc: vi.fn((col) => ({ col, direction: 'desc' })),
  and: vi.fn((...conds) => ({ conditions: conds })),
}));

describe('ShotsController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockDb: any;

  beforeEach(async () => {
    mockRequest = {
      params: {},
      body: {},
      user: { id: 'user-123' },
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    const dbModule = await import('@/db');
    mockDb = dbModule.db;

    vi.clearAllMocks();
  });

  describe('getShots', () => {
    it('should return shots for authorized user', async () => {
      const mockShots = [
        { id: 'shot-1', title: 'Shot 1', sceneId: 'scene-1' },
        { id: 'shot-2', title: 'Shot 2', sceneId: 'scene-1' },
      ];

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            orderBy: vi.fn().mockReturnValueOnce(mockShots),
          }),
        }),
      });

      mockRequest.params = { sceneId: 'scene-1' };

      await shotsController.getShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockShots,
      });
    });

    it('should return 401 for unauthorized user', async () => {
      mockRequest.user = undefined;

      mockRequest.params = { sceneId: 'scene-1' };

      await shotsController.getShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'غير مصرح',
      });
    });

    it('should return 400 when scene ID is missing', async () => {
      mockRequest.params = {};

      await shotsController.getShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'معرف المشهد مطلوب',
      });
    });

    it('should handle database errors gracefully', async () => {
      mockDb.select.mockRejectedValueOnce(new Error('Database error'));

      mockRequest.params = { sceneId: 'scene-1' };

      await shotsController.getShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'حدث خطأ أثناء جلب اللقطات',
      });
    });

    it('should order shots by orderIndex in ascending order', async () => {
      const mockShots = [
        { id: 'shot-1', orderIndex: 1 },
        { id: 'shot-2', orderIndex: 2 },
      ];

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            orderBy: vi.fn().mockReturnValueOnce(mockShots),
          }),
        }),
      });

      mockRequest.params = { sceneId: 'scene-1' };

      await shotsController.getShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockDb.orderBy).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('getShot', () => {
    it('should return shot for authorized user', async () => {
      const mockShot = { id: 'shot-1', title: 'Test Shot', sceneId: 'scene-1' };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([mockShot]),
        }),
      });

      mockRequest.params = { id: 'shot-1' };

      await shotsController.getShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockShot,
      });
    });

    it('should return 401 for unauthorized user', async () => {
      mockRequest.user = undefined;

      mockRequest.params = { id: 'shot-1' };

      await shotsController.getShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'غير مصرح',
      });
    });

    it('should return 400 when shot ID is missing', async () => {
      mockRequest.params = {};

      await shotsController.getShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'معرف اللقطة مطلوب',
      });
    });

    it('should return 404 when shot not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([]),
        }),
      });

      mockRequest.params = { id: 'nonexistent-shot' };

      await shotsController.getShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'اللقطة غير موجودة',
      });
    });

    it('should verify shot ownership through project', async () => {
      const mockShot = { id: 'shot-1', title: 'Test Shot', sceneId: 'scene-1' };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([mockShot]),
        }),
      });

      mockRequest.params = { id: 'shot-1' };

      await shotsController.getShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockDb.and).toHaveBeenCalled();
    });
  });

  describe('createShot', () => {
    it('should create shot with valid data', async () => {
      const shotData = {
        title: 'New Shot',
        description: 'Shot description',
        sceneId: 'scene-1',
        orderIndex: 1,
      };

      const createdShot = { id: 'new-shot', ...shotData };

      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockReturnValueOnce([createdShot]),
        }),
      });

      mockRequest.body = shotData;

      await shotsController.createShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم إنشاء اللقطة بنجاح',
        data: createdShot,
      });
    });

    it('should return 401 for unauthorized user', async () => {
      mockRequest.user = undefined;

      mockRequest.body = { title: 'New Shot', sceneId: 'scene-1' };

      await shotsController.createShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'غير مصرح',
      });
    });

    it('should validate shot data using Zod schema', async () => {
      const invalidData = {
        title: '', // Empty title
        sceneId: 'scene-1',
      };

      mockRequest.body = invalidData;

      await shotsController.createShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'بيانات غير صالحة',
        details: expect.any(Array),
      });
    });

    it('should handle database insertion failure', async () => {
      const shotData = {
        title: 'New Shot',
        sceneId: 'scene-1',
      };

      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockReturnValueOnce([]),
        }),
      });

      mockRequest.body = shotData;

      await shotsController.createShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'فشل إنشاء اللقطة',
      });
    });

    it('should work with minimal required data', async () => {
      const shotData = {
        title: 'Minimal Shot',
        sceneId: 'scene-1',
      };

      const createdShot = { id: 'new-shot', ...shotData };

      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockReturnValueOnce([createdShot]),
        }),
      });

      mockRequest.body = shotData;

      await shotsController.createShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateShot', () => {
    it('should update shot with valid data', async () => {
      const updateData = {
        title: 'Updated Shot Title',
        description: 'Updated description',
      };

      const existingShot = { id: 'shot-1', title: 'Old Title', sceneId: 'scene-1' };
      const updatedShot = { ...existingShot, ...updateData };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([existingShot]),
        }),
      });

      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockReturnValueOnce([updatedShot]),
          }),
        }),
      });

      mockRequest.params = { id: 'shot-1' };
      mockRequest.body = updateData;

      await shotsController.updateShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم تحديث اللقطة بنجاح',
        data: updatedShot,
      });
    });

    it('should return 401 for unauthorized user', async () => {
      mockRequest.user = undefined;

      mockRequest.params = { id: 'shot-1' };
      mockRequest.body = { title: 'Updated Title' };

      await shotsController.updateShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'غير مصرح',
      });
    });

    it('should return 400 when shot ID is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = { title: 'Updated Title' };

      await shotsController.updateShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'معرف اللقطة مطلوب',
      });
    });

    it('should return 404 when shot not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([]),
        }),
      });

      mockRequest.params = { id: 'nonexistent-shot' };
      mockRequest.body = { title: 'Updated Title' };

      await shotsController.updateShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'اللقطة غير موجودة',
      });
    });

    it('should validate update data using Zod schema', async () => {
      const existingShot = { id: 'shot-1', title: 'Old Title', sceneId: 'scene-1' };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([existingShot]),
        }),
      });

      mockRequest.params = { id: 'shot-1' };
      mockRequest.body = {
        title: '', // Invalid: empty title
      };

      await shotsController.updateShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'بيانات غير صالحة',
        details: expect.any(Array),
      });
    });

    it('should update only provided fields', async () => {
      const existingShot = { id: 'shot-1', title: 'Old Title', description: 'Old Desc', sceneId: 'scene-1' };
      const updateData = { title: 'New Title' }; // Only updating title

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([existingShot]),
        }),
      });

      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockReturnValueOnce([{ ...existingShot, ...updateData }]),
          }),
        }),
      });

      mockRequest.params = { id: 'shot-1' };
      mockRequest.body = updateData;

      await shotsController.updateShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('deleteShot', () => {
    it('should delete shot successfully', async () => {
      const existingShot = { id: 'shot-1', title: 'Test Shot', sceneId: 'scene-1' };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([existingShot]),
        }),
      });

      mockDb.delete.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce(undefined),
      });

      mockRequest.params = { id: 'shot-1' };

      await shotsController.deleteShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم حذف اللقطة بنجاح',
      });
    });

    it('should return 401 for unauthorized user', async () => {
      mockRequest.user = undefined;

      mockRequest.params = { id: 'shot-1' };

      await shotsController.deleteShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'غير مصرح',
      });
    });

    it('should return 400 when shot ID is missing', async () => {
      mockRequest.params = {};

      await shotsController.deleteShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'معرف اللقطة مطلوب',
      });
    });

    it('should return 404 when shot not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([]),
        }),
      });

      mockRequest.params = { id: 'nonexistent-shot' };

      await shotsController.deleteShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'اللقطة غير موجودة',
      });
    });

    it('should verify shot ownership through project', async () => {
      const existingShot = { id: 'shot-1', title: 'Test Shot', sceneId: 'scene-1' };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([existingShot]),
        }),
      });

      mockDb.delete.mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce(undefined),
      });

      mockRequest.params = { id: 'shot-1' };

      await shotsController.deleteShot(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockDb.and).toHaveBeenCalled();
    });
  });

  describe('reorderShots', () => {
    it('should reorder shots successfully', async () => {
      const reorderData = [
        { id: 'shot-1', orderIndex: 2 },
        { id: 'shot-2', orderIndex: 1 },
      ];

      const mockScene = { id: 'scene-1', projectId: 'project-1' };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([mockScene]),
        }),
      });

      mockDb.update.mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce(undefined),
        }),
      });

      mockRequest.params = { sceneId: 'scene-1' };
      mockRequest.body = { shots: reorderData };

      await shotsController.reorderShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم إعادة ترتيب اللقطات بنجاح',
      });
    });

    it('should return 401 for unauthorized user', async () => {
      mockRequest.user = undefined;

      mockRequest.params = { sceneId: 'scene-1' };
      mockRequest.body = { shots: [] };

      await shotsController.reorderShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'غير مصرح',
      });
    });

    it('should return 400 when scene ID is missing', async () => {
      mockRequest.params = {};
      mockRequest.body = { shots: [] };

      await shotsController.reorderShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'معرف المشهد مطلوب',
      });
    });

    it('should return 404 when scene not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([]),
        }),
      });

      mockRequest.params = { sceneId: 'nonexistent-scene' };
      mockRequest.body = { shots: [] };

      await shotsController.reorderShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'المشهد غير موجود',
      });
    });

    it('should validate reorder data using Zod schema', async () => {
      const mockScene = { id: 'scene-1', projectId: 'project-1' };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([mockScene]),
        }),
      });

      mockRequest.params = { sceneId: 'scene-1' };
      mockRequest.body = {
        shots: [
          { id: '', orderIndex: 1 }, // Invalid: empty id
        ],
      };

      await shotsController.reorderShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'بيانات غير صالحة',
        details: expect.any(Array),
      });
    });

    it('should handle empty shots array', async () => {
      const mockScene = { id: 'scene-1', projectId: 'project-1' };

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce([mockScene]),
        }),
      });

      mockRequest.params = { sceneId: 'scene-1' };
      mockRequest.body = { shots: [] };

      await shotsController.reorderShots(
        mockRequest as any,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم إعادة ترتيب اللقطات بنجاح',
      });
    });
  });
});