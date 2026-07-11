export type AlertaInicial = {
  principioAtivo: string;
  mensagem: string;
  alertas: string[];
  contraindicacoes: string[];
  revisado: boolean;
  fonte: string;
};

const FONTE_RASCUNHO =
  "Rascunho a validar com a bula oficial do Bulário Eletrônico da ANVISA";

export const alertasIniciais: AlertaInicial[] = [
  {
    principioAtivo: "Ibuprofeno",
    mensagem: "Não usar em caso de suspeita de dengue.",
    alertas: [
      "Não usar em caso de suspeita de dengue ou outras arboviroses.",
      "Evitar uso contínuo por mais de alguns dias sem orientação médica.",
      "Pode causar irritação gástrica; tomar preferencialmente após as refeições.",
    ],
    contraindicacoes: [
      "Úlcera gástrica ou duodenal ativa.",
      "Terceiro trimestre de gravidez.",
      "Alergia a ibuprofeno ou outros anti-inflamatórios.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Dipirona",
    mensagem: "Consulte a bula ou um farmacêutico antes de usar.",
    alertas: [
      "Suspender o uso e procurar ajuda médica em caso de reações alérgicas na pele.",
      "Não ultrapassar a dose máxima diária indicada na bula.",
    ],
    contraindicacoes: [
      "Alergia a dipirona ou outras pirazolonas.",
      "Histórico de problemas na medula óssea.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Paracetamol",
    mensagem: "Não exceder a dose máxima diária informada na bula.",
    alertas: [
      "Doses acima do recomendado podem causar dano ao fígado.",
      "Verificar se outros medicamentos em uso também contêm paracetamol.",
    ],
    contraindicacoes: [
      "Doença hepática grave.",
      "Consumo frequente e elevado de bebida alcoólica.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Loratadina",
    mensagem: "Pode causar sonolência em algumas pessoas.",
    alertas: [
      "Evitar dirigir ou operar máquinas até saber como o corpo reage.",
      "Uso em crianças deve seguir a dose por peso indicada na bula.",
    ],
    contraindicacoes: ["Alergia a loratadina."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Dimeticona",
    mensagem: "Uso para alívio de gases; procure um médico se os sintomas persistirem.",
    alertas: [
      "Se os sintomas persistirem por mais de alguns dias, procurar orientação médica.",
    ],
    contraindicacoes: ["Alergia a dimeticona."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Omeprazol",
    mensagem: "Uso contínuo prolongado deve ter acompanhamento médico.",
    alertas: [
      "Uso prolongado sem orientação médica não é recomendado.",
      "Pode mascarar sintomas de outras doenças digestivas.",
    ],
    contraindicacoes: ["Alergia a omeprazol ou outros inibidores de bomba de prótons."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Ácido Acetilsalicílico",
    mensagem: "Não usar em caso de suspeita de dengue ou febre em crianças.",
    alertas: [
      "Não usar em caso de suspeita de dengue ou outras arboviroses.",
      "Não indicado para crianças e adolescentes com quadros virais (risco de Síndrome de Reye).",
    ],
    contraindicacoes: [
      "Úlcera gástrica ativa.",
      "Distúrbios de coagulação.",
      "Crianças e adolescentes com sintomas de virose.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Cetirizina",
    mensagem: "Pode causar sonolência em algumas pessoas.",
    alertas: ["Evitar associar com bebidas alcoólicas."],
    contraindicacoes: ["Alergia a cetirizina ou hidroxizina."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Domperidona",
    mensagem: "Não ultrapassar a dose e o tempo de uso indicados na bula.",
    alertas: [
      "Não ultrapassar a dose máxima diária.",
      "Evitar uso prolongado sem orientação médica.",
    ],
    contraindicacoes: [
      "Problemas cardíacos no ritmo (arritmias).",
      "Uso conjunto com certos antifúngicos e antibióticos sem orientação médica.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Loperamida",
    mensagem: "Não usar em caso de febre alta ou sangue nas fezes.",
    alertas: [
      "Procurar um médico se houver febre alta ou sangue nas fezes.",
      "Não usar por mais de 2 dias sem orientação médica.",
    ],
    contraindicacoes: ["Crianças menores de 6 anos sem orientação médica."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Hidróxido de Alumínio",
    mensagem: "Uso contínuo prolongado deve ter acompanhamento médico.",
    alertas: ["Pode interferir na absorção de outros medicamentos."],
    contraindicacoes: ["Problemas renais graves."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Dexclorfeniramina",
    mensagem: "Pode causar sonolência.",
    alertas: [
      "Evitar dirigir ou operar máquinas até saber como o corpo reage.",
      "Evitar associar com bebidas alcoólicas.",
    ],
    contraindicacoes: ["Glaucoma de ângulo fechado."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Vitamina C",
    mensagem: "Doses muito altas podem causar desconforto gastrointestinal.",
    alertas: ["Doses elevadas por longos períodos podem causar desconforto digestivo."],
    contraindicacoes: ["Histórico de cálculos renais de oxalato."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Melatonina",
    mensagem: "Não recomendado uso contínuo sem orientação médica.",
    alertas: [
      "Evitar dirigir ou operar máquinas logo após o uso.",
      "Uso contínuo prolongado deve ter acompanhamento profissional.",
    ],
    contraindicacoes: ["Gravidez e amamentação sem orientação médica."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Simeticona",
    mensagem: "Uso para alívio de gases; procure um médico se os sintomas persistirem.",
    alertas: ["Se os sintomas persistirem, procurar orientação médica."],
    contraindicacoes: ["Alergia a simeticona."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
];
