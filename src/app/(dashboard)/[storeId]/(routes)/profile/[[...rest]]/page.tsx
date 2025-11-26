import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "../components/profile-form";

interface ProfilePageProps {
  params: Promise<{
    storeId: string;
    rest?: string[];
  }>;
}

const ProfilePage: React.FC<ProfilePageProps> = async ({ params }) => {
  const { storeId } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col flex-1 p-8 pt-6">
      <ProfileForm />
    </div>
  );
};

export default ProfilePage;
