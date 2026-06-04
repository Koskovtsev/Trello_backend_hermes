import request from 'supertest';
import { app } from '../src/server';

describe('Trello Backend Full Specification Test', () => {
  let boardId: string;
  let listId: string;
  let cardId: string;
  let userId: string;
  const authHeader = { 'Authorization': 'Bearer 123' };

  // --- SETUP ---
  test('Setup: Create a User', async () => {
    const res = await request(app)
      .post('/user/')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(201);
    userId = res.body.id;
  });

  // --- BOARD ---
  test('Board: Create', async () => {
    const res = await request(app)
      .post('/board/')
      .set(authHeader)
      .send({ title: 'Spec Board', custom: { description: 'Spec Desc' } });
    expect(res.status).toBe(201);
    expect(res.body.result).toBe('Created');
    boardId = res.body.id;
  });

  test('Board: Get All', async () => {
    const res = await request(app)
      .get('/board/')
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.boards)).toBe(true);
    expect(res.body.boards.some((b: any) => b.id === boardId)).toBe(true);
  });

  test('Board: Get Detail', async () => {
    const res = await request(app)
      .get(`/board/${boardId}`)
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Spec Board');
    expect(res.body.custom.description).toBe('Spec Desc');
  });

  test('Board: Update', async () => {
    const res = await request(app)
      .put(`/board/${boardId}`)
      .set(authHeader)
      .send({ title: 'Updated Spec Board' });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Updated');
  });

  // --- LIST ---
  test('List: Create', async () => {
    const res = await request(app)
      .post(`/board/${boardId}/list/`)
      .set(authHeader)
      .send({ title: 'Spec List', position: 1 });
    expect(res.status).toBe(201);
    expect(res.body.result).toBe('Created');
    listId = res.body.id;
  });

  test('List: Update Single', async () => {
    const res = await request(app)
      .put(`/board/${boardId}/list/${listId}`)
      .set(authHeader)
      .send({ position: 2 });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Updated');
  });

  test('List: Update Group', async () => {
    const res = await request(app)
      .put(`/board/${boardId}/list/`)
      .set(authHeader)
      .send([{ id: listId, position: 3 }]);
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Updated');
  });

  // --- CARD ---
  test('Card: Create', async () => {
    const res = await request(app)
      .post(`/board/${boardId}/card/`)
      .set(authHeader)
      .send({ 
        title: 'Spec Card', 
        list_id: listId, 
        position: 1, 
        description: 'Spec Desc',
        custom: { deadline: '2022-08-31' }
      });
    expect(res.status).toBe(201);
    expect(res.body.result).toBe('Created');
    cardId = res.body.id;
  });

  test('Card: Update Single', async () => {
    const res = await request(app)
      .put(`/board/${boardId}/card/${cardId}`)
      .set(authHeader)
      .send({ title: 'Updated Spec Card', list_id: listId });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Updated');
  });

  test('Card: Update Group', async () => {
    const res = await request(app)
      .put(`/board/${boardId}/card/`)
      .set(authHeader)
      .send([{ id: cardId, position: 2, list_id: listId }]);
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Updated');
  });

  test('Card: Update Users', async () => {
    const res = await request(app)
      .put(`/board/${boardId}/card/${cardId}/users`)
      .set(authHeader)
      .send({ add: [userId], remove: [] });
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Updated');
  });

  // --- USER ---
  test('User: Get by ID', async () => {
    const res = await request(app)
      .get(`/board/${boardId}/user/${userId}`)
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
  });

  test('User: Search', async () => {
    const res = await request(app)
      .get('/user')
      .set(authHeader)
      .query({ emailOrUsername: 'test' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  // --- CLEANUP ---
  test('Cleanup: Delete Board', async () => {
    const res = await request(app)
      .delete(`/board/${boardId}`)
      .set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Deleted');
  });
});
