import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await getUserFromDb(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      role: user.role,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("[USER_ROLE_API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
