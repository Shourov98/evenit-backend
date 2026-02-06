import request from 'supertest';
import { app } from '../../app/app';

describe('Auth module', () => {
  it('should return 404 for unknown auth route', async () => {
    const response = await request(app).get('/api/v1/auth/unknown');
    expect(response.status).toBe(404);
  });
});
