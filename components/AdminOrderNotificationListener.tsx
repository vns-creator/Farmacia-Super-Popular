import { useRouter } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useRef } from "react";
import { showAlert } from "@/services/alert";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";

type AdminNotification = {
  id: string;
  titulo?: string;
  mensagem?: string;
  pedidoId?: string | null;
  lida?: boolean;
};

export function AdminOrderNotificationListener() {
  const router = useRouter();
  const { perfil } = useAuth();
  const initializedRef = useRef(false);
  const alertedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    initializedRef.current = false;
    alertedIdsRef.current.clear();

    if (perfil?.perfil !== "admin" || !perfil.ativo) {
      return;
    }

    const isAdminGeral = perfil.adminGeral === true || !perfil.filialId;

    const notificacoesQuery = isAdminGeral
      ? query(
          collection(db, "notificacoes"),
          where("perfilDestino", "==", "admin"),
          where("lida", "==", false),
        )
      : query(
          collection(db, "notificacoes"),
          where("perfilDestino", "==", "admin"),
          where("lida", "==", false),
          where("filialId", "==", perfil.filialId),
        );

    const unsubscribe = onSnapshot(
      notificacoesQuery,
      (snapshot) => {
        if (!initializedRef.current) {
          snapshot.docs.forEach((docSnap) => {
            alertedIdsRef.current.add(docSnap.id);
          });
          initializedRef.current = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          if (alertedIdsRef.current.has(change.doc.id)) return;

          alertedIdsRef.current.add(change.doc.id);
          const notificacao = {
            id: change.doc.id,
            ...change.doc.data(),
          } as AdminNotification;

          showAlert(
            notificacao.titulo || "Novo pedido recebido",
            notificacao.mensagem || "Um novo pedido chegou para a farmácia.",
            [
              { text: "Depois", style: "cancel" },
              {
                text: "Ver pedido",
                onPress: async () => {
                  try {
                    await updateDoc(doc(db, "notificacoes", notificacao.id), {
                      lida: true,
                    });
                  } catch (error) {
                    console.error("Erro ao marcar notificacao como lida:", error);
                  }

                  if (notificacao.pedidoId) {
                    router.push({
                      pathname: "/pedido-detalhes",
                      params: { id: notificacao.pedidoId },
                    } as any);
                  } else {
                    router.push("/admin/pedidos");
                  }
                },
              },
            ],
          );
        });
      },
      (error) => {
        console.error("Erro ao acompanhar notificacoes de pedidos:", error);
      },
    );

    return unsubscribe;
  }, [perfil, router]);

  return null;
}
