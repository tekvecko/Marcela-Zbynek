import { QueryClient, QueryFunction } from "@tanstack/react-query";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestOptions = {}
): Promise<any> {
  const { method = "GET", body, ...fetchOptions } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-App-Name": "Marcela & Zbynek",
      "User-Agent": "Marcela & Zbynek Wedding App",
      ...fetchOptions.headers,
    },
    credentials: "include",
    ...fetchOptions,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, config);

  await throwIfResNotOk(response);
  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
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
      queryFn: async ({ queryKey }) => {
        const token = localStorage.getItem("auth_token");
        const headers: Record<string, string> = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(queryKey[0] as string, { 
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          credentials: "include"
        });
        if (!res.ok) {
          if (res.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            window.location.reload();
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes for better caching
      gcTime: 10 * 60 * 1000, // 10 minutes cache retention (TanStack Query v5)
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
});