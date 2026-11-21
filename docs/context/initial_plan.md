# Planejamento inicial — Assistente para Mestres de Lobisomem

Quero iniciar o desenvolvimento de uma aplicação cujo objetivo é auxiliar pessoas que atuam como mestres em partidas presenciais do jogo Lobisomem.

Neste momento, estamos na fase inicial do projeto. O repositório está praticamente vazio e contém apenas um README.md sem conteúdo relevante.

**Sua missão inicial é atuar como Arquiteto de Software, Product Owner técnico e consultor de tecnologia.** Quero que você me ajude a transformar essa ideia em um projeto bem estruturado, tomando decisões técnicas fundamentadas e elaborando um plano de implementação antes de começarmos a desenvolver.

IMPORTANTE: Não comece a implementar a aplicação imediatamente. Estamos no modo de planejamento. Primeiro, precisamos entender o produto, avaliar alternativas e definir a arquitetura.

---

## 1. Visão geral do produto

A ideia é desenvolver uma aplicação web que funcione como um assistente para o mestre de uma partida presencial de Lobisomem.

O jogo acontece fisicamente, com os participantes sentados em uma roda. O mestre é responsável por conduzir a partida, anunciar as fases do jogo, orientar os personagens e interpretar o resultado das ações realizadas durante a noite.

O problema é que administrar tudo isso manualmente pode ser bastante trabalhoso. O mestre precisa memorizar as habilidades dos personagens, lembrar a ordem das ações noturnas, registrar quem escolheu quem, verificar conflitos entre habilidades e determinar o resultado da noite.

Quero que nossa aplicação assuma boa parte desse trabalho.

### Exemplo de funcionamento

Imagine uma partida com 10 jogadores e os seguintes personagens:

- Lobisomem (Werewolf);
- Aldeão (Villager);
- Vidente (Seer);
- Guarda-costas (Bodyguard);
- Bruxa (Witch);
- Outros personagens que possam existir nas diferentes versões do jogo.

Durante a noite, o mestre utiliza a aplicação para registrar as ações dos personagens.

Por exemplo:

1. O mestre inicia a fase noturna.
2. A aplicação apresenta qual personagem ou grupo deve agir.
3. O mestre registra que o Guarda-costas protegeu o jogador João.
4. O mestre registra que o vidente investigou o jogador Pedro.
5. Os Lobisomens escolhem uma vítima.
6. A aplicação processa todas as ações de acordo com as regras configuradas.
7. A aplicação apresenta ao mestre o resultado da noite, indicando mortes, proteções, investigações e demais acontecimentos relevantes.

O mestre deve conseguir conduzir a partida sem precisar fazer manualmente todas essas verificações e cálculos.

A aplicação deve ser uma ferramenta de apoio à tomada de decisão do mestre, não um substituto para ele.

---

## 2. Funcionalidades e experiência desejada

Quero que você considere as seguintes funcionalidades como objetivos do produto.

### 2.1. Configuração de partidas

O mestre deve conseguir:

- Criar uma nova partida.
- Informar os nomes dos participantes.
- Selecionar os personagens que estarão presentes.
- Definir a quantidade de jogadores.
- Configurar regras específicas da partida.
- Distribuir ou associar personagens aos jogadores.
- Visualizar a composição completa da partida.

### 2.2. Gerenciamento de personagens

A aplicação precisa conhecer os personagens e suas habilidades.

Cada personagem pode possuir características diferentes, como:

- Habilidades especiais.
- Ações noturnas.
- Restrições de utilização.
- Quantidade de utilizações disponíveis.
- Condições para ativação.
- Interações com outros personagens.
- Efeitos sobre outros jogadores.

Não quero que as regras fiquem espalhadas pelo código de maneira difícil de manter.

Precisamos avaliar uma arquitetura que permita adicionar novos personagens e modificar suas habilidades sem precisar reescrever grande parte da aplicação.

Considere também que podem existir diferentes versões e variações das regras do Lobisomem. Portanto, avalie a possibilidade de termos conjuntos de regras configuráveis.

### 2.3. Condução da partida

A aplicação deve acompanhar o andamento da partida.

Considere fases como:

- Preparação;
- Noite;
- Dia;
- Votação;
- Eliminação;
- Encerramento.

A interface deve orientar o mestre sobre o que precisa acontecer em cada momento.

