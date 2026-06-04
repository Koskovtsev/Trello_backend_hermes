import request from 'supertest';
import { app } from '../../src/server';

describe('POST /refresh', () => {
  test('should refresh', async () => {
    const res = await request(app)
      .post('/refresh')
      .send({ refreshToken: 'sdkfjd' });
    expect(res.status).toBe(200);
  });
});
