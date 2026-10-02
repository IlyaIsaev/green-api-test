import { connectLogger } from "@reatom/core";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { redirectToGreenApiOnLoad } from "@/app/routes";
import "./index.css";

if (import.meta.env.DEV) connectLogger();

redirectToGreenApiOnLoad();

const root = document.querySelector("#app");

if (!root) throw new Error("Missing #app");

createRoot(root).render(<App />);
