# Conjunto de regras v1

> **Estado: aprovado para implementação.** As regras do Conjurador foram revisadas pelo responsável do projeto em 2026-11-18. Não preencher lacunas sobre papéis futuros ou comportamentos fora do escopo com regras de outras edições.

## 1. Identificação

- **Nome:** Conjunto inicial Werewolf God
- **Versão:** 1.2.0
- **Estado:** Aprovado
- **Papéis cobertos:** Lobisomens, Guarda-costas, Bruxa, Vidente, Lycan, Conjurador e Aldeão
- **Objetivo:** formalizar o conjunto mínimo de regras necessário para a primeira partida jogável.

A versão 1.1.0 acrescentou o Lycan e a versão 1.2.0 acrescenta o Conjurador
às composições de novas partidas. São alterações aditivas: partidas já salvas
mantêm seus papéis e comportamento, sem migração de dados. O identificador do
conjunto permanece `werewolf-god-v1`.

## 2. Preparação

- A partida tem de **5 a 75 jogadores**, inclusive.
- O mestre informa nomes e quantidade de cartas de cada papel disponível.
- O total de cartas deve ser igual ao número de jogadores.
- Deve haver ao menos um Lobisomem e menos Lobisomens do que jogadores não Lobisomens.
- O aplicativo sorteia uma carta por jogador e mostra a associação somente ao mestre, que entrega as cartas físicas.
- Não há limite individual adicional de cópias dos papéis descritos além do total de cartas e das restrições acima.
- Todos os papéis não Lobisomem descritos pertencem ao time dos Aldeões. Os Lobisomens formam o outro time.
- O Lycan pertence ao time dos Aldeões, não age à noite e aparece como Lobisomem somente no resultado da investigação da Vidente.
- O Conjurador pertence ao time dos Aldeões e age à noite depois da Vidente.

### Cópias da mesma função

- Todas as cópias de uma função formam um único grupo de ação.
- Quando a função é chamada, os participantes vivos daquele grupo decidem juntos uma ação e o mestre registra somente uma ação para o grupo.
- O aplicativo não arbitra divergência nem determina consenso; o mestre registra a escolha final apresentada pelo grupo.
- Se a função permite escolher a si própria, o grupo pode escolher no máximo um dos seus próprios participantes como alvo dessa ação. Se a função não permite escolher a si própria, nenhum participante do grupo pode ser alvo da ação do próprio grupo.
- Participantes eliminados antes da chamada não agem nem consomem usos. Se houver participantes vivos na função, o grupo vivo realiza a ação conjunta normalmente.
- Os Lobisomens também agem como grupo; para eles, já está definido que chegam a consenso por olhares e escolhem juntos uma vítima.

## 3. Fases e fluxo

1. **Preparação:** cadastrar jogadores, configurar cartas e duração do dia, validar e sortear os papéis.
2. **Noite:** o mestre orienta todos a fechar os olhos e chama, na ordem Lobisomens, Guarda-costas, Bruxa, Vidente e Conjurador, cada função que foi incluída na composição inicial e possui ação noturna.
3. **Amanhecer:** após as chamadas noturnas (incluindo a do Conjurador, se estiver na composição), resolver as ações em conjunto, apresentar o resultado privado ao mestre e verificar a vitória.
4. **Discussão:** se a partida continuar, abrir o dia e iniciar o temporizador configurado.
5. **Votação:** depois que o mestre encerrar a discussão, registrar um voto por jogador vivo e não exilado na ordem sorteada.
6. **Resultado:** apurar a votação, aplicar eventual exílio sem revelar o papel e verificar a vitória.
7. Se não houver vitória, o mestre pode iniciar a próxima noite.

