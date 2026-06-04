import request from 'supertest';
import { app } from '../../src/server';

describe('POST /board/:id/list', () => {
  test('should create a list', async () => {
    const res = await request(app)
      .post('/board/1/list')
      .set('Authorization', 'Bearer mock-token')
      .send({ title: 'Done', position: 2 });
    expect(res.status).toBe(201);
  });
});
