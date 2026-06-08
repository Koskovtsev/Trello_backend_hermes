import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Перевірка завантаження ключів при старті
if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  console.error('❌ CRITICAL ERROR: JWT_SECRET or REFRESH_TOKEN_SECRET not found in .env file!');
  process.exit(1);
} else {
  console.log('✅ Env secrets loaded successfully.');
}

interface BigIntJSON {
  toJSON(): number;
}

(BigInt.prototype as unknown as BigIntJSON).toJSON = function toJSON(): number {
  return Number(this);
};

export const app = express();
const port = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

app.use(cors());
app.use(express.json());

// Нормалізація шляхів: прибираємо кінцевий слеш, щоб /user/password/ працював як /user/password
app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) {
    req.url = req.url.slice(0, -1);
  }
  next();
});

const prisma = new PrismaClient({
  // Datasource configuration is now handled via DATABASE_URL env var
});

const sendResponse = (res: Response, status: number, data: any) => {
  res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
  res.status(status).send(JSON.stringify(data));
};

const sendError = (res: Response, status: number, message: string) => {
  sendResponse(res, status, { error: message });
};

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const path = req.path.replace(/\/$/, '') || '/';
  if (path === '/login' || path === '/refresh' || path === '/user') {
    next();
    return;
  }
 
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'Unauthorized');
    return;
  }
 
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    sendError(res, 401, 'Unauthorized');
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

const sanitizeUser = (user: any) => {
  const { password, refreshToken, ...rest } = user;
  return rest;
};

const mergeCustom = async (model: any, id: number, newCustom: unknown): Promise<string | null> => {
  if (newCustom === null) return null;
  if (typeof newCustom !== 'object' || newCustom === null) return ensureJsonString(newCustom);

  const currentRecord = await model.findUnique({ where: { id } });
  const currentCustom = ensureJsonObject(currentRecord?.custom);

  const deepMerge = (target: any, source: any): any => {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  };

  const merged = deepMerge({ ...currentCustom }, { ...newCustom });
  
  return ensureJsonString(merged);
};

const getParam = (param: unknown): unknown => {
  if (Array.isArray(param)) return param[0];
  return param !== undefined && param !== null ? param : '';
}

app.post('/user', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      sendError(res, 400, 'Email and password required');
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
    res.status(201).send(JSON.stringify({ result: 'Created', id: user.id }));
  } catch (e) {
    const error = e as Error;
    if ('code' in error && (error as Record<string, unknown>).code === 'P2002') {
      sendError(res, 400, 'User with this email already exists');
    } else {
      sendError(res, 500, error.message);
    }
  }
});

app.get('/user', async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername } = req.query as { emailOrUsername: string };
    if (!emailOrUsername) {
      sendError(res, 400, 'emailOrUsername query parameter required');
      return;
    }
    const users = await prisma.user.findMany({
      where: {
        OR: [{ email: { contains: emailOrUsername } }, { username: { contains: emailOrUsername } }],
      },
      select: { id: true, username: true },
    });
app.put('/user/password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req as any;
    const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
    if (!oldPassword || !newPassword) {
      sendError(res, 400, 'Old and new passwords are required');
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      sendError(res, 400, 'Incorrect old password');
      return;
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.status(200).send(JSON.stringify({ result: 'Updated' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});
    sendResponse(res, 200, users.map(u => sanitizeUser(u)));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
 
    if (!user || !(await bcrypt.compare(password, (user as any).password))) {
      sendError(res, 401, 'Invalid email or password');
      return;
    }
 
    const token = jwt.sign({ userId: user.id.toString() }, JWT_SECRET, { expiresIn: '5m' });
    const refreshToken = jwt.sign({ userId: user.id.toString() }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
 
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
 
    sendResponse(res, 200, { result: 'Authorized', token, refreshToken });
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      sendError(res, 400, 'Refresh token required');
      return;
    }

    console.log('--- Refresh Request ---');
    console.log('Token from request length:', refreshToken.length);

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: BigInt(decoded.userId) } });

    if (!user) {
      console.log('User not found in DB for ID:', decoded.userId);
      sendError(res, 401, 'Unauthorized');
      return;
    }

    console.log('Token from DB length:', user.refreshToken?.length);
    console.log('Direct comparison:', user.refreshToken === refreshToken);

    if (user.refreshToken !== refreshToken) {
      console.log('Mismatch detected!');
      sendError(res, 401, 'Unauthorized');
      return;
    }

    const newToken = jwt.sign({ userId: user.id.toString() }, JWT_SECRET, { expiresIn: '5m' });
    const newRefreshToken = jwt.sign({ userId: user.id.toString() }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    sendResponse(res, 200, { result: 'Authorized', token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('JWT Verify Error:', err);
    sendError(res, 401, 'Unauthorized');
  }
});