Durante a noite, por exemplo, deve existir uma sequência de ações que respeite as regras da partida.

O mestre deve conseguir registrar as ações realizadas pelos personagens, visualizar as informações relevantes e avançar para a próxima etapa.

### 2.4. Processamento das ações noturnas

Esta é uma das funcionalidades mais importantes do produto.

Não quero apenas armazenar as escolhas dos jogadores. Quero que a aplicação consiga interpretar as ações registradas e calcular seus efeitos.

Precisamos considerar situações como:

- Um jogador ser atacado e protegido simultaneamente.
- Dois ou mais personagens interagirem com o mesmo jogador.
- Habilidades que anulam ou modificam outras habilidades.
- Personagens com imunidade ou proteção especial.
- Ações que dependem da ordem de execução.
- Ações que só produzem efeitos no início ou no final da noite.
- Personagens que podem morrer em decorrência de outros acontecimentos.
- Habilidades que possuem condições específicas de utilização.

A arquitetura deve permitir que essas regras sejam processadas de maneira previsível, testável e consistente.

O resultado precisa ser explicado ao mestre, para que ele entenda por que determinado acontecimento ocorreu.

### 2.5. Histórico da partida

Avalie a possibilidade de registrar um histórico de acontecimentos.

O mestre deve conseguir consultar o que aconteceu nas noites anteriores, quais ações foram realizadas, quais jogadores foram eliminados e como a partida evoluiu.

Também é interessante avaliar a possibilidade de desfazer ou corrigir uma ação registrada incorretamente, sem comprometer a consistência do estado da partida.

### 2.6. Interface e experiência de uso

A aplicação será utilizada durante uma partida presencial, enquanto o mestre conduz o jogo.

Portanto, a interface precisa ser extremamente prática.

Considere:

- Interface responsiva para desktop, tablet e celular.
- Experiência otimizada para utilização pelo celular.
- Poucos cliques para registrar uma ação.
- Botões e elementos de interação adequados para uso rápido.
- Boa legibilidade em ambientes com pouca iluminação.
- Interface intuitiva, sem exigir que o mestre tenha conhecimentos técnicos.
- Feedback visual claro sobre ações registradas e etapas concluídas.
- Prevenção de erros durante o registro das ações.

Avalie se faz sentido desenvolver uma PWA (Progressive Web App), permitindo uma experiência próxima à de um aplicativo instalado no celular.

Também avalie se precisamos oferecer algum funcionamento offline ou tolerância a quedas de conexão durante uma partida.

---

## 3. Requisitos arquiteturais e tecnológicos

Ainda não defini a stack tecnológica e quero que você me ajude a tomar essas decisões.

Não assuma que precisamos utilizar determinada tecnologia apenas porque ela é popular.

Quero avaliar as alternativas considerando simplicidade, custo, produtividade, manutenção e possibilidade de evolução.

### 3.1. Estrutura dos repositórios

Precisamos decidir entre:

- Monorepo, mantendo frontend e backend no mesmo repositório.
- Repositórios separados, com frontend e backend independentes.
- Uma terceira alternativa que você considere mais adequada.

Apresente os prós e contras de cada abordagem considerando o tamanho inicial do projeto, a equipe (inicialmente apenas eu), o fluxo de desenvolvimento e a possibilidade de crescimento futuro.

### 3.2. Frontend

Avalie tecnologias adequadas para desenvolver uma aplicação web responsiva e com boa experiência em dispositivos móveis.

Considere produtividade, ecossistema, facilidade de manutenção e possibilidade de evolução.

### 3.3. Backend

Precisamos avaliar se realmente existe necessidade de um backend independente desde o início.

Considere a possibilidade de:

- Uma aplicação frontend com processamento local.
- Um backend com API.
- Uma arquitetura full-stack.
- Uma solução intermediária.

Leve em consideração que o processamento das regras do jogo pode se tornar relativamente complexo.

### 3.4. Banco de dados e persistência

Não tenho certeza se precisaremos de banco de dados no MVP.

Quero que você avalie:

- Se podemos começar sem backend e sem banco de dados.
- Se faz sentido utilizar armazenamento local no navegador.
- Se precisamos de persistência no servidor.
- Se é importante permitir que uma partida seja salva e retomada posteriormente.
- Se precisaremos de contas de usuário e autenticação.
- Quais seriam as consequências de cada escolha para uma futura evolução.

Não adicione infraestrutura desnecessária.

