import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { BrowserRouter } from "react-router-dom";

/*
  Root render
  - Adds a small UX improvement: initial loading fallback
  - Keeps StrictMode for dev safety
*/

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <React.Suspense
        fallback={
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-main)",
              color: "#0b1f3b",
              fontWeight: 600,
            }}
          >
            Loading...
          </div>
        }
      >
        <App />
      </React.Suspense>
    </BrowserRouter>
  </React.StrictMode>
);