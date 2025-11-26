import { CategoryForm } from "../[categoryId]/components/category-form";

const NewBlogCategoryPage = () => {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryForm initialData={null} />
      </div>
    </div>
  );
};

export default NewBlogCategoryPage;
