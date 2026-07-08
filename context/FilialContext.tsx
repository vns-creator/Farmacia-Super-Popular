import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getFilialById } from "../constants/filiais";

type FilialContextValue = {
  filialId: string | null;
  filialNome: string;
  setFilialId: (filialId: string | null) => void;
};

const STORAGE_KEY = "@farmacia:selected-filial";

const FilialContext = createContext<FilialContextValue | undefined>(undefined);

export function FilialProvider({ children }: { children: React.ReactNode }) {
  const [filialId, setFilialIdState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((valor) => {
        if (valor) setFilialIdState(valor);
      })
      .catch((error) => {
        console.error("Erro ao carregar filial selecionada:", error);
      });
  }, []);

  const setFilialId = useCallback((valor: string | null) => {
    setFilialIdState(valor);

    const persistencia = valor
      ? AsyncStorage.setItem(STORAGE_KEY, valor)
      : AsyncStorage.removeItem(STORAGE_KEY);

    persistencia.catch((error) => {
      console.error("Erro ao salvar filial selecionada:", error);
    });
  }, []);

  const value = useMemo<FilialContextValue>(() => {
    const filial = getFilialById(filialId);

    return {
      filialId,
      filialNome: filial?.nome || "Todas as filiais",
      setFilialId,
    };
  }, [filialId, setFilialId]);

  return <FilialContext.Provider value={value}>{children}</FilialContext.Provider>;
}

export function useFilial() {
  const context = useContext(FilialContext);

  if (!context) {
    throw new Error("useFilial precisa estar dentro de FilialProvider");
  }

  return context;
}
