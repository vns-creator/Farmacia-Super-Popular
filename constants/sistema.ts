export const sistemaInfo = {
  nome: "System Delivery Farmácia",
  resumo:
    "Plataforma de pedidos para farmácia com catálogo, carrinho, painel operacional, entregadores e suporte multi-filial.",
  recursos: [
    {
      titulo: "Catálogo editável",
      descricao:
        "Produtos, categorias, ofertas, destaques, imagens por URL e ativação/desativação pelo painel admin.",
    },
    {
      titulo: "Pedido completo",
      descricao:
        "Fluxo de entrega ou retirada, dados do cliente, endereço salvo, filial responsável, observações e histórico.",
    },
    {
      titulo: "Painel da farmácia",
      descricao:
        "Acompanhamento em tempo real, filtros, busca, status do pedido, observação interna e contato por WhatsApp.",
    },
    {
      titulo: "Entregadores",
      descricao:
        "Usuários entregadores recebem pedidos atribuídos e podem finalizar entregas com controle por filial.",
    },
    {
      titulo: "Multi-filial",
      descricao:
        "Admins gerais veem toda a rede; admins de filial veem apenas pedidos, produtos e usuários da própria unidade.",
    },
    {
      titulo: "Base para produção",
      descricao:
        "Regras Firestore publicadas, termos de uso, política de privacidade, dados regulatórios por filial e build preview.",
    },
  ],
  roteiro: [
    "Mostrar o cliente navegando por ofertas e categorias.",
    "Adicionar produtos ao carrinho e finalizar pedido de entrega.",
    "Abrir o painel da farmácia e atualizar o status.",
    "Atribuir entregador para um pedido de entrega.",
    "Mostrar o cliente acompanhando o pedido em tempo real.",
    "Editar produto, marcar destaque e oferta.",
  ],
};
