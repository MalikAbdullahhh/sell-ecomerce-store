import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Element/window scroll restoration mid-navigation scrolls the OLD page
    // (home) to the top before the product route paints — that is the flash.
    scrollRestoration: false,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    // Show destination pending UI immediately — never keep home on screen while loading.
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
  });

  return router;
};
