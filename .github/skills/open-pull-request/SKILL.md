---
name: open-pull-request
description: Abrir um pull request para a main já com o rótulo de versão correto (release:major, release:minor ou nenhum). Use quando solicitado a abrir, criar ou enviar um PR.
---

# Abrir pull request

Explique suas ações em português. Título do PR em inglês no formato Conventional
Commits; corpo em português. Nunca faça push direto na `main`.

## 1. Preparar a branch

1. Rode `git status --short --branch`. Se houver alterações não commitadas que
   façam parte do pedido, use a skill `commit-changes` antes.
2. Se a branch atual for `main`, crie uma branch (`feat/...`, `fix/...`,
   `chore/...`) a partir dela e mova os commits para lá. Não faça reset na `main`
   local sem confirmação do usuário.
3. Revise `git log origin/main..HEAD` e `git diff origin/main...HEAD`.
4. Rode `npm run typecheck && npm test` antes de enviar.

## 2. Escolher o rótulo de versão

O workflow `release-version.yml` lê apenas `release:minor` e `release:major`;
sem rótulo o release é `patch`. Ele só gera release quando o PR altera arquivos
que exigem rebuild. Use no máximo um rótulo.

| Mudança | Rótulo |
| --- | --- |
| Breaking change (`!` no tipo ou `BREAKING CHANGE`), incompatibilidade com dados salvos | `release:major` |
| `feat`: nova funcionalidade, novo personagem, novo modo de jogo | `release:minor` |
| `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `chore`, `ci` | nenhum (patch) |

Se houver dúvida entre dois níveis, pergunte ao usuário. Quando há vários
commits, vale o maior nível.

## 3. Abrir o PR

1. Garanta que os rótulos existem (ignore erro se já existirem):
   `gh label create release:minor --color 0E8A16 --force` e
   `gh label create release:major --color B60205 --force`.
2. `git push -u origin HEAD`.
3. `gh pr create --base main --title "<título>" --body "<corpo>" [--label release:minor|release:major]`.
   Se `gh` não estiver disponível, use as ferramentas do GitHub MCP e aplique o
   rótulo no PR criado.
4. Confira com `gh pr view --json labels` que o rótulo ficou como esperado e
   informe a URL do PR e o tipo de versão resultante (patch/minor/major).
