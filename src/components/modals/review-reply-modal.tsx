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
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
      toast.success("Response sent.");
      router.refresh();
      onClose();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to Review</DialogTitle>
          <DialogDescription>
            Your reply will be visible to customers.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="response"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Reply</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder="Thank you for your feedback..."
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
                Cancel
              </Button>
              <Button disabled={loading} type="submit">
                Send Reply
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
