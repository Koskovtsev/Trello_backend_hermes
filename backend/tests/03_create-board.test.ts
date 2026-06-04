import request from 'supertest';
import { app } from '../src/server';

describe('POST /board', () => {
  test('should create a board', async () => {
    const data = {
      title: "1q",
      custom: { background: "gray" }
    };
    const res = await request(app)
      .post('/board')
      .set('Authorization', 'Bearer 123')
      .send(data);
    expect(res.status).toBe(201);
  });
});