app.get('/board/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req as any;
    const boards = await prisma.boardUser.findMany({
      where: { userId },
      include: { board: true },
    });
    sendResponse(res, 200, {
      boards: boards.map((bu) => ({
        ...bu.board,
        custom: ensureJsonObject(bu.board.custom),
      })),
    });
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.get('/board/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req as any;
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
      sendError(res, 404, 'Board not found');
      return;
    }
 
    const boardData = {
      ...board,
      custom: ensureJsonObject(board.custom),
      users: board.users.map((bu) => sanitizeUser(bu.user)),
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
 
    sendResponse(res, 200, boardData);
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.post('/board/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req as any;
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
    res.status(201).send(JSON.stringify({ result: 'Created', id: board.id }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.put('/board/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, custom } = req.body as { title?: string; custom?: unknown };
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    
    if (custom !== undefined) {
      data.custom = await mergeCustom(prisma.board, Number(getParam(req.params.id)), custom);
    }

    await prisma.board.update({
      where: { id: Number(getParam(req.params.id)) },
      data,
    });
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.status(200).send(JSON.stringify({ result: 'Updated' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
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
    res.status(200).send(JSON.stringify({ result: 'Deleted' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.post('/board/:id/list/', async (req: Request, res: Response): Promise<void> => {
  try {
    const boardId = Number(getParam(req.params.id));
    const { title, position } = req.body as { title: string; position?: number };
    const list = await prisma.list.create({
      data: { id: Date.now(), title, position: position ?? 0, boardId },
    });
    res.status(201).send(JSON.stringify({ result: 'Created', id: list.id }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.put('/board/:id/list/', async (req: Request, res: Response): Promise<void> => {
  try {
    const lists = req.body as unknown[];
    if (!Array.isArray(lists)) {
      sendError(res, 400, 'Expected an array of lists');
      return;
    }

    const updatePromises = lists.map(async (listItem) => {
      const data: Record<string, unknown> = {};
      const item = listItem as Record<string, unknown>;
      if (item.title !== undefined) data.title = item.title;
      if (item.position !== undefined) data.position = item.position;
      if (item.custom !== undefined) {
        data.custom = await mergeCustom(prisma.list, Number(getParam(item.id)), item.custom);
      }
      return prisma.list.update({
        where: { id: Number(getParam(item.id)) },
        data,
      });
    });

    await Promise.all(updatePromises);
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.status(200).send(JSON.stringify({ result: 'Updated' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
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
    res.status(200).send(JSON.stringify({ result: 'Updated' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.delete('/board/:id/list/:listId', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.list.delete({ where: { id: Number(getParam(req.params.listId)) } });
    res.status(200).send(JSON.stringify({ result: 'Deleted' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
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
      sendError(res, 400, 'Invalid or missing list ID');
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
        position: finalPosition ?? 0,
        color: color as string,
        custom: ensureJsonString(custom),
        created_at: Date.now(),
      },
    });
    res.status(201).send(JSON.stringify({ result: 'Created', id: card.id }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.put('/board/:id/card/', async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = req.body as unknown[];
    if (!Array.isArray(cards)) {
      sendError(res, 400, 'Expected an array of cards');
      return;
    }

    const updatePromises = cards.map(async (card) => {
      const item = card as Record<string, unknown>;
      const { listId, list_id: listIdFromBody } = item;
      const listIdValue = listIdFromBody !== undefined ? listIdFromBody : listId;

      const data: Record<string, unknown> = {};
      if (item.title !== undefined) data.title = item.title;
      if (item.description !== undefined) data.description = item.description;
      if (item.position !== undefined) data.position = item.position;
      if (item.color !== undefined) data.color = item.color;
      if (listIdValue !== undefined) data.listId = String(listIdValue);
      if (item.custom !== undefined) {
        data.custom = await mergeCustom(prisma.card, Number(getParam(item.id)), item.custom);
      }

      return prisma.card.update({
        where: { id: Number(getParam(item.id)) },
        data,
      });
    });

    await Promise.all(updatePromises);
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.status(200).send(JSON.stringify({ result: 'Updated' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.put('/board/:id/card/:cardId', async (req: Request, res: Response): Promise<void> => {
  try {
    const cardId = Number(getParam(req.params.cardId));
    const {
      title,
      description,
      position,
      color,
      custom,
      list_id: listIdFromBody,
    } = req.body as Record<string, unknown>;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (position !== undefined) data.position = position;
    if (color !== undefined) data.color = color;
    if (custom !== undefined) {
      data.custom = await mergeCustom(prisma.card, cardId, custom);
    }
    if (listIdFromBody !== undefined) data.listId = String(listIdFromBody);

    await prisma.card.update({
      where: { id: cardId },
      data,
    });
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.status(200).send(JSON.stringify({ result: 'Updated' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.delete('/board/:id/card/:cardId', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.card.delete({ where: { id: Number(getParam(req.params.cardId)) } });
    res.status(200).send(JSON.stringify({ result: 'Deleted' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
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

    res.status(200).send(JSON.stringify({ result: 'Updated' }));
  } catch (e) {
    const error = e as Error;
    sendError(res, 500, error.message);
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});
