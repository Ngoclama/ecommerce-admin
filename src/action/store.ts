"use server"

import prisma from "@/lib/prisma";

export async function createStore(name: string, userId: string) {
  const data=   await prisma.store.create({
      data: {
        name,
        userId,
      },
    });
    return data;
}