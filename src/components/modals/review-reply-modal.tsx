"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";

const formSchema = z.object({
  response: z.string().min(1, "Response content is required"),
});

interface ReviewReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  initialResponse?: string; // Load câu trả lời cũ nếu có
}

export const ReviewReplyModal: React.FC<ReviewReplyModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  initialResponse = "",
}) => {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(
      z.object({
        response: z.string().min(1, t("modals.responseRequired")),
      })
    ),
    defaultValues: {
      response: initialResponse,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await axios.patch(`/api/${params.storeId}/reviews/${reviewId}`, {
        adminResponse: values.response,
      });
      toast.success(t("actions.responseSent"));
      router.refresh();
      onClose();
    } catch (error) {
      toast.error(t("actions.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("modals.replyToReview")}</DialogTitle>
          <DialogDescription>
            {t("modals.replyDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="response"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("modals.yourReply")}</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder={t("modals.replyPlaceholder")}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                disabled={loading}
                variant="outline"
                onClick={onClose}
                type="button"
              >
                {t("actions.cancel")}
              </Button>
              <Button disabled={loading} type="submit">
                {t("modals.sendReply")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
