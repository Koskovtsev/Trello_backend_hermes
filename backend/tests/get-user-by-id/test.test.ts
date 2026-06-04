import request from 'supertest';
import { app } from '../../src/server';

describe('GET /board/1/user/1', () => {
  test('should get user by id', async () => {
    const res = await request(app)
      .get('/board/1/user/1')
      .set('Authorization', 'Bearer mock-token');
    expect(res.status).toBe(200);
  });
});
