import { BlogForm } from "../[postId]/components/blog-form";

const NewBlogPostPage = () => {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BlogForm initialData={null} />
      </div>
    </div>
  );
};

export default NewBlogPostPage;
