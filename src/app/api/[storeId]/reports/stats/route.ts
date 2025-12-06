import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getReportsStats, ReportsStatsParams } from "@/action/get-reports-stats";
import { API_MESSAGES, HTTP_STATUS } from "@/lib/constants";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);

    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    // Lấy query parameters
    const period = searchParams.get("period") || "month";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const categoryId = searchParams.get("categoryId");

    const statsParams: ReportsStatsParams = {
      storeId,
      period: period as any,
      ...(startDateParam && { startDate: new Date(startDateParam) }),
      ...(endDateParam && { endDate: new Date(endDateParam) }),
      ...(status && { status }),
      ...(paymentMethod && { paymentMethod }),
      ...(categoryId && { categoryId }),
    };

    const stats = await getReportsStats(statsParams);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[REPORTS_STATS_ERROR]", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

