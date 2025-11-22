import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { StoreModal } from "@/components/modals/store-modal";
import { Inter } from "next/font/google"; 
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeId: string };
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const store = await prisma.store.findFirst({
    where: {
      id: params.storeId,
      userId,
    },
  });

  if (!store) {
    redirect("/");
  }

  return (
    <>
      <Navbar></Navbar>
      <StoreModal />
      <div className="max-w-full px-6 md:px-10 py-10">{children}</div>
    </>
  );
}
