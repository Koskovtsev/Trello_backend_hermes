const request = require('supertest');
const { app } = require('../src/server');

describe('Server API', () => {
  test('POST /user should create a user', async () => {
    const res = await request(app)
      .post('/user')
      .send({ email: 'test@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
