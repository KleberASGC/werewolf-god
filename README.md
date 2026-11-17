# Werewolf God

Assistente web para apoiar mestres durante partidas presenciais de Lobisomem.

## Status

Fundação React/TypeScript/Vite, cadastro local e condução de partidas implementados. O motor de domínio v1 valida a configuração, sorteia papéis, conduz e resolve ações noturnas, cronômetro, votação e vitória.

O progresso é salvo automaticamente no IndexedDB deste navegador e pode ser retomado pela lista de partidas. Cadastros antigos continuam disponíveis para preparação. Durante a discussão, o temporizador continua contando enquanto a página está fechada. Se o salvamento falhar, mantenha a tela aberta e use **Tentar salvar novamente**; sair antes de salvar descarta as últimas alterações.

Os dados ficam apenas neste perfil e dispositivo e podem ser apagados pelo navegador ou perdidos. Use uma única aba para conduzir cada partida: alterações simultâneas entre abas não são conciliadas. Não há sincronização nem backup; exportação/importação e cache offline ainda não foram implementados.

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
