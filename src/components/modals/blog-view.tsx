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
import { Loader2, Calendar, FileText, Tag, Eye, EyeOff, Hash, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
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
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
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
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-neutral-900">
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
          <ScrollArea className="flex-1 px-8 py-6">
            <div className="space-y-8 max-w-6xl mx-auto">
              {}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    {data.title}
                  </h2>
                  {data.slug && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LinkIcon className="h-4 w-4" />
                      <span className="font-mono">/{data.slug}</span>
                    </div>
                  )}
                </div>

                {}
                <div className="flex flex-wrap items-center gap-4">
                  <Badge
                    variant={data.isPublished ? "default" : "secondary"}
                    className="flex items-center gap-1.5 px-3 py-1"
                  >
                    {data.isPublished ? (
                      <>
                        <Eye className="h-4 w-4" />
                        {t("columns.published")}
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        {t("columns.draft")}
                      </>
                    )}
                  </Badge>

                  {data.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="px-3 py-1">
                        {data.category.name}
                      </Badge>
                    </div>
                  )}

                  {data.publishedAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Published: {format(new Date(data.publishedAt), "PPp")}
                      </span>
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
              </div>

              <Separator />

              {/* Featured Image */}
              {data.featuredImage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <ImageIcon className="h-4 w-4" />
                    Featured Image
                  </div>
                  <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
                    <img
                      src={data.featuredImage}
                      alt={data.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              {data.tags && data.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Hash className="h-4 w-4" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Excerpt */}
              {data.excerpt && (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t("columns.excerpt")}
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    {data.excerpt}
                  </p>
                </div>
              )}

              <Separator />

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("columns.content")}
                </h3>
                <div
                  className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 blog-content-view"
                  dangerouslySetInnerHTML={{ __html: data.content }}
                />
              </div>

              {/* SEO Meta */}
              {(data.metaTitle || data.metaDescription) && (
                <>
                  <Separator />
                  <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      SEO Information
                    </h3>
                    <div className="space-y-4">
                      {data.metaTitle && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                            {t("forms.blog.metaTitle")}
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                            {data.metaTitle}
                          </p>
                        </div>
                      )}
                      {data.metaDescription && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                            {t("forms.blog.metaDescription")}
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                            {data.metaDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {}
              <Separator />
              <div className="space-y-3 text-sm bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">
                      {t("modals.systemId")}
                    </span>
                    <span className="font-mono text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                      {data.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">
                      {t("modals.createdAt")}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {format(new Date(data.createdAt), "PPp")}
                    </span>
                  </div>
                  {data.updatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">
                        {t("modals.lastUpdated")}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {format(new Date(data.updatedAt), "PPp")}
                      </span>
                    </div>
                  )}
                  {data.publishedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">
                        Published At
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {format(new Date(data.publishedAt), "PPp")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
