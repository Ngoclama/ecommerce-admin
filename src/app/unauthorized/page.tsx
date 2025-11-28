import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Truy cập bị từ chối
        </h1>
        <p className="text-gray-600 mb-6">
          Email của bạn không được phép truy cập vào Admin Dashboard.
          <br />
          Vui lòng liên hệ quản trị viên để được cấp quyền.
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/sign-out">Đăng xuất</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
