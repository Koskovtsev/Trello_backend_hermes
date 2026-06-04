import request from 'supertest';
import { app } from '../src/server';

describe('Trello Backend Lifecycle Integration Test', () => {
  let boardId: string;
  let listId: string;
  let cardId: string;
  const authHeader = { 'Authorization': 'Bearer 123' };

  // --- PHASE 1: CREATION ---
  test('1. Create a Board', async () => {
    const res = await request(app)
      .post('/board/')
      .set(authHeader)
      .send({ title: 'Lifecycle Board', custom: { background: 'blue' } });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    boardId = res.body.id;
    console.log(`Created Board ID: ${boardId}`);
  });

  test('2. Create a List on the Board', async () => {
    expect(boardId).toBeDefined();
    const res = await request(app)
      .post(`/board/${boardId}/list/`)
      .set(authHeader)
      .send({ title: 'To Do', position: 1 });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    listId = res.body.id;
    console.log(`Created List ID: ${listId}`);
  });

  test('3. Create a Card in the List', async () => {
    expect(boardId).toBeDefined();
    expect(listId).toBeDefined();
    const res = await request(app)
      .post(`/board/${boardId}/card/`)
      .set(authHeader)
      .send({ 
        title: 'Lifecycle Card', 
        description: 'Testing lifecycle', 
        listId: listId, 
        position: 1,
        custom: { background: 'green' }
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    cardId = res.body.id;
    console.log(`Created Card ID: ${cardId}`);
  });

  // --- PHASE 2: MODIFICATION ---
  test('4. Update Board Title', async () => {
    expect(boardId).toBeDefined();
    const res = await request(app)
      .put(`/board/${boardId}`)
      .set(authHeader)
      .send({ title: 'Updated Lifecycle Board' });
    
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Updated');
  });

  test('5. Update List Title', async () => {
    expect(boardId).toBeDefined();
    expect(listId).toBeDefined();
    const res = await request(app)
      .put(`/board/${boardId}/list/${listId}`)
      .set(authHeader)
      .send({ title: 'Updated To Do' });
    
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Updated');
  });

  test('6. Update Card Title', async () => {
    expect(boardId).toBeDefined();
    expect(cardId).toBeDefined();
    const res = await request(app)
      .put(`/board/${boardId}/card/${cardId}`)
      .set(authHeader)
      .send({ title: 'Updated Lifecycle Card' });
    
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Updated');
  });

  // --- PHASE 3: CLEANUP ---
  test('7. Delete the Card', async () => {
    expect(boardId).toBeDefined();
    expect(cardId).toBeDefined();
    const res = await request(app)
      .delete(`/board/${boardId}/card/${cardId}`)
      .set(authHeader);
    
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Deleted');
  });

  test('8. Delete the List', async () => {
    expect(boardId).toBeDefined();
    expect(listId).toBeDefined();
    const res = await request(app)
      .delete(`/board/${boardId}/list/${listId}`)
      .set(authHeader);
    
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Deleted');
  });

  test('9. Delete the Board', async () => {
    expect(boardId).toBeDefined();
    const res = await request(app)
      .delete(`/board/${boardId}`)
      .set(authHeader);
    
    expect(res.status).toBe(200);
    expect(res.body.result).toBe('Deleted');
  });
});
