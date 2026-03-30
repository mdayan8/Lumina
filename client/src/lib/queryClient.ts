import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  extraHeaders?: Record<string, string>,
  token?: string, // Assuming token is passed or retrieved
): Promise<any> { // Return type changed to any as it returns res.json()
  // For FormData, let the browser set the Content-Type automatically
  const isFormData = data instanceof FormData;

  const headers: HeadersInit = {
    ...extraHeaders,
  };

  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: headers,
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  if (res.status === 401) {
    // Session expired or invalid
    localStorage.removeItem("authToken");
    // Dispatch a custom event so the UI can react (e.g., show toast, redirect)
    window.dispatchEvent(new Event("session-expired"));
    // Optional: Redirect immediately if not handled by UI
    if (window.location.pathname !== "/auth") {
      window.location.href = "/auth";
    }
    throw new Error("Session expired. Please log in again.");
  }

  await throwIfResNotOk(res);
  return await res.json(); // Changed to return JSON
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      // Filter out empty strings and handle URL construction properly
      const path = queryKey.filter(Boolean).join("/");

      // Handle absolute URLs or URLs that already start with "/"
      let url: string;
      if (path.startsWith("http://") || path.startsWith("https://")) {
        // Already an absolute URL
        url = path;
      } else if (path.startsWith("/")) {
        // Relative URL starting with "/", use as-is
        url = path;
      } else {
        // Relative URL, prepend "/"
        url = `/${path}`;
      }

      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});