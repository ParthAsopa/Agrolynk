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
): Promise<Response> {
  // Get JWT token from localStorage
  const token = localStorage.getItem("authToken");
  
  const headers: HeadersInit = {
    ...(data && { "Content-Type": "application/json" }),
    ...(token && { "Authorization": `Bearer ${token}` }),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // If unauthorized, clear token and you might want to redirect to login
  if (res.status === 401) {
    localStorage.removeItem("authToken");
    // Optionally redirect to login page here
    // window.location.href = "/login";
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get JWT token from localStorage
    const token = localStorage.getItem("authToken");
    
    const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

    const res = await fetch(queryKey[0] as string, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem("authToken");
      return null;
    }

    if (res.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem("authToken");
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
