import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import { StoreProvider } from "@/data/store";
import { TooltipProvider } from "@/components/ui/overlays";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <TooltipProvider delayDuration={200}>
          <App />
          <Toaster position="top-right" offset={72} richColors closeButton />
        </TooltipProvider>
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>
);
