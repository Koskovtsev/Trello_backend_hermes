import request from 'supertest';
import { app } from '../../src/server';

describe('GET /user', () => {
  test('should search user', async () => {
    const res = await request(app)
      .get('/user')
      .query({ emailOrUsername: 'kbo' });
    expect(res.status).toBe(200);
  });
});
