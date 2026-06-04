import request from 'supertest';
import { app } from '../src/server';

describe('Card Menu Functionality Test', () => {
  let boardId: string;
  let listId: string;
  let cardId: string;
  const authHeader = { 'Authorization': 'Bearer 123' };

  test('Setup: Create Board and Card', async () => {
    const boardRes = await request(app)
      .post('/board/')
      .set(authHeader)
      .send({ title: 'Menu Test Board' });
    boardId = boardRes.body.id;

    const listRes = await request(app)
      .post(`/board/${boardId}/list/`)
      .set(authHeader)
      .send({ title: 'Menu Test List' });
    listId = listRes.body.id;

    const cardRes = await request(app)
      .post(`/board/${boardId}/card/`)
      .set(authHeader)
      .send({ 
        title: 'Menu Test Card', 
        list_id: listId, 
        custom: { background: 'red' } 
      });
    cardId = cardRes.body.id;
  });

  test('Verify Card Menu Data (GET /board/:id)', async () => {
    const res = await request(app)
      .get(`/board/${boardId}`)
      .set(authHeader);
    
    expect(res.status).toBe(200);
    
    const board = res.body;
    const list = board.lists.find((l: any) => l.id === listId);
    expect(list).toBeDefined();
    
    const card = list.cards.find((c: any) => c.id === cardId);
    expect(card).toBeDefined();
    
    // The frontend expects these fields to be present and non-null for the menu to open
    expect(card).toHaveProperty('id');
    expect(card).toHaveProperty('list_id');
    expect(card).toHaveProperty('custom');
    expect(typeof card.custom).toBe('object');
    expect(card.custom).not.toBeNull();
  });

  test('Cleanup', async () => {
    await request(app).delete(`/board/${boardId}`).set(authHeader);
  });
});
