import request from 'supertest';
import { app } from '../../src/server';

describe('PUT /board/1/card/1', () => {
  test('should update card', async () => {
    const res = await request(app)
      .put('/board/1/card/1')
      .set('Authorization', 'Bearer mock-token')
      .send({ title: 'to pet a cat' });
    expect(res.status).toBe(200);
  });
});
