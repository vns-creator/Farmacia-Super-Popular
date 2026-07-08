# Roteiro de apresentacao comercial

Use este roteiro para apresentar o app como produto pronto para piloto comercial.
Pagamentos online ficam fora desta demonstracao.

## Preparacao antes da reuniao

- Entrar no app com um usuario admin ativo.
- Verificar se o catalogo inicial foi importado em `Conta > Gerenciar produtos`.
- Marcar alguns produtos como oferta e destaque.
- Criar um usuario cliente de teste.
- Criar um usuario entregador de teste e vincular a uma filial.
- Confirmar se os dados demo das filiais aparecem em `Dados da farmacia`.

## Fluxo recomendado

1. Abrir a home e mostrar busca, categorias, ofertas e destaques.
2. Adicionar dois ou tres produtos ao carrinho.
3. Abrir o carrinho e ir para o checkout.
4. Fazer um pedido de entrega com CEP/bairro que sugira uma filial.
5. Mostrar `Meus pedidos` e o detalhe do pedido para o cliente.
6. Entrar no painel admin em `Conta > Painel da farmacia`.
7. Mostrar filtros, busca, dados do cliente, itens, pagamento manual e WhatsApp.
8. Alterar status para `Em preparo` e depois `Saiu entrega`.
9. Atribuir um entregador.
10. Abrir a area do entregador e finalizar a entrega.
11. Voltar ao detalhe do pedido e mostrar o historico/status atualizado.
12. Abrir `Gerenciar produtos` e demonstrar edicao de preco, oferta e destaque.
13. Abrir `Sobre o sistema` para resumir os diferenciais.

## Pontos de venda

- A farmacia controla produtos e ofertas sem depender de editar codigo.
- O cliente acompanha pedidos em tempo real.
- A operacao separa pedidos por filial.
- Admins de filial veem apenas os dados da propria unidade.
- Entregadores recebem entregas atribuidas.
- O app ja possui Termos de Uso, Politica de Privacidade e dados regulatorios
  por filial.
- O modelo comercial pode ser implantacao + mensalidade.

## Perguntas provaveis

- `Da para integrar pagamento online?`
  Sim, a estrutura esta preparada, mas a cobranca real fica para uma etapa
  posterior com provedor como Mercado Pago ou Pagar.me.

- `Da para publicar na loja?`
  Sim. Para Android, gerar build EAS. Para iOS, usar Apple Developer e
  TestFlight/App Store.

- `Da para adaptar para outra farmacia?`
  Sim. Troca-se marca, filiais, usuarios, catalogo, dados regulatorios e regras
  comerciais.
