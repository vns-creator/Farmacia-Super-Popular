import { useEffect, useState } from "react";
import {
  collection,
  type DocumentData,
  onSnapshot,
  query,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export const ALERTA_GERAL_ID = "geral";

export type AlertaSanitario = {
  id: string;
  principioAtivo: string;
  mensagem: string;
  ativo: boolean;
  alertas: string[];
  contraindicacoes: string[];
  revisado: boolean;
  fonte?: string;
};

export function mapAlertaSanitario(
  id: string,
  data: DocumentData,
): AlertaSanitario {
  return {
    id,
    principioAtivo: String(data.principioAtivo || ""),
    mensagem: String(data.mensagem || ""),
    ativo: data.ativo !== false,
    alertas: Array.isArray(data.alertas)
      ? data.alertas.filter((item: unknown) => typeof item === "string")
      : [],
    contraindicacoes: Array.isArray(data.contraindicacoes)
      ? data.contraindicacoes.filter(
          (item: unknown) => typeof item === "string",
        )
      : [],
    revisado: data.revisado === true,
    fonte: String(data.fonte || ""),
  };
}

export function useAlertasSanitarios() {
  const [alertas, setAlertas] = useState<AlertaSanitario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "alertasSanitarios")),
      (snapshot) => {
        setAlertas(
          snapshot.docs.map((docSnap) =>
            mapAlertaSanitario(docSnap.id, docSnap.data()),
          ),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao acompanhar alertas sanitarios:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { alertas, loading };
}

type ItemComPrincipioAtivo = {
  isMedicamento?: boolean;
  principioAtivo?: string;
};

/**
 * Casa o principioAtivo dos itens (ex.: do carrinho) com as regras
 * cadastradas em alertasSanitarios. O match e por "contem", igual ao
 * exemplo: regra "Ibuprofeno" dispara para qualquer item cujo
 * principioAtivo contenha "Ibuprofeno".
 *
 * Medicamentos cujo principioAtivo nao bate com nenhuma regra especifica
 * (seja por nao ter regra cadastrada, seja por nao ter o campo preenchido)
 * caem no alerta geral (id === ALERTA_GERAL_ID), quando ativo.
 */
export function getAlertasParaItens(
  itens: ItemComPrincipioAtivo[],
  alertas: AlertaSanitario[],
) {
  const medicamentos = itens.filter((item) => item.isMedicamento);

  if (medicamentos.length === 0) return [];

  const regrasEspecificas = alertas.filter(
    (alerta) =>
      alerta.id !== ALERTA_GERAL_ID && alerta.ativo && alerta.principioAtivo.trim(),
  );
  const alertaGeral = alertas.find(
    (alerta) =>
      alerta.id === ALERTA_GERAL_ID && alerta.ativo && alerta.mensagem.trim(),
  );

  const mensagens = new Set<string>();
  let algumSemRegra = false;

  medicamentos.forEach((item) => {
    const principio = (item.principioAtivo || "").toLowerCase().trim();
    const regrasQueBatem = principio
      ? regrasEspecificas.filter((regra) =>
          principio.includes(regra.principioAtivo.toLowerCase()),
        )
      : [];

    if (regrasQueBatem.length > 0) {
      regrasQueBatem.forEach((regra) => mensagens.add(regra.mensagem));
    } else {
      algumSemRegra = true;
    }
  });

  if (algumSemRegra && alertaGeral) {
    mensagens.add(alertaGeral.mensagem);
  }

  return Array.from(mensagens);
}

export const ANVISA_BULARIO_URL = "https://consultas.anvisa.gov.br/#/bulario/";

/**
 * Retorna a regra especifica (ja revisada por um farmaceutico) cujo
 * principioAtivo cadastrado esteja contido no principioAtivo do produto.
 * Regras nao revisadas nao sao exibidas ao cliente.
 */
export function encontrarAlertaRevisado(
  principioAtivoProduto: string | undefined,
  alertas: AlertaSanitario[],
) {
  const principio = (principioAtivoProduto || "").toLowerCase().trim();

  if (!principio) return undefined;

  return alertas.find(
    (alerta) =>
      alerta.id !== ALERTA_GERAL_ID &&
      alerta.ativo &&
      alerta.revisado &&
      alerta.principioAtivo.trim() &&
      principio.includes(alerta.principioAtivo.toLowerCase().trim()),
  );
}
