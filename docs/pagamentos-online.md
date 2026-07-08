# Pagamentos online

O app ja esta preparado para gravar pedidos com estrutura de Pix e cartao online,
mas a cobranca real precisa de um backend com as credenciais do provedor.

## O que ja ficou pronto

- Opcao `Pix` no checkout.
- Opcao `Cartao online` no checkout.
- Campo `pagamentoOnline` gravado no pedido.
- Status separado para pagamento online.
- Regras do Firestore aceitando a nova forma `Cartao online`.
- Modo simulado em `constants/pagamentos.ts`.

Exemplo salvo no pedido:

```ts
pagamentoOnline: {
  provedor: "mercado_pago",
  ambiente: "simulado",
  metodo: "pix" | "cartao",
  status: "aguardando_configuracao",
  transacaoId: null,
  qrCode: null,
  copiaECola: null,
  linkPagamento: null,
  mensagem: "Pagamento online preparado..."
}
```

## O que falta para ativar de verdade

1. Criar conta no provedor, preferencialmente Mercado Pago para Pix e cartao no Brasil.
2. Cadastrar a chave Pix e liberar pagamentos por cartao na conta.
3. Criar backend seguro, por exemplo Firebase Cloud Functions.
4. Guardar as credenciais somente no backend:

```env
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_WEBHOOK_SECRET=
```

5. Implementar tres funcoes:

- `criarPagamentoPix(pedidoId)`: cria cobranca Pix e devolve QR Code/copia e cola.
- `criarPagamentoCartao(pedidoId, tokenCartao)`: cria cobranca usando token seguro do provedor.
- `webhookPagamento`: recebe confirmacao do provedor e atualiza o pedido.

## Cuidados importantes

- Nunca colocar `access token` ou chave secreta no app.
- Nunca salvar numero completo do cartao, CVV ou dados sensiveis no Firestore.
- Cartao online precisa usar tokenizacao/checkout seguro do provedor.
- Pix manual por chave estatica nao confirma pagamento automaticamente.

## Fluxo esperado depois da vinculacao

1. Cliente escolhe Pix ou Cartao online.
2. App cria pedido como `pagamentoDetalhes.status = "pendente"`.
3. Backend cria a cobranca no provedor.
4. App mostra QR Code/link/status.
5. Provedor chama o webhook quando pagar.
6. Webhook muda o pedido para `pagamentoDetalhes.status = "aprovado"`.
