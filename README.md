# Werewolf God

Assistente web para apoiar mestres durante partidas presenciais de Lobisomem.

## Status

Fundação React/TypeScript/Vite, cadastro local e condução de partidas implementados. O motor de domínio v1 valida a configuração, sorteia papéis, conduz e resolve ações noturnas, cronômetro, votação e vitória.

O progresso é salvo automaticamente no IndexedDB deste navegador e pode ser retomado pela lista de partidas. Cadastros antigos continuam disponíveis para preparação. Durante a discussão, o temporizador continua contando enquanto a página está fechada. Se o salvamento falhar, mantenha a tela aberta e use **Tentar salvar novamente**; sair antes de salvar descarta as últimas alterações.

Na tela inicial, **Exportar backup** baixa um arquivo JSON com todos os cadastros e progressos, inclusive papéis e histórico secretos. Guarde-o em local privado. **Importar backup** mescla os dados: partidas com o mesmo identificador são substituídas e as demais são preservadas. A importação valida o arquivo antes de gravá-lo.

Após a primeira visita online, o app shell e os arquivos estáticos são armazenados em cache para abrir o aplicativo sem conexão. Os dados das partidas continuam no IndexedDB local. Eles ficam apenas neste perfil e dispositivo e podem ser apagados pelo navegador ou perdidos; mantenha backups externos. Use uma única aba para conduzir cada partida: alterações simultâneas entre abas não são conciliadas. Não há sincronização.

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

## Deploy

O site de produção é publicado pelo Cloudflare Pages a partir do repositório
GitHub. Com a integração Git ativa e `main` definida como branch de produção,
cada push em `main` — inclusive um merge de pull request — inicia
automaticamente um novo build e deploy. Não é necessário executar um comando
manual de publicação.

Branches diferentes de `main` e pull requests podem gerar deploys de preview
com uma URL própria. Eles não alteram o domínio de produção. Os previews são
públicos por padrão; use apenas dados fictícios neles.

No projeto do Cloudflare Pages, confira estas configurações:

- Branch de produção: `main`
- Comando de build: `npm test && npm run build`
- Diretório de saída: `dist`
- Diretório raiz: vazio (raiz do repositório)
- Variáveis de ambiente: nenhuma necessária atualmente

O comando de build roda primeiro a suíte de testes e depois o typecheck/build
de produção. Se qualquer etapa falhar, o comando termina com erro e aquele
deploy não deve ser promovido. Depois de um merge, acompanhe o status do
commit/PR no GitHub ou o histórico de deploys em **Workers & Pages → werewolf-god
→ Deployments**. Se não houver um novo deploy, confira se a integração Git
continua conectada e se os deploys automáticos da branch de produção estão
habilitados.

Para reverter uma publicação problemática, use o rollback para um deploy de
produção anterior no painel do Pages ou reverta o commit no GitHub e faça merge
normalmente. O rollback do site não reverte dados que já estejam salvos no
navegador.

Após cada publicação, valide `https://werewolfmoderator.com`, especialmente
depois de alterações no armazenamento local ou no service worker. Os dados das
partidas ficam no IndexedDB de cada navegador, não no Cloudflare; a publicação
ou o rollback não cria nem restaura backups desses dados.

## Planejamento

Consulte [docs/product-plan.md](docs/product-plan.md) para a visão do produto, escopo proposto do MVP, alternativas arquiteturais, modelo de domínio, estratégia do motor de regras, testes, infraestrutura e roadmap.

## Regras do jogo

O conjunto aprovado para o motor v1 está em [docs/rules/ruleset-v1.md](docs/rules/ruleset-v1.md). O rascunho de descoberta permanece em [docs/rules/initial-rules-draft.md](docs/rules/initial-rules-draft.md), e o template para futuras versões está em [docs/rules/ruleset-template.md](docs/rules/ruleset-template.md).
