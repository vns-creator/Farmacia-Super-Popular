export const sistemaInfo = {
  nome: "System Delivery Farmacia",
  resumo:
    "Plataforma de pedidos para farmacia com catalogo, carrinho, painel operacional, entregadores e suporte multi-filial.",
  recursos: [
    {
      titulo: "Catalogo editavel",
      descricao:
        "Produtos, categorias, ofertas, destaques, imagens por URL e ativacao/desativacao pelo painel admin.",
    },
    {
      titulo: "Pedido completo",
      descricao:
        "Fluxo de entrega ou retirada, dados do cliente, endereco salvo, filial responsavel, observacoes e historico.",
    },
    {
      titulo: "Painel da farmacia",
      descricao:
        "Acompanhamento em tempo real, filtros, busca, status do pedido, observacao interna e contato por WhatsApp.",
    },
    {
      titulo: "Entregadores",
      descricao:
        "Usuarios entregadores recebem pedidos atribuidos e podem finalizar entregas com controle por filial.",
    },
    {
      titulo: "Multi-filial",
      descricao:
        "Admins gerais veem toda a rede; admins de filial veem apenas pedidos, produtos e usuarios da propria unidade.",
    },
    {
      titulo: "Base para producao",
      descricao:
        "Regras Firestore publicadas, termos de uso, politica de privacidade, dados regulatorios por filial e build preview.",
    },
  ],
  roteiro: [
    "Mostrar o cliente navegando por ofertas e categorias.",
    "Adicionar produtos ao carrinho e finalizar pedido de entrega.",
    "Abrir o painel da farmacia e atualizar o status.",
    "Atribuir entregador para um pedido de entrega.",
    "Mostrar o cliente acompanhando o pedido em tempo real.",
    "Editar produto, marcar destaque e oferta.",
  ],
};
