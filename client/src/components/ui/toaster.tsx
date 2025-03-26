import React from "react";
import { Toaster as Sonner } from "sonner";

export const Toaster: React.FC = () => {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: "#fff",
          color: "#333",
          border: "1px solid #e5e7eb",
        },
      }}
    />
  );
};
