import request from 'supertest';
import { app } from '../../src/server';

describe('POST /login', () => {
  test('should login', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: "vpupkin@example.com", password: "dfdfdf" });
    expect(res.status).toBe(200);
  });
});
