import request from 'supertest';
import { app } from '../../src/server';

describe('PUT /board/1', () => {
  test('should update board', async () => {
    const res = await request(app)
      .put('/board/1')
      .set('Authorization', 'Bearer mock-token')
      .send({ title: 'to-do-s' });
    expect(res.status).toBe(200);
  });
});
