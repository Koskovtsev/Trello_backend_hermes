import request from 'supertest';
import { app } from '../../src/server';

describe('POST /user', () => {
  test('should create a user', async () => {
    const res = await request(app)
      .post('/user')
      .send({ email: "vpupkin@example.com", password: "dfdfdf" });
    expect(res.status).toBe(201);
  });
});