Todas as funções incluídas na composição inicial que tenham ação noturna devem ser chamadas em todas as noites, mesmo que todos os seus participantes estejam mortos ou a Bruxa já não possua usos; isso evita revelar quais funções ainda têm jogadores vivos. Se houver participantes vivos no grupo, somente eles podem agir. Se todos estiverem mortos, a chamada é mantida, mas ninguém escolhe alvo, registra ação ou consome uso. Funções que não foram incluídas na composição e papéis sem ação noturna não são chamados. Jogadores eliminados antes da noite não escolhem alvos nem registram ações. Uma ação realizada antes de seu autor ser eliminado na mesma noite continua válida.

## 4. Papéis

| Função | Ação conjunta | Alvo e restrições | Efeito / informação |
|---|---|---|---|
| Lobisomens | Escolhem por consenso uma vítima. | Outro jogador vivo e não exilado que não seja Lobisomem. | Ataque noturno; a vítima é eliminada se não estiver protegida. |
| Guarda-costas | Escolhe uma pessoa para proteger a cada noite. | Qualquer jogador vivo e não exilado; pode escolher no máximo um dos próprios membros. Não pode repetir o alvo da noite anterior. | Protege de eliminações noturnas dos Lobisomens ou da Bruxa, mas não do exílio. |
| Bruxa | O grupo compartilha um uso de proteção e um uso de eliminação durante toda a partida; pode usar nenhum, um ou ambos. | Proteção: qualquer jogador vivo e não exilado, inclusive no máximo uma Bruxa do grupo. Eliminação: outro jogador vivo e não exilado, nunca uma Bruxa do grupo. Se usar ambas na mesma noite, os alvos devem ser diferentes. | Proteção bloqueia ataques noturnos dos Lobisomens ou da Bruxa. Eliminação causa morte se o alvo não estiver protegido. Cada uso escolhido é consumido mesmo quando redundante ou bloqueado. |
| Vidente | Escolhe uma pessoa para investigar por noite. | Outro jogador vivo e não exilado; não pode escolher uma Vidente do grupo. | Informa somente se o alvo é Lobisomem ou Lycan, sem revelar o papel exato. O mestre sinaliza “L” com a mão para Lobisomem ou Lycan, ou balança o indicador para “não é Lobisomem”. |
| Lycan | Nenhuma ação noturna. | — | Pertence ao time dos Aldeões e participa da discussão e votação como os demais jogadores vivos; para a Vidente, aparece como Lobisomem. |
| Conjurador | Os Conjuradores vivos escolhem em consenso uma pessoa por noite. | Qualquer jogador vivo, inclusive o próprio Conjurador e integrantes do grupo. Não pode repetir o alvo em dias consecutivos. | O alvo não pode falar do amanhecer até o fim da votação seguinte. Depois de registrar a escolha, o mestre se aproxima sem fazer barulho e toca no ombro do alvo; o alvo continua votando sem falar. |
| Aldeão | Nenhuma ação noturna. | — | Participa da discussão e vota enquanto estiver vivo e não exilado. |

As ações de Guarda-costas, Vidente e Conjurador são obrigatórias a cada chamada quando há participantes vivos da função e alvo válido. Os usos da Bruxa são opcionais, mesmo quando disponíveis.

## 5. Resolução noturna

- Todas as ações aceitas são resolvidas em conjunto; a ordem de chamada não muda seus efeitos.
- Uma proteção do Guarda-costas ou da Bruxa bloqueia qualquer ataque noturno dos Lobisomens ou da Bruxa contra o alvo protegido.
- Proteções simultâneas no mesmo alvo são redundantes, mas o uso de proteção da Bruxa continua consumido.
- Se Lobisomens e Bruxa atacarem o mesmo alvo sem proteção, esse jogador é eliminado uma única vez; se protegido, sobrevive aos ataques.
- A proteção não impede exílio diurno.
- A ação do Conjurador não altera a resolução de ataques, proteções ou investigações; o alvo é silenciado no dia seguinte, mesmo que sua própria ação noturna o elimine.
- Depois de registrar a ação do Conjurador, o aplicativo lembra o mestre de se aproximar sem fazer barulho e tocar no ombro do alvo. O mestre mantém a escolha privada e não permite que o alvo fale durante a discussão ou votação. O alvo continua elegível e deve votar sem falar.
- Ações válidas registradas antes de um agente morrer naquela noite ainda produzem efeito. O agente não pode realizar ações posteriores à eliminação.
- O mestre vê os alvos, ações e causas privadas. Ao amanhecer, anuncia somente quem foi eliminado ou que ninguém foi eliminado; não revela papéis, ações ou proteções.
- Se a partida terminar, o mestre anuncia o fim e o time vencedor.

