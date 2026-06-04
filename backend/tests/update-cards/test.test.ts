import request from 'supertest';
import { app } from '../../src/server';

describe('PUT /board/1/card', () => {
  test('should update cards', async () => {
    const res = await request(app)
      .put('/board/1/card')
      .set('Authorization', 'Bearer mock-token')
      .send([{ id: 1, position: 3, list_id: 2 }, { id: 2, position: 1, list_id: 1 }]);
    expect(res.status).toBe(200);
  });
});
