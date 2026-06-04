const request = require('supertest');
const { app } = require('../../src/server');

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
    expect(res.statusCode).toBe(201); // Or whatever status
    expect(res.body).toBeDefined();
  });
});
