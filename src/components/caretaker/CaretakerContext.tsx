"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface LinkedElder {
  id: string;
  name: string;
  phone?: string | null;
  elderProfile?: {
    timezone: string;
    medicalConditions?: string | null;
  } | null;
}

interface CaretakerContextType {
  elders: LinkedElder[];
  selectedElder: LinkedElder | null;
  selectedElderId: string | null;
  setSelectedElderId: (id: string) => void;
  isLoading: boolean;
}

const CaretakerContext = createContext<CaretakerContextType>({
  elders: [],
  selectedElder: null,
  selectedElderId: null,
  setSelectedElderId: () => {},
  isLoading: false,
});

export const useCaretaker = () => useContext(CaretakerContext);

export function CaretakerProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery<LinkedElder[]>({
    queryKey: ["caretaker-me-elders"],
    queryFn: () => apiClient<LinkedElder[]>("/api/me/elders"),
  });

  const elders = data || [];
  const [selectedElderId, setSelectedElderId] = useState<string | null>(null);

  useEffect(() => {
    if (elders.length > 0 && !selectedElderId) {
      // Check stored preference or default to first
      const stored = localStorage.getItem("smriti_caretaker_elder_id");
      if (stored && elders.some((e) => e.id === stored)) {
        setSelectedElderId(stored);
      } else {
        setSelectedElderId(elders[0].id);
      }
    }
  }, [elders, selectedElderId]);

  const handleSelectElderId = (id: string) => {
    setSelectedElderId(id);
    localStorage.setItem("smriti_caretaker_elder_id", id);
  };

  const selectedElder = elders.find((e) => e.id === selectedElderId) || elders[0] || null;

  return (
    <CaretakerContext.Provider
      value={{
        elders,
        selectedElder,
        selectedElderId: selectedElder?.id || null,
        setSelectedElderId: handleSelectElderId,
        isLoading,
      }}
    >
      {children}
    </CaretakerContext.Provider>
  );
}
