"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export interface UserMe {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "ELDER" | "CARETAKER" | "FAMILY" | "DOCTOR";
  language: "en" | "hi" | "mr";
  mustChangePassword: boolean;
  elderProfile?: {
    dateOfBirth?: string | null;
    gender?: string | null;
    bloodGroup?: string | null;
    medicalConditions?: string | null;
    allergies?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    timezone: string;
    largeTextMode: boolean;
    voiceReminders: boolean;
  } | null;
  doctorProfile?: {
    specialization: string;
    registrationNumber: string;
    clinicName: string;
  } | null;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<UserMe>({
    queryKey: ["auth-me"],
    queryFn: () => apiClient<UserMe>("/api/me"),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
