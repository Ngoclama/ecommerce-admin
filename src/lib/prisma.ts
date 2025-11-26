// File khởi tạo Prisma Client để kết nối với database MongoDB
// Sử dụng singleton pattern để tránh tạo nhiều instance trong development

import { PrismaClient } from "@prisma/client";

// Khai báo global để có thể dùng trong development mode
// Trong Next.js, khi hot reload, nếu không dùng global thì sẽ tạo nhiều PrismaClient instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Nếu đã có instance trong global thì dùng lại, không thì tạo mới
// Điều này giúp tránh warning "too many Prisma Clients" khi dev
const prisma = global.prisma || new PrismaClient();

// Trong development mode, lưu instance vào global để dùng lại khi hot reload
// Production mode không cần vì không có hot reload
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
