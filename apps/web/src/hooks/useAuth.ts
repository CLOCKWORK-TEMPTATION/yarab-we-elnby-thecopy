import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const userData = await getCurrentUser();
        if (mounted) {
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    // Optional: Add event listener to track token changes across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        fetchUser();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, []);

  return { user, loading };
}
