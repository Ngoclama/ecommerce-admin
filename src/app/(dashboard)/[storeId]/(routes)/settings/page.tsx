import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./components/settings-form";
interface SettingsPageProps {
  params: Promise<{
    storeId: string;
  }>;
}

const SettingsPage: React.FC<SettingsPageProps> = async ({ params }) => {
  const { storeId } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      userId: userId,
    },
  });

  if (!store) {
    redirect("/");
  }

  return (
    <div className="flex flex-col flex-1 p-8 pt-6">
      {/* <div className="flex-1 space-y-4 p-8 pt-5">Settings Page</div> */}
      <SettingsForm initialData={store}></SettingsForm>
    </div>
  );
};

export default SettingsPage;