## 6. Discussão e votação

- A duração do dia é configurada entre **1 e 10 minutos**.
- O mestre pode pausar o temporizador e encerrar a discussão antes do prazo.
- Ao zerar, o aplicativo avisa o mestre, mas não inicia a votação automaticamente.
- A cada votação, o aplicativo sorteia novamente a ordem de todos os jogadores vivos e não exilados.
- Cada votante deve votar em outro jogador vivo e não exilado ou escolher “anular”; não há abstenção e não é permitido votar em si mesmo.
- A pessoa silenciada pelo Conjurador continua votando e indica seu voto sem falar.
- Os votos são abertos; o aplicativo registra cada voto individual para o mestre.
- Se mais da metade dos votantes elegíveis escolher “anular”, a votação é anulada.
- Empate pelo maior número de votos anula a votação, inclusive empate entre “anular” e um jogador.
- Se “anular” for a opção mais votada sem maioria e sem empate no topo, ninguém é exilado; registrar como anulação sem maioria.
- Sem anulação por maioria nem empate no topo, se um jogador tiver mais votos que as demais opções, ele é exilado.
- Após exílio, o mestre informa que a pessoa saiu, sem revelar seu papel.

## 7. Vitória

- **Lobisomens vencem** quando o número de Lobisomens vivos é igual ou maior que o número de jogadores não Lobisomens vivos.
- **Aldeões vencem** quando todos os Lobisomens foram mortos ou exilados.
- Verificar vitória imediatamente após a resolução da noite e imediatamente após o exílio do dia.
- Se não houver vitória, a partida continua. Uma partida encerrada não prossegue para outra fase.

## 8. Revisão, histórico e persistência

- Antes de confirmar a resolução noturna, o mestre pode revisar e corrigir as ações registradas.
- Correções depois de uma noite ou votação concluída não fazem parte desta versão; o comportamento precisa ser definido antes de ser implementado.
- A aplicação salva e retoma a partida localmente no mesmo dispositivo. Não há conta, serviço remoto ou sincronização neste escopo.
- O alvo do Conjurador e o último alvo necessário para validar a repetição são persistidos nas partidas novas; campos ausentes em partidas e backups anteriores permanecem válidos e não recebem valores substitutos.

## 9. Cenários de aceitação

