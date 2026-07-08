# System Delivery Farmacia

Aplicativo proprietario para operacao de delivery e retirada em farmacia, com
catalogo editavel, carrinho, checkout, pedidos em tempo real, painel
administrativo, fluxo de entregadores, suporte multi-filial e base preparada para
pagamentos online.

## Propriedade intelectual

Copyright (c) 2026 Vinicius Piana Lanzarin. Todos os direitos reservados.

Este projeto e software proprietario. O codigo-fonte, arquitetura, telas,
documentacao, configuracoes e materiais relacionados nao podem ser copiados,
modificados, distribuidos, sublicenciados, publicados, vendidos, revendidos,
cedidos ou utilizados comercialmente sem autorizacao previa e expressa por
escrito do titular.

Consulte `LICENSE` e `NOTICE.md` para os termos completos.

## Desenvolvimento

Instale as dependencias:

```bash
npm install
```

Inicie o app:

```bash
npx expo start
```

Validacoes recomendadas:

```bash
npx tsc --noEmit --pretty false
npm run lint -- --max-warnings=0
npx expo-doctor
```

## Build Android

```bash
npx eas-cli build -p android --profile preview --non-interactive
```
