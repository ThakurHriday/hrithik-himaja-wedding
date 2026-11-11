import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Off on purpose: every visit must start on the opening animation, not where the guest last stopped.
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
