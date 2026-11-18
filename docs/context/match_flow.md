# Fluxo de uma partida com o Assistente do Moderador

## 1. Objetivo

A aplicação funciona como um assistente do moderador de uma partida
presencial de Lobisomem. Os jogadores permanecem fisicamente reunidos em
círculo, enquanto o moderador utiliza a aplicação em seu próprio
dispositivo para conduzir as fases, registrar ações e votos, acompanhar
os resultados e verificar as condições de vitória.

O dispositivo fica exclusivamente com o moderador durante toda a
partida. Os jogadores não interagem diretamente com a aplicação.

A aplicação deve orientar o moderador passo a passo, indicando quem deve
acordar, qual ação deve realizar e quando deve voltar a dormir. Também
deve processar as ações registradas e apresentar os resultados de cada
rodada.

## 2. Exemplo de composição da partida

Para ilustrar o fluxo, considere uma partida com cinco jogadores e um
moderador:

  Participante   Função
  -------------- ---------------
  Jogador 1      Lobisomem
  Jogador 2      Guarda-costas
  Jogador 3      Bruxa
  Jogador 4      Vidente
  Jogador 5      Aldeão

Essa composição é apenas um exemplo. Antes de iniciar a partida, o
moderador escolhe quais funções estarão presentes e quantos exemplares
de cada função serão utilizados.

A aplicação deve permitir que o moderador configure a composição da
partida de acordo com a quantidade de participantes e as regras
escolhidas.

> **Importante:** este documento descreve o fluxo de condução da
> partida. As regras específicas de cada personagem --- como limites de
> uso, alvos permitidos, efeitos, prioridades e interações --- já
> estão definidas em [initial-rules-draft.md](/docs/rules/initial-rules-draft.md).

## 3. Preparação da partida

Antes da primeira rodada, o moderador:

1.  Reúne os participantes e define quem participará como jogador.
2.  Decide quais funções farão parte da partida e a quantidade de cada
    uma.
3.  Abre a aplicação e cria uma nova partida.
4.  Informa os nomes dos jogadores.
5.  Seleciona as funções que estarão presentes na partida.
6.  Associa cada função a um jogador, conforme sorteio feito pela aplicação.
7.  Entrega a carta física da função para cada respectivo jogador.
8.  Configura o tempo destinado à discussão durante o dia.
9.  Confere a composição e inicia a partida.

A aplicação deve validar a configuração e deixar claro ao moderador se
existe alguma inconsistência, de acordo com o conjunto de regras
selecionado.

Depois da preparação, a partida começa pela fase da noite.

## 4. Ciclo da partida

A partida acontece em ciclos que alternam entre:

1.  **Noite:** o moderador chama, em sequência, as funções que possuem
    ações noturnas e registra as escolhas feitas.
2.  **Amanhecer:** a aplicação processa as ações da noite e informa ao
    moderador o resultado.
3.  **Discussão:** os jogadores discutem presencialmente durante o tempo
    configurado.
4.  **Votação:** o moderador registra individualmente o voto de cada
    jogador, seguindo a ordem apresentada pela aplicação.
5.  **Resultado da votação:** a aplicação calcula quem foi eliminado ou
    informa que não houve eliminação.
6.  **Verificação de vitória:** a aplicação verifica se alguma condição
    de vitória foi alcançada.
7.  **Próxima noite:** se a partida continuar, inicia-se um novo ciclo
    noturno.

O ciclo se repete até que uma condição de encerramento seja atingida.

## 5. Fase da noite

### 5.1. Início da noite

Ao iniciar a noite, a aplicação apresenta ao moderador uma orientação
para que todos os jogadores fechem os olhos.

Em seguida, exibe a primeira função que deve agir, conforme a sequência
noturna definida pelas regras da partida.

A interface deve apresentar instruções curtas e claras, por exemplo:

**"Acordem os lobisomens."**

O moderador lê a instrução em voz alta e conduz a ação presencialmente.

### 5.2. Chamada de cada função

Para cada função com ação noturna, a aplicação deve seguir um fluxo
semelhante:

1.  Exibir qual função deve acordar (com o nome dos jogadores).
2.  Orientar o moderador a chamar essa função.
3.  Apresentar os jogadores que podem ser escolhidos como alvo,
    respeitando as regras daquela função.
4.  Permitir que o moderador registre a escolha feita pelo jogador ou
    grupo.
5.  Confirmar visualmente que a ação foi registrada.
6.  Permitir que o moderador avance para a próxima etapa.
7.  Orientar o moderador a pedir que a função volte a dormir.

O moderador é o intermediário de todas as ações. Os jogadores apontam ou
comunicam suas escolhas presencialmente, e o moderador as registra na
aplicação.

