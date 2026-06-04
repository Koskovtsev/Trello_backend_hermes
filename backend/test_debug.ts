import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const payload = { title: "1й", custom: { background: "purple" } };
  console.log("DEBUG: Payload:", payload);

  try {
    // Емулюємо те, що робить сервер
    const customStr = JSON.stringify(payload.custom);
    console.log("DEBUG: Stringified custom:", customStr);

    const board = await prisma.board.create({
      data: {
        title: payload.title,
        custom: customStr
      }
    });
    console.log("DEBUG: Result from DB:", board);
  } catch (e) {
    console.error("DEBUG: Prisma error:", e);
  }
}

test();
