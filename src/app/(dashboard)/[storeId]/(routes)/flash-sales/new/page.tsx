import { FlashSaleForm } from "../[flashSaleId]/components/flash-sale-form";

const NewFlashSalePage = () => {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <FlashSaleForm initialData={null} />
      </div>
    </div>
  );
};

export default NewFlashSalePage;
