import request from 'supertest';
import { app } from '../../src/server';

describe('PUT /board/1/card/1/users', () => {
  test('should update card users', async () => {
    const res = await request(app)
      .put('/board/1/card/1/users')
      .set('Authorization', 'Bearer mock-token')
      .send({ add: [1, 2], remove: [3] });
    expect(res.status).toBe(200);
  });
});
