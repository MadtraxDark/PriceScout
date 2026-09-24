"use client";

import { Toaster } from "react-hot-toast";

/**
 * Toaster global do App Router — componente cliente isolado
 * para não forçar "use client" no root layout.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: "#FFFFFF",
          color: "#102A2F",
          border: "1px solid #DCE4E1",
          borderRadius: "7px",
          fontFamily: "Manrope, Arial, sans-serif",
          fontSize: "13px",
          boxShadow: "0 8px 24px rgba(16,42,47,.08)",
        },
        success: {
          iconTheme: {
            primary: "#3E9270",
            secondary: "#FFFFFF",
          },
        },
        error: {
          iconTheme: {
            primary: "#DF6845",
            secondary: "#FFFFFF",
          },
        },
      }}
    />
  );
}
