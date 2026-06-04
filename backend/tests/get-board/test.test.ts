import request from 'supertest';
import { app } from '../../src/server';

describe('GET /board/1', () => {
  test('should get board', async () => {
    const res = await request(app)
      .get('/board/1')
      .set('Authorization', 'Bearer mock-token');
    expect(res.status).toBe(200);
  });
});
