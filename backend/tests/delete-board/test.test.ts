import request from 'supertest';
import { app } from '../../src/server';

describe('DELETE /board/1', () => {
  test('should delete board', async () => {
    const res = await request(app)
      .delete('/board/1')
      .set('Authorization', 'Bearer mock-token');
    expect(res.status).toBe(200);
  });
});
