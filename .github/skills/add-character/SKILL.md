---
name: add-character
description: Adicionar ou implementar um personagem, papel ou função no Werewolf Moderator a partir de sua ficha no catálogo; use também quando solicitado a transformar uma proposta de personagem em código.
---

# Adicionar um personagem

Use este fluxo para implementar um personagem a partir de
[`docs/characters.md`](../../../docs/characters.md). Responda em português e
preserve alterações locais que não façam parte da tarefa.

## 1. Identificar e validar a proposta

1. Leia o catálogo, a ficha do personagem solicitado e o conjunto de regras
   aplicável, atualmente [`docs/rules/ruleset-v1.md`](../../../docs/rules/ruleset-v1.md).
   Confira também os testes e o código relevantes antes de decidir o que mudar.
2. Se o personagem não tiver sido identificado, se houver mais de uma ficha
   candidata ou se a ficha ainda não existir, peça ao usuário que indique o
   personagem ou forneça suas regras. Não implemente a ficha de exemplo.
3. Confira identificador e nome, facção e vitória, composição, ação e momento,
   alvos, limites, obrigatoriedade, efeitos, interações, informações reveladas,
   eliminação e cenários de aceitação. Considere também múltiplas cópias,
   jogadores eliminados, ausência de alvos válidos e ações simultâneas quando
   pertinentes.
4. Não invente regras nem importe suposições de outras versões do jogo.
   Se houver campos pendentes ou conflitos que afetem o comportamento, pergunte
   ao usuário, uma decisão por vez. Registre as respostas na ficha.
5. Se a proposta ainda não estiver aprovada para implementação, peça
   confirmação explícita das regras antes de alterar o comportamento. Uma
   solicitação para implementar uma ficha identificada e suficientemente
   definida conta como aprovação dessa proposta; não trate uma ficha ambígua
   como aprovada. Não declare aprovação em nome do usuário.

## 2. Integrar regras e implementação

1. Atualize o catálogo e o conjunto de regras aplicável com as decisões
   aprovadas, incluindo ordem de ação, interações, vitória e cenários relevantes.
   Preserve o significado histórico de regras já aprovadas; se for necessário
   alterar a versão ou a aplicação de regras a partidas existentes, esclareça
   a estratégia com o usuário antes de assumir uma migração.
2. Rastreie todos os usos dos papéis, ações e condições de vitória. Avalie,
   conforme a ficha, os identificadores e rótulos, configuração e sorteio,
   tipos e estado da partida, chamadas, validação de alvos, recursos, resolução,
   histórico, informação privada/pública e encerramento.
3. Integre a interface em todos os pontos necessários: composição, distribuição,
   chamada, escolha e revisão de ações, resultados e histórico. Mantenha o
   sigilo das informações e as mensagens em português.
4. Verifique persistência, retomada, importação e exportação de backups. Preserve
   partidas e backups anteriores; se o formato ou a semântica de dados salvos
   precisar mudar, defina e teste uma estratégia de compatibilidade ou migração
   antes de aplicá-la. Não descarte dados nem introduza valores padrão que
   escondam uma incompatibilidade.
5. Marque o personagem como implementado no catálogo somente após concluir a
   integração. Não altere regras ou comportamentos de outros personagens sem
   necessidade e aprovação.

Os pontos de partida atuais incluem `src/domain/ruleset-v1.ts`,
`src/domain/match-setup.ts`, `src/domain/match.ts`,
`src/domain/match-engine.ts`, `src/app/App.tsx` e
`src/infrastructure/game-repository.ts`. Pesquise os demais usos em vez de
presumir que essa lista é exaustiva.

## 3. Testar e informar

1. Acrescente testes proporcionais às regras aprovadas: composição e sorteio,
   ação normal e inválida, limites, interações e vitória, conforme aplicável.
   Cubra também a interface, sigilo, retomada e backup quando afetados, além
   de regressões para personagens e partidas anteriores.
2. Execute os testes existentes mais específicos para o comportamento alterado
   e `npm run build` para validar tipos e compilação. Se o conjunto de mudanças
   atravessar o aplicativo, use `npm test` para verificar a suíte do projeto.
   Não instale ferramentas de teste novas.
3. Confira que as regras, a ficha e o comportamento coincidem. Informe o que
   foi implementado, os testes executados e eventuais limitações ou decisões
   ainda pendentes. Se estiver bloqueado por uma regra não aprovada, explique
   o bloqueio em vez de apresentar uma implementação parcial como concluída.
