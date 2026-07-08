import { Alert, Platform } from "react-native";

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

/**
 * Alert.alert do react-native-web e um no-op (nao mostra nada e nunca
 * chama onPress). Este helper mantem a mesma assinatura e usa
 * window.alert/window.confirm no navegador para os fluxos continuarem
 * funcionando (checkout, confirmacoes de admin, etc).
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const acoes = buttons && buttons.length > 0 ? buttons : [{ text: "OK" }];
  const texto = [title, message].filter(Boolean).join("\n\n");

  if (acoes.length <= 1) {
    window.alert(texto);
    acoes[0]?.onPress?.();
    return;
  }

  const confirmou = window.confirm(texto);

  if (confirmou) {
    const acaoConfirmar =
      acoes.find((botao) => botao.style !== "cancel") ??
      acoes[acoes.length - 1];
    acaoConfirmar?.onPress?.();
  } else {
    const acaoCancelar = acoes.find((botao) => botao.style === "cancel");
    acaoCancelar?.onPress?.();
  }
}
