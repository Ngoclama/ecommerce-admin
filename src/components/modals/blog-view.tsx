"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar, FileText, Tag, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";

interface BlogViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  blogId: string | null;
  storeId: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export const BlogViewModal: React.FC<BlogViewModalProps> = ({
  isOpen,
  onClose,
  blogId,
  storeId,
}) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<BlogPost | null>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && blogId) {
      setIsLoading(true);
      setError(null);
      const fetchData = async () => {
        try {
          const response = await axios.get<BlogPost>(
            `/api/${storeId}/blog/${blogId}`
          );
          setData(response.data);
          setIsLoading(false);
        } catch (err) {
          setError(err);
          setIsLoading(false);
          console.error("Failed to fetch blog post details:", err);
        }
      };
      fetchData();
    }
  }, [isOpen, blogId, storeId]);

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle>{t("modals.blogDetails")}</DialogTitle>
            <DialogDescription>{t("modals.blogDescription")}</DialogDescription>
          </DialogHeader>
        </div>

        <Separator />

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{t("modals.noDataFound")}</p>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{t("modals.noDataFound")}</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6">
              {/* Featured Image */}
              {data.featuredImage && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                  <img
                    src={data.featuredImage}
                    alt={data.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {data.title}
                </h2>
                {data.slug && (
                  <p className="text-sm text-muted-foreground">/{data.slug}</p>
                )}
              </div>

              {/* Status and Meta Info */}
              <div className="flex flex-wrap items-center gap-4">
                <Badge
                  variant={data.isPublished ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {data.isPublished ? (
                    <>
                      <Eye className="h-3 w-3" />
                      {t("columns.published")}
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      {t("columns.draft")}
                    </>
                  )}
                </Badge>

                {data.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{data.category.name}</Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t("modals.created")}{" "}
                    {format(new Date(data.createdAt), "PPp")}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Excerpt */}
              {data.excerpt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("columns.excerpt")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.excerpt}
                  </p>
                </div>
              )}

              {/* Content */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("columns.content")}
                </h3>
                <div
                  className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-400"
                  dangerouslySetInnerHTML={{ __html: data.content }}
                />
              </div>

              {/* SEO Meta */}
              {(data.metaTitle || data.metaDescription) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      SEO Information
                    </h3>
                    {data.metaTitle && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("forms.blog.metaTitle")}
                        </p>
                        <p className="text-sm">{data.metaTitle}</p>
                      </div>
                    )}
                    {data.metaDescription && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("forms.blog.metaDescription")}
                        </p>
                        <p className="text-sm">{data.metaDescription}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* System Info */}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("modals.systemId")}
                  </span>
                  <span className="font-mono text-xs">{data.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("modals.createdAt")}
                  </span>
                  <span>{format(new Date(data.createdAt), "PPp")}</span>
                </div>
                {data.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("modals.lastUpdated")}
                    </span>
                    <span>{format(new Date(data.updatedAt), "PPp")}</span>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
