import request from 'supertest';
import { app } from '../../src/server';

describe('PUT /board/1/list/1', () => {
  test('should update list', async () => {
    const res = await request(app)
      .put('/board/1/list/1')
      .set('Authorization', 'Bearer mock-token')
      .send({ position: 1 });
    expect(res.status).toBe(200);
  });
});