### 5.3. Exemplo: ação dos lobisomens

A aplicação apresenta:

**"Acordem os lobisomens."**

O moderador pede que os lobisomens abram os olhos e se reconheçam. Em
seguida, eles escolhem em consenso uma pessoa para atacar.

A aplicação deve apresentar ao moderador a lista de alvos permitidos. No
exemplo descrito, os lobisomens podem escolher entre os jogadores que
não são lobisomens.

O moderador seleciona o jogador escolhido e registra o ataque.

Depois, avança para a próxima etapa. A aplicação orienta:

**"Peça aos lobisomens que fechem os olhos e voltem a dormir."**

### 5.4. Exemplo: ação do guarda-costas

A aplicação apresenta:

**"Acorde o guarda-costas."**

O moderador pede que o guarda-costas abra os olhos. O jogador aponta
para a pessoa que deseja proteger.

O moderador seleciona essa pessoa na aplicação e registra a proteção.

Depois, avança e pede que o guarda-costas volte a dormir.

### 5.5. Demais funções

O mesmo mecanismo deve ser utilizado para as outras funções que possuam
ações noturnas.

Por exemplo:

-   A bruxa pode ser chamada para realizar suas ações, conforme as
    regras configuradas.
-   O vidente pode ser chamado para escolher alguém e receber do
    moderador a informação correspondente apresentada pela aplicação.
-   Outras funções poderão ser adicionadas futuramente, cada uma com
    suas próprias instruções, opções de alvo, restrições e efeitos.

A aplicação não deve obrigar o moderador a chamar funções que não
estejam presentes na partida ou que não possuam ação naquela etapa.

### 5.6. Sequência e conclusão da noite

A sequência das chamadas deve ser determinada pelo conjunto de regras da
partida.

A aplicação deve manter o controle de quais funções já foram chamadas,
quais ações foram registradas e quais etapas ainda estão pendentes.

Quando todas as ações noturnas previstas forem concluídas, a aplicação
informa ao moderador que a noite terminou e orienta:

**"Todos podem acordar. Amanheceu."**

## 6. Processamento e resultado da noite

Depois que todas as ações noturnas forem registradas, a aplicação deve
processá-las em conjunto, considerando as regras e interações entre as
funções.

O resultado não deve depender simplesmente da ordem em que o moderador
preencheu os registros. A aplicação precisa aplicar as regras de
resolução definidas para a partida.

Por exemplo, deve ser capaz de considerar situações como:

-   Um jogador escolhido pelos lobisomens também ter sido protegido.
-   Um jogador receber mais de uma proteção.
-   Uma habilidade impedir ou modificar o efeito de outra.
-   Uma ação causar efeitos adicionais ou mortes.
-   Não ocorrer nenhuma morte durante a noite.

Ao final do processamento, a aplicação apresenta ao moderador:

-   Quais jogadores morreram durante a noite.
-   Se houve jogadores atacados que sobreviveram por causa de proteção
    ou outro efeito.
-   Outros acontecimentos relevantes para a condução da partida.
-   Se a noite terminou sem mortes.
-   Se alguma condição de vitória foi alcançada.

A aplicação deve separar as informações privadas do moderador daquilo
que será anunciado aos jogadores. O moderador decide como comunicar o
resultado, utilizando a narrativa sugerida pela aplicação.

### 6.1. Narração do amanhecer

Além dos dados objetivos, a aplicação pode gerar um texto narrativo para
o moderador ler em voz alta, com uma ambientação de RPG.

Exemplos:

**Quando houver mortes:**

> "O sol começa a surgir no horizonte. A noite foi sangrenta. Os
> moradores se reúnem e percebem que \[nome do jogador\] não sobreviveu
> à noite."

**Quando não houver mortes:**

> "O sol começa a surgir no horizonte. Após uma noite tensa, todos se
> reúnem e percebem que, desta vez, ninguém foi encontrado morto. A vila
> teve uma noite tranquila."

Os textos são exemplos ilustrativos. A aplicação pode adaptar a narração
à quantidade de mortes e aos acontecimentos, sem revelar informações
secretas que os jogadores ainda não deveriam conhecer.

## 7. Fase do dia: discussão

Depois de apresentar o resultado da noite, a aplicação permite que o
moderador inicie a discussão.

A duração da discussão deve ser definida na preparação da partida.

Ao clicar em **"Iniciar discussão"**, um cronômetro começa a contar o
tempo configurado.

Durante esse período:

