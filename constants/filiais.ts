export type Filial = {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  whatsapp: string;
  horario: string;
  cnpj: string;
  razaoSocial: string;
  responsavelTecnico: string;
  crf: string;
  afe: string;
  cepReferencia?: string;
  bairros?: string[];
  cepPrefixes?: string[];
};

export const filiais: Filial[] = [
  {
    id: "filial-efapi-tancredo",
    nome: "Filial Efapi (Tancredo)",
    endereco: "Rua Cunha Pora, 555E - Efapi",
    telefone: "(49) 3321-1001",
    whatsapp: "554933211001",
    horario: "Segunda a sábado, das 7h às 22h e domingo das 8h às 20h",
    cnpj: "12.345.678/0001-90",
    razaoSocial: "Farmácia Super Popular Efapi Ltda",
    responsavelTecnico: "Dra. Marina Costa",
    crf: "CRF-SC 12345",
    afe: "AFE 1.23456-7",
    cepReferencia: "89809-000",
    bairros: ["efapi", "sao cristovao", "jardim america"],
    cepPrefixes: ["89809", "89810"],
  },
  {
    id: "filial-efapi-atilio-fontana",
    nome: "Filial Efapi (Atilio Fontana)",
    endereco: "Av. Sen. Atilio Fontana, 2500E - Efapi",
    telefone: "(49) 3321-1002",
    whatsapp: "554933211002",
    horario: "Segunda a sábado, das 7h às 22h e domingo das 8h às 20h",
    cnpj: "12.345.678/0002-70",
    razaoSocial: "Farmácia Super Popular Atilio Ltda",
    responsavelTecnico: "Dr. Felipe Ramos",
    crf: "CRF-SC 23456",
    afe: "AFE 2.34567-8",
    cepReferencia: "89809-500",
    bairros: ["efapi", "jardim do lago", "eldorado"],
    cepPrefixes: ["89809", "89810"],
  },
  {
    id: "filial-palmital",
    nome: "Filial Palmital",
    endereco: "Av. Nereu Ramos, 180E - Palmital",
    telefone: "(49) 3321-1003",
    whatsapp: "554933211003",
    horario: "Segunda a sábado, das 7h às 22h e domingo das 8h às 20h",
    cnpj: "12.345.678/0003-51",
    razaoSocial: "Farmácia Super Popular Palmital Ltda",
    responsavelTecnico: "Dra. Juliana Martins",
    crf: "CRF-SC 34567",
    afe: "AFE 3.45678-9",
    cepReferencia: "89814-000",
    bairros: ["palmital", "santo antonio", "universitario"],
    cepPrefixes: ["89814", "89815"],
  },
  {
    id: "filial-lider",
    nome: "Filial Líder",
    endereco: "Av. Fernando Machado, 3674D - Líder",
    telefone: "(49) 3321-1004",
    whatsapp: "554933211004",
    horario: "Segunda a sábado, das 7h às 22h e domingo das 8h às 20h",
    cnpj: "12.345.678/0004-32",
    razaoSocial: "Farmácia Super Popular Líder Ltda",
    responsavelTecnico: "Dr. Rafael Almeida",
    crf: "CRF-SC 45678",
    afe: "AFE 4.56789-0",
    cepReferencia: "89805-000",
    bairros: ["lider", "centro", "santa maria"],
    cepPrefixes: ["89801", "89802", "89805"],
  },
];

export function getFilialById(filialId?: string | null) {
  return filiais.find((filial) => filial.id === filialId) || null;
}

function normalizarTexto(valor?: string | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function sugerirFilialPorCep(
  cep?: string | null,
  bairro?: string | null,
) {
  const cepLimpo = String(cep || "").replace(/\D/g, "");
  const prefixoCep = cepLimpo.slice(0, 5);
  const bairroNormalizado = normalizarTexto(bairro);

  if (prefixoCep) {
    const porCep = filiais.find((filial) =>
      filial.cepPrefixes?.some((prefixo) => prefixo === prefixoCep),
    );

    if (porCep) return porCep;
  }

  if (bairroNormalizado) {
    const porBairro = filiais.find((filial) =>
      filial.bairros?.some((nomeBairro) =>
        bairroNormalizado.includes(normalizarTexto(nomeBairro)),
      ),
    );

    if (porBairro) return porBairro;
  }

  return null;
}