### 3.5. Infraestrutura e hospedagem

Este é um projeto pessoal, financiado inicialmente por mim.

Minha prioridade é manter os custos operacionais próximos de zero ou o mais baixos possível.

Entretanto, não quero tomar decisões que dificultem uma futura expansão.

Avalie opções de hospedagem, banco de dados, serviços gerenciados e infraestrutura, priorizando soluções gratuitas ou de baixo custo para o MVP.

Explique também quais custos poderão aparecer com o crescimento da aplicação.

### 3.6. Escalabilidade e manutenção

Não precisamos começar com uma arquitetura distribuída, microsserviços ou qualquer solução complexa.

Quero começar simples, mas com boas separações de responsabilidades e código organizado.

A arquitetura deve permitir evoluir o projeto sem exigir uma reescrita completa.

Considere boas práticas de:

- Separação de responsabilidades.
- Modularização.
- Testabilidade.
- Tipagem e validação de dados.
- Tratamento de erros.
- Documentação.
- Versionamento de APIs, caso aplicável.
- Segurança e privacidade.

---

## 4. Como quero que você conduza o planejamento

Quero que você trabalhe de maneira consultiva, questionando minhas ideias quando identificar oportunidades de melhoria.

Não quero que simplesmente escolha as tecnologias mais populares ou monte uma arquitetura excessivamente sofisticada.

Para cada decisão técnica relevante:

1. Apresente as alternativas viáveis.
2. Explique os prós e contras.
3. Considere o impacto no MVP e no crescimento futuro.
4. Apresente sua recomendação.
5. Justifique por que essa recomendação é a mais adequada para este projeto.

Quando faltar alguma informação importante sobre o funcionamento do jogo, faça perguntas antes de assumir regras.

Não invente regras para personagens. Precisamos distinguir o que já está definido sobre o produto daquilo que ainda precisa ser decidido.

Evite fazer dezenas de perguntas de uma só vez. Conduza o levantamento de requisitos progressivamente, priorizando as decisões que realmente impactam a arquitetura.

---

## 5. Entregáveis esperados desta etapa

Quero que, ao final do planejamento, tenhamos:

1. **Documento de visão do produto:** objetivo, público-alvo, problemas resolvidos e principais funcionalidades.
2. **Escopo do MVP:** funcionalidades indispensáveis para lançar a primeira versão e funcionalidades que ficarão para versões futuras.
3. **Definição arquitetural:** desenho da arquitetura proposta e justificativa das principais decisões.
4. **Stack tecnológica:** tecnologias recomendadas para frontend, backend, persistência, testes e infraestrutura.
5. **Estrutura de repositórios:** definição de monorepo ou repositórios separados e organização de diretórios.
6. **Modelo de domínio:** principais entidades e relacionamentos, especialmente partidas, jogadores, personagens, habilidades, ações e acontecimentos.
7. **Estratégia de processamento das regras:** proposta de como representar, executar e testar as interações entre habilidades.
8. **Estratégia de testes:** testes unitários, integração e cenários de regras do jogo.
9. **Plano de infraestrutura:** como executar localmente, publicar e manter a aplicação com baixo custo.
10. **Roadmap de desenvolvimento:** etapas ordenadas, dependências entre tarefas e critérios de conclusão.
11. **Documentação inicial:** proposta de organização dos documentos técnicos e atualização do README.md.

Se possível, utilize diagramas para explicar a arquitetura, os principais fluxos e o modelo de domínio.

---

## 6. Diretrizes importantes

- Priorize simplicidade e pragmatismo.
- Não implemente funcionalidades antes de termos definido o escopo.
- Não introduza dependências sem uma justificativa clara.
- Evite overengineering.
- Pense na experiência do mestre durante uma partida real.
- Mantenha as regras do jogo desacopladas da interface.
- Considere a possibilidade de adicionar novos personagens e conjuntos de regras.
- Priorize uma aplicação segura, confiável e fácil de manter.
- Considere que inicialmente o desenvolvimento será realizado por uma única pessoa.

**Resultado esperado:** quero sair desta etapa com uma visão clara do produto, decisões arquiteturais justificadas e um plano de implementação organizado, pronto para ser executado em etapas.

Comece analisando o repositório atual e, em seguida, conduza a etapa de descoberta e planejamento. Não comece a implementar a aplicação sem minha aprovação explícita do plano.