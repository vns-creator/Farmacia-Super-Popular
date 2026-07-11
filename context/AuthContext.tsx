import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, db } from "../firebaseConfig";

export type PerfilUsuario = "cliente" | "admin" | "entregador" | "farmaceutico";

const perfilLabels: Record<PerfilUsuario, string> = {
  cliente: "Cliente",
  entregador: "Entregador",
  farmaceutico: "Farmacêutico RT",
  admin: "Admin",
};

export function getPerfilLabel(perfil?: PerfilUsuario | null) {
  return perfilLabels[perfil || "cliente"];
}

export type UsuarioPerfil = {
  uid: string;
  email: string | null;
  nome?: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  filialId?: string | null;
  filialIds?: string[];
  adminGeral?: boolean;
};

type AuthContextType = {
  user: User | null;
  perfil: UsuarioPerfil | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  recuperarSenha: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);

      if (!currentUser) {
        setPerfil(null);
        setLoading(false);
        return;
      }

      try {
        const perfilUsuario = await carregarOuCriarPerfil(currentUser);
        setPerfil(perfilUsuario);
      } catch (error) {
        console.error("Erro ao carregar perfil do usuario:", error);
        setPerfil(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const carregarOuCriarPerfil = async (usuario: User) => {
    const usuarioRef = doc(db, "usuarios", usuario.uid);
    const usuarioDoc = await getDoc(usuarioRef);

    if (usuarioDoc.exists()) {
      return {
        uid: usuario.uid,
        email: usuario.email,
        perfil: "cliente",
        ativo: true,
        ...usuarioDoc.data(),
      } as UsuarioPerfil;
    }

    const novoPerfil: UsuarioPerfil = {
      uid: usuario.uid,
      email: usuario.email,
      perfil: "cliente",
      ativo: true,
    };

    await setDoc(usuarioRef, {
      ...novoPerfil,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    return novoPerfil;
  };

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const perfilUsuario = await carregarOuCriarPerfil(credential.user);

    if (!perfilUsuario.ativo) {
      await signOut(auth);
      throw new Error("Esta conta está desativada. Fale com a farmácia.");
    }

    setPerfil(perfilUsuario);
  };

  const register = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await carregarOuCriarPerfil(credential.user);
  };

  const recuperarSenha = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, perfil, login, register, recuperarSenha, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
