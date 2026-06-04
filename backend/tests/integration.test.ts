
const request = require('supertest');
const { app } = require('../src/server');

describe('Trello Backend Integration Workflow', () => {
  let boardId, listId, cardId;
  const token = 'Bearer mock-token';

  test('01. Should create a board', async () => {
    const res = await request(app)
      .post('/board/')
      .set('Authorization', token)
      .send({ title: 'Test Board' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    boardId = res.body.id;
  });

  test('02. Should create a list', async () => {
    const res = await request(app)
      .post(`/board/${boardId}/list/`)
      .set('Authorization', token)
      .send({ title: 'Test List', position: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    listId = res.body.id;
  });

  test('03. Should create a card', async () => {
    const res = await request(app)
      .post(`/board/${boardId}/card/`)
      .set('Authorization', token)
      .send({ title: 'Test Card', description: 'Desc', listId: listId, position: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    cardId = res.body.id;
  });

  test('04. Should update card', async () => {
    const res = await request(app)
      .put(`/board/${boardId}/card/`) // Note: using the path we defined for mass update or specific? 
      // Based on server.ts logic earlier, we added /board/:id/card/ as a mass update. 
      // If we need specific card update, let's fix the route in server.ts.
      .set('Authorization', token)
      .send({ id: cardId, title: 'Updated Card' });
    expect(res.status).toBe(200);
  });

  test('05. Should delete card', async () => {
    const res = await request(app)
      .delete(`/board/${boardId}/card/${cardId}`)
      .set('Authorization', token);
    expect(res.status).toBe(200);
  });

  test('06. Should delete list', async () => {
    const res = await request(app)
      .delete(`/board/${boardId}/list/${listId}`)
      .set('Authorization', token);
    expect(res.status).toBe(200);
  });

  test('07. Should delete board', async () => {
    const res = await request(app)
      .delete(`/board/${boardId}`)
      .set('Authorization', token);
    expect(res.status).toBe(200);
  });
});