-   Os jogadores discutem presencialmente.
-   O moderador acompanha o tempo pela aplicação.
-   A aplicação apresenta o tempo restante de forma bem visível.
-   O moderador pode encerrar a discussão manualmente caso os jogadores
    já tenham chegado a uma decisão.

Quando o tempo chegar ao fim ou o moderador encerrar a discussão, a
aplicação permite iniciar a votação.

## 8. Fase de votação

A votação é conduzida exclusivamente pelo moderador, que continua sendo
a única pessoa com acesso ao dispositivo.

Os jogadores não precisam tocar no celular nem visualizar a interface.

### 8.1. Ordem de votação

Ao iniciar a votação, a aplicação define uma ordem de participação e
apresenta individualmente quem deve votar.

A ordem pode ser sorteada pela aplicação, conforme a regra escolhida
para a partida.

Exemplo de instrução na tela:

**"É a vez de João votar."**

O moderador anuncia em voz alta que é a vez de João e pergunta em quem
ele deseja votar.

### 8.2. Registro do voto

A aplicação apresenta ao moderador as opções de voto permitidas,
considerando os jogadores elegíveis naquele momento.

O moderador seleciona o alvo indicado pelo jogador e confirma o voto.

Depois do registro:

1.  A aplicação confirma que o voto foi computado.
2.  O moderador avança para o próximo participante.
3.  A aplicação apresenta o nome do próximo jogador que deverá votar.

Esse processo se repete até que todos os jogadores elegíveis tenham
votado.

### 8.3. Privacidade dos votos

Os votos devem ser registrados de maneira privada.

Somente o moderador visualiza a seleção de cada participante durante a
votação. A aplicação não deve exibir publicamente os votos individuais
aos jogadores.

A interface deve evitar que um jogador veja acidentalmente a escolha do
participante anterior.

### 8.4. Apuração da votação

Depois que todos os votos forem registrados, a aplicação calcula o
resultado conforme as regras configuradas.

A tela de resultado deve informar ao moderador:

-   A quantidade de votos recebidos por cada jogador.
-   Quem recebeu a maior quantidade de votos.
-   Se houve empate.
-   Se a votação foi anulada ou não resultou em eliminação.
-   Quem foi eliminado, caso exista um resultado válido.

As regras para empate, abstenções, votos inválidos e anulação precisam
ser configuráveis ou definidas pelo conjunto de regras da partida.

A aplicação apresenta o resultado ao moderador, que anuncia a decisão
aos jogadores.

## 9. Verificação das condições de vitória

A aplicação deve verificar as condições de vitória em momentos
relevantes da partida:

1.  Após o processamento do resultado da noite.
2.  Após a resolução da votação e de seus efeitos, incluindo uma
    eventual eliminação.

Caso alguma condição de vitória seja alcançada, a aplicação deve
interromper o fluxo normal e apresentar uma tela de encerramento.

Essa tela deve informar ao moderador:

-   Que a partida terminou.
-   Qual grupo ou condição venceu.
-   Quais jogadores permaneceram vivos.
-   Um resumo do resultado final.

A aplicação também pode oferecer um texto narrativo para o moderador
anunciar o encerramento da partida.

As condições específicas de vitória devem fazer parte das regras
configuradas. Não devem ser fixadas exclusivamente com base no exemplo
de personagens deste documento.

Se nenhuma condição de vitória tiver sido atingida, a aplicação
apresenta a opção de iniciar a próxima noite.

## 10. Próxima rodada

Se a partida continuar:

1.  O moderador seleciona a opção para iniciar uma nova noite.
2.  A aplicação apresenta a instrução para todos fecharem os olhos.
3.  As funções noturnas ainda presentes e elegíveis são chamadas na
    sequência definida pelas regras.
4.  O moderador registra as ações.
5.  A aplicação processa os acontecimentos.
6.  O ciclo de amanhecer, discussão e votação se repete.

Jogadores eliminados não devem continuar participando de ações ou
votações, salvo quando alguma regra específica determinar o contrário.

A aplicação deve manter o estado atualizado da partida entre todas as
rodadas.

## 11. Requisitos de experiência e interface

A experiência deve ser pensada para o moderador utilizar a aplicação
enquanto conduz uma partida presencial.

Princípios importantes:

-   O celular ou computador fica sempre com o moderador.
-   Os jogadores não interagem diretamente com a aplicação.
-   A aplicação deve conduzir o moderador passo a passo.
-   Cada etapa deve ter uma instrução clara e uma ação principal, como
    "Próximo".
-   O registro de ações deve exigir poucos toques.
-   As opções de alvo devem mostrar apenas jogadores elegíveis.
-   A aplicação deve deixar claro quando uma ação foi registrada.
-   Deve ser possível revisar ou corrigir registros antes da resolução,
    respeitando as regras de consistência.
