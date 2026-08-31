import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";

/**
 * Custom hook for making authenticated API requests.
 * Automatically includes JWT token and handles 401 responses.
 */
export function useAuthenticatedFetch() {
  const { token, logout } = useAuth();
  const [, navigate] = useLocation();

  /**
   * Make an authenticated API request.
   * @param url - API endpoint URL
   * @param options - Fetch options (method, body, headers, etc.)
   * @returns Response object
   */
  async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers: HeadersInit = {
      ...(options.headers || {}),
      ...(token && { "Authorization": `Bearer ${token}` }),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    // Handle unauthorized responses
    if (res.status === 401) {
      logout();
      navigate("/login");
    }

    return res;
  }

  return { authenticatedFetch };
}

/**
 * Utility function for making authenticated GET requests.
 * @param url - API endpoint URL
 * @param token - JWT token from localStorage or AuthContext
 * @returns Promise<Response>
 */
export async function authenticatedGet(
  url: string,
  token: string | null
): Promise<Response> {
  const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

  return fetch(url, {
    method: "GET",
    headers,
  });
}

/**
 * Utility function for making authenticated POST requests.
 * @param url - API endpoint URL
 * @param data - Request body data
 * @param token - JWT token from localStorage or AuthContext
 * @returns Promise<Response>
 */
export async function authenticatedPost(
  url: string,
  data: unknown,
  token: string | null
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
  };

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

/**
 * Utility function for making authenticated PATCH requests.
 * @param url - API endpoint URL
 * @param data - Request body data
 * @param token - JWT token from localStorage or AuthContext
 * @returns Promise<Response>
 */
export async function authenticatedPatch(
  url: string,
  data: unknown,
  token: string | null
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
  };

  return fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
}

/**
 * Utility function for making authenticated DELETE requests.
 * @param url - API endpoint URL
 * @param token - JWT token from localStorage or AuthContext
 * @returns Promise<Response>
 */
export async function authenticatedDelete(
  url: string,
  token: string | null
): Promise<Response> {
  const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

  return fetch(url, {
    method: "DELETE",
    headers,
  });
}
