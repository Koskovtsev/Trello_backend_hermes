import request from 'supertest';
import { app } from '../../src/server';

describe('PUT /board/1/list', () => {
  test('should update lists', async () => {
    const res = await request(app)
      .put('/board/1/list')
      .set('Authorization', 'Bearer mock-token')
      .send([{ id: 1, position: 1 }, { id: 2, position: 2 }]);
    expect(res.status).toBe(200);
  });
});