-   Informações secretas devem ser apresentadas apenas ao moderador.
-   O cronômetro da discussão deve ser fácil de visualizar e controlar.
-   A interface deve funcionar bem em celulares e desktops.

## 12. Estado que a aplicação precisa acompanhar

Para conduzir esse fluxo, a aplicação provavelmente precisará manter, no
mínimo, informações sobre:

-   Partida atual e conjunto de regras selecionado.
-   Jogadores participantes.
-   Função de cada jogador.
-   Estado de cada jogador (vivo, eliminado ou outro estado previsto
    pelas regras).
-   Fase atual da partida.
-   Rodada atual.
-   Sequência de ações noturnas.
-   Ações registradas na noite.
-   Efeitos e resultados processados.
-   Histórico de acontecimentos.
-   Tempo de discussão configurado e estado do cronômetro.
-   Ordem de votação.
-   Votos registrados.
-   Resultado da votação.
-   Condições de vitória e estado de encerramento.

Esse é um levantamento inicial de informações de domínio, não uma
imposição de modelo de banco de dados. A arquitetura deve definir a
melhor forma de representar e persistir esses dados.

## 13. Pontos que ainda precisam ser definidos

Este fluxo descreve a experiência geral desejada, mas existem decisões
de regras e produto que precisam ser esclarecidas antes da
implementação.

### Regras dos personagens

-   Quais personagens estarão disponíveis inicialmente?
-   Quais possuem ações noturnas?
-   Qual é a ordem exata de chamada?
-   Quais são os alvos permitidos para cada habilidade?
-   Como funcionam proteções, ataques, bloqueios, imunidades e efeitos
    simultâneos?
-   A bruxa possui quantas ações e em quais condições pode utilizá-las?
-   O vidente recebe qual tipo de informação ao investigar?

### Regras da votação

-   Jogadores eliminados votam?
-   O jogador pode votar em si mesmo?
-   Como funcionam empates?
-   Existe abstenção?
-   Em quais situações a votação é anulada?
-   A ordem dos votantes é sempre sorteada?

### Regras de vitória e eliminação

-   Quais são as condições de vitória de cada grupo?
-   Existem efeitos que acontecem imediatamente após uma eliminação?
-   Uma morte pode desencadear outra morte?
-   Quando exatamente a verificação de vitória deve ocorrer em relação
    aos efeitos posteriores à eliminação?

### Comportamento da aplicação

-   O moderador poderá voltar etapas e corrigir ações?
-   A partida precisa ser salva automaticamente?
-   Deve ser possível fechar a aplicação e retomar a partida?
-   A aplicação precisa funcionar offline?
-   O histórico deve armazenar todas as ações secretas ou apenas os
    resultados relevantes?

Esses pontos devem ser tratados como requisitos pendentes. O
desenvolvimento não deve assumir respostas sem validação.

------------------------------------------------------------------------

## 14. Resumo do fluxo principal

``` mermaid
flowchart TD
    A[Configurar partida] --> B[Selecionar jogadores e funções]
    B --> C[Configurar tempo de discussão]
    C --> D[Iniciar partida]
    D --> E[Iniciar noite]
    E --> F[Chamar funções noturnas]
    F --> G[Registrar ações]
    G --> H{Todas as ações foram concluídas?}
    H -->|Não| F
    H -->|Sim| I[Processar ações da noite]
    I --> J[Apresentar resultado do amanhecer]
    J --> K{Condição de vitória atingida?}
    K -->|Sim| Z[Encerrar partida]
    K -->|Não| L[Iniciar discussão]
    L --> M[Executar cronômetro]
    M --> N[Iniciar votação]
    N --> O[Sortear ordem e registrar votos]
    O --> P[Apurar votação]
    P --> Q[Aplicar eliminação e efeitos]
    Q --> R{Condição de vitória atingida?}
    R -->|Sim| Z
    R -->|Não| E
```

## 15. Diretriz final para o desenvolvimento

O produto deve ser concebido como um **assistente de condução de
partidas**, e não apenas como um cadastro de personagens ou um contador
de votos.

A aplicação precisa controlar o fluxo da partida, orientar o moderador,
registrar as decisões tomadas presencialmente, interpretar as regras e
apresentar resultados confiáveis.

A interface deve ser simples e rápida, enquanto a lógica de domínio deve
ser suficientemente organizada para suportar novos personagens,
habilidades, conjuntos de regras e variações do jogo.

Este documento representa a visão inicial do fluxo de uma partida e deve
servir como contexto de produto para o planejamento técnico e para as
decisões de arquitetura.
