import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { app } from '@/server';

// Use app directly instead of httpServer for integration tests
const request = supertest(app);

describe('Controllers Integration Tests', () => {
  let token: string;
  let projectId: string;
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!',
  };

  beforeAll(async () => {
    // Wait for server initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create test user
    const signupResponse = await request
      .post('/api/auth/signup')
      .send(testUser)
      .expect(201);
    
    token = signupResponse.body.data.token;
    expect(token).toBeDefined();
  });

  describe('Auth Controller', () => {
    it('should login existing user', async () => {
      const response = await request
        .post('/api/auth/login')
        .send(testUser)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should get current user', async () => {
      const response = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });
  });

  describe('Projects Controller', () => {
    it('should create a new project', async () => {
      const response = await request
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          title: 'Test Project', 
          scriptContent: 'This is a test script.' 
        })
        .expect(201);
      
      expect(response.body.data.title).toBe('Test Project');
      projectId = response.body.data.id;
    });

    it('should get all projects', async () => {
      const response = await request
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Analysis Controller', () => {
    it('should get analysis stations info', async () => {
      const response = await request
        .get('/api/analysis/stations-info')
        .expect(200);
      
      expect(response.body.data).toBeDefined();
      expect(response.body.data.stations).toBeDefined();
    });
  });
});
