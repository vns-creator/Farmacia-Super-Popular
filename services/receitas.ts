import { getBytes, getStorage, ref, uploadBytes } from "firebase/storage";

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function arrayBufferParaBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let resultado = "";
  let i = 0;

  for (; i + 2 < bytes.length; i += 3) {
    resultado += BASE64_CHARS[bytes[i] >> 2];
    resultado += BASE64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    resultado += BASE64_CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    resultado += BASE64_CHARS[bytes[i + 2] & 63];
  }

  const restante = bytes.length - i;

  if (restante === 1) {
    resultado += BASE64_CHARS[bytes[i] >> 2];
    resultado += BASE64_CHARS[(bytes[i] & 3) << 4];
    resultado += "==";
  } else if (restante === 2) {
    resultado += BASE64_CHARS[bytes[i] >> 2];
    resultado += BASE64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    resultado += BASE64_CHARS[(bytes[i + 1] & 15) << 2];
    resultado += "=";
  }

  return resultado;
}

// Receita medica e dado de saude sensivel (LGPD): o upload nunca gera um
// link publico (getDownloadURL cria um token que ignora as regras de
// seguranca). Em vez disso guardamos so o caminho no Storage, e a leitura
// (aqui e na tela de validacao) sempre passa por getBytes, que respeita
// storage.rules normalmente.
export async function enviarFotoReceita(
  uid: string,
  uriArquivo: string,
): Promise<string> {
  const resposta = await fetch(uriArquivo);
  const blob = await resposta.blob();
  const extensao = blob.type?.split("/")[1] || "jpg";
  const caminho = `receitas/${uid}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extensao}`;

  await uploadBytes(ref(getStorage(), caminho), blob, {
    contentType: blob.type || "image/jpeg",
  });

  return caminho;
}

export async function carregarFotoReceitaComoDataUri(
  caminho: string,
): Promise<string> {
  const bytes = await getBytes(ref(getStorage(), caminho));
  const base64 = arrayBufferParaBase64(bytes);

  return `data:image/jpeg;base64,${base64}`;
}
