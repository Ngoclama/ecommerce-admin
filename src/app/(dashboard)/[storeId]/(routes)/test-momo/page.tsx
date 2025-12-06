"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";

export default function TestMoMoPage() {
  const [loading, setLoading] = useState(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    orderId: `TEST_${Date.now()}`,
    amount: "10000",
    orderInfo: "Test payment MoMo",
  });

  const handleTestPayment = async () => {
    setLoading(true);
    setPayUrl(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const normalizedApiUrl = apiUrl.replace(/\/$/, "");

      const response = await fetch(`${normalizedApiUrl}/api/momo/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          amount: parseInt(formData.amount),
          orderInfo: formData.orderInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.payUrl) {
        setPayUrl(data.payUrl);
        toast.success("Tạo thanh toán MoMo thành công!");
      } else {
        toast.error(data.error || "Không thể tạo thanh toán MoMo");
      }
    } catch (error: any) {
      console.error("[TEST_MOMO_ERROR]", error);
      toast.error(error.message || "Có lỗi xảy ra khi tạo thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = () => {
    if (payUrl) {
      window.open(payUrl, "_blank");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test MoMo Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  value={formData.orderId}
                  onChange={(e) =>
                    setFormData({ ...formData, orderId: e.target.value })
                  }
                  placeholder="Order ID"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (VND)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="10000"
                />
              </div>

              <div>
                <Label htmlFor="orderInfo">Order Info</Label>
                <Input
                  id="orderInfo"
                  value={formData.orderInfo}
                  onChange={(e) =>
                    setFormData({ ...formData, orderInfo: e.target.value })
                  }
                  placeholder="Order description"
                />
              </div>
            </div>

            <Button
              onClick={handleTestPayment}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo thanh toán...
                </>
              ) : (
                "Tạo thanh toán MoMo"
              )}
            </Button>

            {payUrl && (
              <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div>
                  <Label className="text-green-700 dark:text-green-400">
                    Payment URL:
                  </Label>
                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border break-all text-sm">
                    {payUrl}
                  </div>
                </div>

                <Button
                  onClick={handleRedirect}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Mở trang thanh toán MoMo
                </Button>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                Hướng dẫn test:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>Nhập thông tin đơn hàng test</li>
                <li>Click "Tạo thanh toán MoMo"</li>
                <li>Mở trang thanh toán MoMo trong tab mới</li>
                <li>Sử dụng thẻ test của MoMo để thanh toán</li>
                <li>Kiểm tra IPN callback tại /api/momo/ipn</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

