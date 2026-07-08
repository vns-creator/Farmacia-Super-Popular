# Multi-filial

O app agora tem uma camada inicial para operar filiais de forma separada.

## Como funciona

- Cada pedido salva `filialId`, `filialNome` e `filialEndereco`.
- As filiais estao centralizadas em `constants/filiais.ts` e reutilizadas em
  dados da farmacia, checkout, produtos e usuarios.
- A cobertura de entrega fica em `constants/entrega.ts`, com bairro, filial
  responsavel, zona e taxa de entrega.
- No checkout, o bairro/CEP sugere a filial e soma a taxa ao total do pedido.
- Cada filial possui seus proprios dados de atendimento e regularizacao:
  telefone, WhatsApp, horario, CNPJ, razao social, responsavel tecnico, CRF e
  AFE.
- Admin geral ve todas as filiais.
- Admin com `filialId` ve apenas usuarios, pedidos e produtos da propria filial.
- Entregador com `filialId` ve apenas entregas atribuidas a ele naquela filial.
- Produto pode ser global ou vinculado a uma filial.
- Regras do Firestore bloqueiam leitura/edicao cruzada entre filiais para admins de filial.

## Campos de usuario

```ts
{
  perfil: "admin" | "entregador" | "cliente",
  ativo: true,
  adminGeral: false,
  filialId: "filial-efapi-tancredo",
  filialNome: "Filial Efapi (Tancredo)"
}
```

Para admin geral:

```ts
{
  perfil: "admin",
  ativo: true,
  adminGeral: true,
  filialId: null,
  filialNome: "Todas as filiais"
}
```

Admins antigos sem `filialId` continuam sendo tratados como admin geral para evitar bloqueio acidental.

## Pontos ainda recomendados

- Criar cadastro administravel de filiais no Firestore.
- Criar cadastro administravel de bairros e taxas de entrega no Firestore.
- Separar estoque por filial.
- Adicionar relatorios por filial.
- Permitir produtos globais com preco diferente por filial.
