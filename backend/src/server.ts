import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

interface BigIntJSON {
  toJSON(): number;
}

(BigInt.prototype as unknown as BigIntJSON).toJSON = function toJSON(): number {
  return Number(this);
};

export const app = express();
const port = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key-456';

app.use(cors());
app.use(express.json());

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/mnt/i/AI/Trello_backend/backend/src/prisma/dev.db',
    },
  },
});

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const path = req.path.replace(/\/$/, '') || '/';
  if (path === '/login' || path === '/refresh' || path === '/user') {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const ensureJsonString = (val: unknown): string | null => {
  if (!val) return null;
  if (typeof val === 'string') {
    try {
      JSON.parse(val);
      return val;
    } catch {
      return JSON.stringify(val);
    }
  }
  return JSON.stringify(val);
};

const ensureJsonObject = (val: unknown): Record<string, unknown> => {
  if (!val) return {};
  if (typeof val === 'object' && val !== null) return val as Record<string, unknown>;
  try {
    const parsed = JSON.parse(String(val));
    return typeof parsed === 'string'
      ? (JSON.parse(parsed) as Record<string, unknown>)
      : (parsed as Record<string, unknown>);
  } catch {
    return {};
  }
};

const getParam = (param: unknown): unknown => {
  if (Array.isArray(param)) return param[0];
  return param !== undefined && param !== null ? param : '';
};

app.use(authenticate);

app.post('/user', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        id: Date.now(),
        email,
        username: email.split('@')[0],
        password: hashedPassword,
      },
    });
    res.status(201).json({ result: 'Created', id: user.id });
  } catch (e) {
    const error = e as Error;
    if ('code' in error && (error as Record<string, unknown>).code === 'P2002') {
      res.status(400).json({ error: 'User with this email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/user', async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername } = req.query as { emailOrUsername: string };
    if (!emailOrUsername) {
      res.status(400).json({ error: 'emailOrUsername query parameter required' });
      return;
    }
    const users = await prisma.user.findMany({
      where: {
        OR: [{ email: { contains: emailOrUsername } }, { username: { contains: emailOrUsername } }],
      },
      select: { id: true, username: true },
    });
    res.status(200).json(users);
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '5m' });
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.status(200).json({ result: 'Authorized', token, refreshToken });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const newToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '5m' });
    const newRefreshToken = jwt.sign({ userId: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.status(200).json({ result: 'Authorized', token: newToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

app.get('/board/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const boards = await prisma.boardUser.findMany({
      where: { userId },
      include: { board: true },
    });
    res.status(200).json({
      boards: boards.map((bu) => ({
        ...bu.board,
        custom: ensureJsonObject(bu.board.custom),
      })),
    });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.get('/board/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const boardId = Number(getParam(req.params.id));
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        users: { some: { userId } },
      },
      include: {
        users: { include: { user: true } },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: { users: { include: { user: true } } },
            },
          },
        },
      },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const boardData = {
      ...board,
      custom: ensureJsonObject(board.custom),
      users: board.users.map((bu) => bu.user),
      lists: board.lists.map((list) => ({
        ...list,
        custom: ensureJsonObject(list.custom),
        cards: list.cards.map((card) => ({
          ...card,
          list_id: card.listId,
          custom: ensureJsonObject(card.custom),
          users: card.users.map((cu) => cu.user.id),
          created_at: card.created_at ? Number(card.created_at) : Date.now(),
        })),
      })),
    };

    res.status(200).json(boardData);
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.post('/board/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { title, custom } = req.body as { title: string; custom?: unknown };
    const board = await prisma.board.create({
      data: {
        id: Date.now(),
        title,
        custom: ensureJsonString(custom),
        users: {
          create: { userId },
        },
      },
    });
    res.status(201).json({ result: 'Created', id: board.id });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.put('/board/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, custom } = req.body as { title?: string; custom?: unknown };
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (custom !== undefined) data.custom = ensureJsonString(custom);

    await prisma.board.update({
      where: { id: Number(getParam(req.params.id)) },
      data,
    });
    res.status(200).json({ result: 'Updated' });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.delete('/board/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const boardId = Number(getParam(req.params.id));
    await prisma.cardUser.deleteMany({ where: { card: { list: { boardId } } } });
    await prisma.boardUser.deleteMany({ where: { boardId } });
    await prisma.card.deleteMany({ where: { list: { boardId } } });
    await prisma.list.deleteMany({ where: { boardId } });
    await prisma.board.delete({ where: { id: boardId } });
    res.status(200).json({ result: 'Deleted' });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.post('/board/:id/list/', async (req: Request, res: Response): Promise<void> => {
  try {
    const boardId = Number(getParam(req.params.id));
    const { title, position } = req.body as { title: string; position?: number };
    const list = await prisma.list.create({
      data: { id: Date.now(), title, position, boardId },
    });
    res.status(201).json({ result: 'Created', id: list.id });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.put('/board/:id/list/', async (req: Request, res: Response): Promise<void> => {
  try {
    const lists = req.body as unknown[];
    if (!Array.isArray(lists)) {
      res.status(400).json({ error: 'Expected an array of lists' });
      return;
    }

    const updatePromises = lists.map((listItem) => {
      const data: Record<string, unknown> = {};
      const item = listItem as Record<string, unknown>;
      if (item.title !== undefined) data.title = item.title;
      if (item.position !== undefined) data.position = item.position;
      if (item.custom !== undefined) data.custom = ensureJsonString(item.custom);
      return prisma.list.update({
        where: { id: Number(getParam(item.id)) },
        data,
      });
    });

    await Promise.all(updatePromises);
    res.status(200).json({ result: 'Updated' });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.put('/board/:id/list/:listId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, position } = req.body as { title?: string; position?: number };
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (position !== undefined) data.position = position;

    await prisma.list.update({
      where: { id: Number(getParam(req.params.listId)) },
      data,
    });
    res.status(200).json({ result: 'Updated' });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.delete('/board/:id/list/:listId', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.list.delete({ where: { id: Number(getParam(req.params.listId)) } });
    res.status(200).json({ result: 'Deleted' });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.post('/board/:id/card/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      listId,
      list_id: listIdFromBody,
      position,
      color,
      custom,
    } = req.body as Record<string, unknown>;

    const listIdValue = listIdFromBody !== undefined ? listIdFromBody : listId;
    if (!listIdValue) {
      res.status(400).json({ error: 'Invalid or missing list ID' });
      return;
    }

    const targetListId = Number(listIdValue);
    let finalPosition = typeof position === 'number' ? position : null;

    if (finalPosition === null) {
      const lastCard = await prisma.card.findFirst({
        where: { listId: targetListId },
        orderBy: { position: 'desc' },
      });
      finalPosition = (lastCard?.position || 0) + 1;
    }

    const card = await prisma.card.create({
      data: {
        id: Date.now(),
        title: title as string,
        description: description as string,
        listId: targetListId,
        position: finalPosition,
        color: color as string,
        custom: ensureJsonString(custom),
        created_at: Date.now(),
      },
    });
    res.status(201).json({ result: 'Created', id: card.id });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.put('/board/:id/card/', async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = req.body as unknown[];
    if (!Array.isArray(cards)) {
      res.status(400).json({ error: 'Expected an array of cards' });
      return;
    }

    const updatePromises = cards.map((card) => {
      const item = card as Record<string, unknown>;
      const { listId, list_id: listIdFromBody } = item;
      const listIdValue = listIdFromBody !== undefined ? listIdFromBody : listId;

      const data: Record<string, unknown> = {};
      if (item.title !== undefined) data.title = item.title;
      if (item.description !== undefined) data.description = item.description;
      if (item.position !== undefined) data.position = item.position;
      if (item.color !== undefined) data.color = item.color;
      if (listIdValue !== undefined) data.listId = String(listIdValue);
      if (item.custom !== undefined) data.custom = ensureJsonString(item.custom);

      return prisma.card.update({
        where: { id: Number(getParam(item.id)) },
        data,
      });
    });

    await Promise.all(updatePromises);
    res.status(200).json({ result: 'Updated' });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.put('/board/:id/card/:cardId', async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = Number(getParam(req.params.cardId));
    const { title, description, position, color, custom, list_id: listIdFromBody } = req.body as Record<string, unknown>;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (position !== undefined) data.position = position;
    if (color !== undefined) data.color = color;
    if (custom !== undefined) data.custom = ensureJsonString(custom);
    if (listIdFromBody !== undefined) data.listId = String(listIdFromBody);

    await prisma.card.update({
      where: { id: cardId },
      data,
    });
    res.status(200).json({ result: 'Updated' });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.delete('/board/:id/card/:cardId', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.card.delete({ where: { id: Number(getParam(req.params.cardId)) } });
    res.status(200).json({ result: 'Deleted' });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.put('/board/:id/card/:cardId/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = Number(getParam(req.params.cardId));
    const { add, remove } = req.body as { add: string[]; remove: string[] };

    if (remove && remove.length > 0) {
      await prisma.cardUser.deleteMany({
        where: { cardId, userId: { in: remove.map((id) => BigInt(id)) } },
      });
    }

    if (add && add.length > 0) {
      const operations = add.map((userId) =>
        prisma.cardUser.upsert({
          where: { cardId_userId: { cardId, userId: BigInt(userId) } },
          update: {},
          create: { cardId, userId: BigInt(userId) },
        })
      );
      await prisma.$transaction(operations);
    }

    res.status(200).json({ result: 'Updated' });
  } catch (e) {
    const error = e as Error;
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});