1. **Limites de participantes:** partidas com 4 ou 76 jogadores são recusadas; 5 e 75 podem prosseguir se a composição de cartas for válida.
2. **Composição inválida:** recusar soma de cartas diferente do total de jogadores, zero Lobisomens ou quantidade de Lobisomens igual/superior à de não Lobisomens.
3. **Sorteio e sigilo:** atribuir exatamente uma carta a cada jogador, manter a associação visível apenas ao mestre e não alterar a composição.
4. **Chamadas e ações em grupo:** todas as funções noturnas incluídas na composição são chamadas em todas as noites, inclusive quando não têm participantes vivos; funções ausentes e papéis sem ação não são chamados. Duas ou mais cópias vivas da mesma função geram uma única ação registrada; participantes eliminados não escolhem nem consomem usos.
5. **Alvo do próprio grupo:** Guarda-costas e proteção da Bruxa podem escolher no máximo um membro vivo do próprio grupo; eliminação da Bruxa e investigação da Vidente não podem escolher nenhum membro do próprio grupo.
6. **Proteção contra ataques:** alvo protegido sobrevive a ataque dos Lobisomens, da Bruxa ou de ambos; proteções redundantes não causam efeito extra.
7. **Ataques coincidentes:** dois ataques no mesmo alvo desprotegido produzem uma única eliminação.
8. **Bruxa com usos compartilhados:** em todo o grupo, há no máximo um uso de proteção e um de eliminação; cada uso pode ser usado independentemente, ambos na mesma noite contra pessoas diferentes, ou não ser usado.
9. **Uso da Bruxa bloqueado:** eliminar alvo protegido consome o uso de eliminação; proteger pessoa já protegida consome o uso de proteção.
10. **Guarda-costas:** deve escolher alvo elegível e não pode repetir o alvo da noite anterior; a proteção não evita exílio.
11. **Vidente:** investigar outro jogador vivo retorna apenas “Lobisomem” ou “não Lobisomem”, sem papel exato; Lobisomem e Lycan retornam “Lobisomem”.
12. **Ação antes da morte:** se um agente realizar ação válida e morrer na mesma noite, sua ação continua produzindo efeito.
13. **Amanhecer privado:** o resultado público lista apenas eliminados ou ausência de mortes, nunca as causas, papéis ou proteções.
14. **Temporizador:** aceitar de 1 a 10 minutos, permitir pausa e encerramento antecipado, avisar ao chegar a zero sem iniciar votação.
15. **Anulação por maioria:** com cinco votantes, três votos de anulação anulam a votação.
16. **Empate no topo:** empate entre jogadores ou entre jogador e “anular” anula a votação, mesmo sem maioria de anulações.
17. **Exílio:** sem empate no topo e com menos da metade dos votos anulados, exilar a pessoa com mais votos sem revelar seu papel.
18. **Vitória:** encerrar após resolução noturna ou exílio diurno quando uma das condições de vitória for satisfeita; não iniciar fase seguinte.
19. **Anulação sem maioria:** com quatro votantes, duas anulações e votos divididos entre dois jogadores, ninguém é exilado; registrar anulação sem maioria.
20. **Retomada local:** salvar a fase e o estado corrente e restaurá-los ao reabrir a aplicação no mesmo navegador.
21. **Lycan:** permitir sua inclusão na composição, não agendá-lo para uma ação noturna e informar “Lobisomem” quando a Vidente investigar um Lycan; sua facção e condição de vitória continuam sendo as dos Aldeões.
22. **Conjurador:** permitir uma ação coletiva obrigatória depois da Vidente; escolher qualquer jogador vivo, inclusive a si próprio ou alguém do grupo, mas não repetir o alvo em dias consecutivos. O alvo fica sem falar até o fim da votação, continua votando sem falar, e depois de registrar a ação o aplicativo lembra o mestre de se aproximar sem fazer barulho e tocar no ombro do alvo, sem revelar publicamente quem foi escolhido.
23. **Chamadas do Conjurador:** incluir a chamada em todas as noites quando houver ao menos uma cópia na composição, inclusive se todas estiverem eliminadas; sem Conjuradores vivos, não registrar ação nem escolher alvo.
24. **Partidas existentes:** carregar e restaurar partidas e backups anteriores sem Conjurador, mantendo seus papéis e comportamento sem migração.

Os cenários abaixo são os contratos de aceitação para a primeira versão do motor.

## 10. Pendências fora do motor v1

- Papéis futuros, equipes além de Lobisomens/Aldeões e suas interações.
- Correção ou desfazer depois de uma fase confirmada.
- Comportamento de múltiplas variantes de regras ou editor de conjunto de regras.
- Exportação/importação e sincronização online, fora do MVP inicial.

## 11. Aprovação

- Regras e cenários revisados pelo responsável: **Sim**
- Pendências bloqueadoras para o escopo v1: **Nenhuma conhecida**
- Aprovado para implementação: **Sim**
- Aprovador/data: **Responsável do projeto / 2026-11-18 (revisão 1.2.0)**
