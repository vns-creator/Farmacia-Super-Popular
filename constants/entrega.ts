import { type Filial, getFilialById } from "./filiais";

export type CoberturaEntrega = {
  bairro: string;
  filialId: string;
  taxaEntrega: number;
  zona: "perto" | "media" | "longe" | "rural";
  distanciaKm?: number;
  aliases?: string[];
  cepPrefixes?: string[];
};

export type CoberturaEntregaComFilial = CoberturaEntrega & {
  filial: Filial;
};

export const coberturaEntrega: CoberturaEntrega[] = [
  { bairro: "Centro", filialId: "filial-lider", taxaEntrega: 6.9, zona: "perto", cepPrefixes: ["89801"] },
  { bairro: "Líder", filialId: "filial-lider", taxaEntrega: 6.9, zona: "perto", aliases: ["lider"], cepPrefixes: ["89805"] },
  { bairro: "Passo dos Fortes", filialId: "filial-lider", taxaEntrega: 6.9, zona: "perto", cepPrefixes: ["89805"] },
  { bairro: "Presidente Médici", filialId: "filial-lider", taxaEntrega: 7.9, zona: "perto", aliases: ["presidente medici"], cepPrefixes: ["89801", "89806"] },
  { bairro: "Maria Goretti", filialId: "filial-lider", taxaEntrega: 7.9, zona: "perto", cepPrefixes: ["89801", "89806"] },
  { bairro: "São Cristóvão", filialId: "filial-lider", taxaEntrega: 7.9, zona: "perto", aliases: ["sao cristovao"], cepPrefixes: ["89803", "89804"] },
  { bairro: "Jardim América", filialId: "filial-lider", taxaEntrega: 7.9, zona: "perto", cepPrefixes: ["89803"] },
  { bairro: "Jardim Itália", filialId: "filial-lider", taxaEntrega: 7.9, zona: "perto", cepPrefixes: ["89802", "89814"] },
  { bairro: "Bela Vista", filialId: "filial-lider", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89804"] },
  { bairro: "Jardins", filialId: "filial-lider", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89804"] },
  { bairro: "Parque das Palmeiras", filialId: "filial-lider", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89803"] },
  { bairro: "Boa Vista", filialId: "filial-lider", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89806"] },
  { bairro: "Bom Pastor", filialId: "filial-lider", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89806"] },
  { bairro: "São Pedro", filialId: "filial-lider", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89806"] },
  { bairro: "Pinheirinho", filialId: "filial-lider", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89806"] },
  { bairro: "Bom Retiro", filialId: "filial-lider", taxaEntrega: 9.9, zona: "media", cepPrefixes: ["89805", "89811"] },
  { bairro: "Santa Paulina", filialId: "filial-lider", taxaEntrega: 9.9, zona: "media", cepPrefixes: ["89805", "89811"] },
  { bairro: "SAIC", filialId: "filial-lider", taxaEntrega: 9.9, zona: "media", aliases: ["saic"], cepPrefixes: ["89802"] },
  { bairro: "Fronteira Sul", filialId: "filial-lider", taxaEntrega: 10.9, zona: "longe", cepPrefixes: ["89808"] },
  { bairro: "Autódromo", filialId: "filial-lider", taxaEntrega: 10.9, zona: "longe", cepPrefixes: ["89808"] },
  { bairro: "Araras", filialId: "filial-lider", taxaEntrega: 10.9, zona: "longe", cepPrefixes: ["89808"] },
  { bairro: "Desbravador", filialId: "filial-lider", taxaEntrega: 10.9, zona: "longe", cepPrefixes: ["89811"] },
  { bairro: "Lajeado", filialId: "filial-lider", taxaEntrega: 11.9, zona: "longe", cepPrefixes: ["89804"] },
  { bairro: "Jardins do Vale", filialId: "filial-lider", taxaEntrega: 11.9, zona: "longe", cepPrefixes: ["89807"] },
  { bairro: "São Lucas", filialId: "filial-lider", taxaEntrega: 9.9, zona: "media", cepPrefixes: ["89806", "89812"] },
  { bairro: "Paraíso", filialId: "filial-lider", taxaEntrega: 9.9, zona: "media", cepPrefixes: ["89806"] },

  { bairro: "Efapi", filialId: "filial-efapi-tancredo", taxaEntrega: 6.9, zona: "perto", cepPrefixes: ["89809"] },
  { bairro: "Eldorado", filialId: "filial-efapi-tancredo", taxaEntrega: 7.9, zona: "perto", cepPrefixes: ["89810"] },
  { bairro: "Cristo Rei", filialId: "filial-efapi-tancredo", taxaEntrega: 7.9, zona: "perto", cepPrefixes: ["89810"] },
  { bairro: "Alvorada", filialId: "filial-efapi-tancredo", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89804", "89810"] },
  { bairro: "Engenho Braun", filialId: "filial-efapi-tancredo", taxaEntrega: 9.9, zona: "media", cepPrefixes: ["89804", "89809"] },
  { bairro: "Água Santa", filialId: "filial-efapi-tancredo", taxaEntrega: 9.9, zona: "media", cepPrefixes: ["89810"] },
  { bairro: "Belvedere", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 7.9, zona: "perto", cepPrefixes: ["89810"] },
  { bairro: "Trevo", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 7.9, zona: "perto", cepPrefixes: ["89810"] },
  { bairro: "Vila Rica", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89810"] },
  { bairro: "Alto da Serra", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 12.9, zona: "longe", cepPrefixes: ["89816"] },
  { bairro: "Goio-En", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, zona: "rural", aliases: ["goio en"], cepPrefixes: ["89816"] },
  { bairro: "Centro Marechal Bormann", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, zona: "rural", aliases: ["centro marechal bormann", "marechal bormann"], cepPrefixes: ["89816"] },
  { bairro: "Figueira", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, zona: "rural", cepPrefixes: ["89816"] },
  { bairro: "Vederti", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, zona: "rural", cepPrefixes: ["89816"] },
  { bairro: "Perimetral", filialId: "filial-efapi-atilio-fontana", taxaEntrega: 14.9, zona: "rural", cepPrefixes: ["89816"] },

  { bairro: "Palmital", filialId: "filial-palmital", taxaEntrega: 6.9, zona: "perto", cepPrefixes: ["89812", "89814"] },
  { bairro: "Santo Antônio", filialId: "filial-palmital", taxaEntrega: 7.9, zona: "perto", aliases: ["santo antonio"], cepPrefixes: ["89815"] },
  { bairro: "Universitário", filialId: "filial-palmital", taxaEntrega: 7.9, zona: "perto", cepPrefixes: ["89812", "89814"] },
  { bairro: "Seminário", filialId: "filial-palmital", taxaEntrega: 7.9, zona: "perto", cepPrefixes: ["89813", "89814"] },
  { bairro: "Santa Maria", filialId: "filial-palmital", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89812"] },
  { bairro: "Esplanada", filialId: "filial-palmital", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89812"] },
  { bairro: "Dom Pascoal", filialId: "filial-palmital", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89814"] },
  { bairro: "Dom Gerônimo", filialId: "filial-palmital", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89811"] },
  { bairro: "Monte Belo", filialId: "filial-palmital", taxaEntrega: 8.9, zona: "media", cepPrefixes: ["89812"] },
  { bairro: "Industrial", filialId: "filial-palmital", taxaEntrega: 9.9, zona: "media", cepPrefixes: ["89813"] },
  { bairro: "Progresso", filialId: "filial-palmital", taxaEntrega: 9.9, zona: "media", cepPrefixes: ["89813"] },
  { bairro: "Campestre", filialId: "filial-palmital", taxaEntrega: 11.9, zona: "longe", cepPrefixes: ["89814"] },
  { bairro: "Comunidade Palmital dos Fundos", filialId: "filial-palmital", taxaEntrega: 12.9, zona: "longe", aliases: ["palmital dos fundos"], cepPrefixes: ["89815"] },
  { bairro: "Quedas do Palmital", filialId: "filial-palmital", taxaEntrega: 12.9, zona: "longe", cepPrefixes: ["89815"] },
  { bairro: "Santos Dumont", filialId: "filial-palmital", taxaEntrega: 12.9, zona: "longe", cepPrefixes: ["89815"] },
  { bairro: "Área Rural de Chapecó", filialId: "filial-palmital", taxaEntrega: 18.9, zona: "rural", aliases: ["area rural", "interior"], cepPrefixes: ["89815"] },
];

function normalizarTexto(valor?: string | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function bairroBate(cobertura: CoberturaEntrega, bairro?: string | null) {
  const bairroNormalizado = normalizarTexto(bairro);
  if (!bairroNormalizado) return false;

  return [cobertura.bairro, ...(cobertura.aliases || [])].some((nome) =>
    bairroNormalizado.includes(normalizarTexto(nome)),
  );
}

function cepBate(cobertura: CoberturaEntrega, cep?: string | null) {
  const cepLimpo = String(cep || "").replace(/\D/g, "");
  const prefixoCep = cepLimpo.slice(0, 5);

  if (!prefixoCep) return false;

  return cobertura.cepPrefixes?.some((prefixo) => prefixo === prefixoCep) || false;
}

const prioridadeZona: Record<CoberturaEntrega["zona"], number> = {
  perto: 1,
  media: 2,
  longe: 3,
  rural: 4,
};

function ordenarPorMenorCusto(a: CoberturaEntrega, b: CoberturaEntrega) {
  const taxaDiff = a.taxaEntrega - b.taxaEntrega;
  if (taxaDiff !== 0) return taxaDiff;

  const distanciaA = a.distanciaKm ?? Number.POSITIVE_INFINITY;
  const distanciaB = b.distanciaKm ?? Number.POSITIVE_INFINITY;
  const distanciaDiff = distanciaA - distanciaB;
  if (distanciaDiff !== 0) return distanciaDiff;

  return prioridadeZona[a.zona] - prioridadeZona[b.zona];
}

export function buscarCoberturasEntrega({
  cep,
  bairro,
}: {
  cep?: string | null;
  bairro?: string | null;
}): CoberturaEntregaComFilial[] {
  const porBairro = coberturaEntrega.filter((item) => bairroBate(item, bairro));
  const candidatos =
    porBairro.length > 0
      ? porBairro
      : coberturaEntrega.filter((item) => cepBate(item, cep));

  return candidatos
    .map((cobertura) => {
      const filial = getFilialById(cobertura.filialId);
      return filial ? { ...cobertura, filial } : null;
    })
    .filter((item): item is CoberturaEntregaComFilial => item !== null)
    .sort(ordenarPorMenorCusto);
}

export function buscarCoberturaEntrega({
  cep,
  bairro,
}: {
  cep?: string | null;
  bairro?: string | null;
}): CoberturaEntregaComFilial | null {
  return buscarCoberturasEntrega({ cep, bairro })[0] || null;
}
