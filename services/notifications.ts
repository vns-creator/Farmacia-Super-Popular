import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

type NotificationPayload = {
  titulo: string;
  mensagem: string;
  pedidoId?: string;
  userUid?: string | null;
  perfilDestino?: "admin" | "entregador";
};

export const criarNotificacao = async ({
  titulo,
  mensagem,
  pedidoId,
  userUid,
  perfilDestino,
}: NotificationPayload) => {
  await addDoc(collection(db, "notificacoes"), {
    titulo,
    mensagem,
    pedidoId: pedidoId || null,
    userUid: userUid || null,
    perfilDestino: perfilDestino || null,
    lida: false,
    criadoEm: serverTimestamp(),
  });
};
