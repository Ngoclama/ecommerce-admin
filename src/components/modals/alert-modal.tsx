"use client";

import { useEffect, useState } from "react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  loading: boolean;
}
export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  description,
}) => {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    if (loading) return;
    setShowModal(false);
    setTimeout(() => {
      onClose();
    }, 300); // Delay to allow animation to complete
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
          showModal ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        ></div>
        <div
          className={`bg-white rounded-lg shadow-lg transform transition-transform duration-300 ${
            showModal ? "translate-y-0" : "-translate-y-10"
          } w-11/12 max-w-md mx-auto z-50`}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">{title}</h2>
            <p className="mb-6">{description}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
