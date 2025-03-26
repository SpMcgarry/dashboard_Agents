import { useQuery } from "@tanstack/react-query";

interface ApiKey {
  id: number;
  provider: string;
  keyName: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const response = await fetch("/api/api-keys", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch API keys");
      return response.json();
    },
  });
}

export function useApiKeysByProvider(provider: string) {
  const { data: apiKeys, ...rest } = useApiKeys();
  const filteredKeys = apiKeys?.filter(key => key.provider === provider && key.isActive) || [];
  return { data: filteredKeys, ...rest };
} 