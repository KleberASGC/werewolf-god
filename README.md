# Werewolf God

Assistente web para apoiar mestres durante partidas presenciais de Lobisomem.

## Status

Fundação React/TypeScript/Vite e cadastro local de partidas implementados. O motor de domínio v1 já valida a configuração, sorteia papéis, conduz e resolve ações noturnas, cronômetro, votação e vitória. A integração desse motor à interface e à persistência de partidas em andamento ainda está em desenvolvimento.

## Executar localmente

Requer Node.js 18 ou superior e npm:

```sh
npm install
npm run dev
```

Para validar a compilação:

```sh
npm run build
```

Para executar os testes do domínio:

```sh
npm test
```

## Planejamento

Consulte [docs/product-plan.md](docs/product-plan.md) para a visão do produto, escopo proposto do MVP, alternativas arquiteturais, modelo de domínio, estratégia do motor de regras, testes, infraestrutura e roadmap.

## Regras do jogo

O conjunto aprovado para o motor v1 está em [docs/rules/ruleset-v1.md](docs/rules/ruleset-v1.md). O rascunho de descoberta permanece em [docs/rules/initial-rules-draft.md](docs/rules/initial-rules-draft.md), e o template para futuras versões está em [docs/rules/ruleset-template.md](docs/rules/ruleset-template.md).
