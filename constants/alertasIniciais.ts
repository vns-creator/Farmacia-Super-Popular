export type AlertaInicial = {
  principioAtivo: string;
  mensagem: string;
  alertas: string[];
  contraindicacoes: string[];
  revisado: boolean;
  fonte: string;
};

const FONTE_RASCUNHO =
  "Rascunho a validar com a bula oficial do Bulario Eletronico da ANVISA";

export const alertasIniciais: AlertaInicial[] = [
  {
    principioAtivo: "Ibuprofeno",
    mensagem: "Não usar em caso de suspeita de dengue.",
    alertas: [
      "Nao usar em caso de suspeita de dengue ou outras arboviroses.",
      "Evitar uso continuo por mais de alguns dias sem orientacao medica.",
      "Pode causar irritacao gastrica; tomar preferencialmente apos as refeicoes.",
    ],
    contraindicacoes: [
      "Ulcera gastrica ou duodenal ativa.",
      "Terceiro trimestre de gravidez.",
      "Alergia a ibuprofeno ou outros anti-inflamatorios.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Dipirona",
    mensagem: "Consulte a bula ou um farmaceutico antes de usar.",
    alertas: [
      "Suspender o uso e procurar ajuda medica em caso de reacoes alergicas na pele.",
      "Nao ultrapassar a dose maxima diaria indicada na bula.",
    ],
    contraindicacoes: [
      "Alergia a dipirona ou outras pirazolonas.",
      "Historico de problemas na medula ossea.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Paracetamol",
    mensagem: "Nao exceder a dose maxima diaria informada na bula.",
    alertas: [
      "Doses acima do recomendado podem causar dano ao figado.",
      "Verificar se outros medicamentos em uso tambem contem paracetamol.",
    ],
    contraindicacoes: [
      "Doenca hepatica grave.",
      "Consumo frequente e elevado de bebida alcoolica.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Loratadina",
    mensagem: "Pode causar sonolencia em algumas pessoas.",
    alertas: [
      "Evitar dirigir ou operar maquinas ate saber como o corpo reage.",
      "Uso em criancas deve seguir a dose por peso indicada na bula.",
    ],
    contraindicacoes: ["Alergia a loratadina."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Dimeticona",
    mensagem: "Uso para alivio de gases; procure um medico se os sintomas persistirem.",
    alertas: [
      "Se os sintomas persistirem por mais de alguns dias, procurar orientacao medica.",
    ],
    contraindicacoes: ["Alergia a dimeticona."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Omeprazol",
    mensagem: "Uso continuo prolongado deve ter acompanhamento medico.",
    alertas: [
      "Uso prolongado sem orientacao medica nao e recomendado.",
      "Pode mascarar sintomas de outras doencas digestivas.",
    ],
    contraindicacoes: ["Alergia a omeprazol ou outros inibidores de bomba de protons."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Ácido Acetilsalicílico",
    mensagem: "Nao usar em caso de suspeita de dengue ou febre em criancas.",
    alertas: [
      "Nao usar em caso de suspeita de dengue ou outras arboviroses.",
      "Nao indicado para crianças e adolescentes com quadros virais (risco de Sindrome de Reye).",
    ],
    contraindicacoes: [
      "Ulcera gastrica ativa.",
      "Distúrbios de coagulacao.",
      "Crianças e adolescentes com sintomas de virose.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Cetirizina",
    mensagem: "Pode causar sonolencia em algumas pessoas.",
    alertas: ["Evitar associar com bebidas alcoolicas."],
    contraindicacoes: ["Alergia a cetirizina ou hidroxizina."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Domperidona",
    mensagem: "Nao ultrapassar a dose e o tempo de uso indicados na bula.",
    alertas: [
      "Nao ultrapassar a dose maxima diaria.",
      "Evitar uso prolongado sem orientacao medica.",
    ],
    contraindicacoes: [
      "Problemas cardiacos no ritmo (arritmias).",
      "Uso conjunto com certos antifungicos e antibioticos sem orientacao medica.",
    ],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Loperamida",
    mensagem: "Nao usar em caso de febre alta ou sangue nas fezes.",
    alertas: [
      "Procurar um medico se houver febre alta ou sangue nas fezes.",
      "Nao usar por mais de 2 dias sem orientacao medica.",
    ],
    contraindicacoes: ["Crianças menores de 6 anos sem orientacao medica."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Hidróxido de Alumínio",
    mensagem: "Uso continuo prolongado deve ter acompanhamento medico.",
    alertas: ["Pode interferir na absorcao de outros medicamentos."],
    contraindicacoes: ["Problemas renais graves."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Dexclorfeniramina",
    mensagem: "Pode causar sonolencia.",
    alertas: [
      "Evitar dirigir ou operar maquinas ate saber como o corpo reage.",
      "Evitar associar com bebidas alcoolicas.",
    ],
    contraindicacoes: ["Glaucoma de angulo fechado."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Vitamina C",
    mensagem: "Doses muito altas podem causar desconforto gastrointestinal.",
    alertas: ["Doses elevadas por longos periodos podem causar desconforto digestivo."],
    contraindicacoes: ["Historico de calculos renais de oxalato."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Melatonina",
    mensagem: "Nao recomendado uso continuo sem orientacao medica.",
    alertas: [
      "Evitar dirigir ou operar maquinas logo apos o uso.",
      "Uso continuo prolongado deve ter acompanhamento profissional.",
    ],
    contraindicacoes: ["Gravidez e amamentacao sem orientacao medica."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
  {
    principioAtivo: "Simeticona",
    mensagem: "Uso para alivio de gases; procure um medico se os sintomas persistirem.",
    alertas: ["Se os sintomas persistirem, procurar orientacao medica."],
    contraindicacoes: ["Alergia a simeticona."],
    revisado: false,
    fonte: FONTE_RASCUNHO,
  },
];
