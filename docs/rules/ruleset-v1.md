# Conjunto de regras v1

> **Estado: aprovado para implementação.** As regras do Conjurador (1.5.0), do Denunciador (1.6.0), do Cupido (1.7.0), da Quenga (1.8.0) e do Mentalista (1.9.0) foram aprovadas para implementação. Não preencher lacunas sobre papéis futuros ou comportamentos fora do escopo com regras de outras edições.

## 1. Identificação

- **Nome:** Conjunto inicial Werewolf God
- **Versão:** 1.9.0
- **Estado:** Aprovado
- **Papéis cobertos:** Lobisomens, Guarda-costas, Bruxa, Vidente, Denunciador, Lycan, Amaldiçoado, Conjurador, Cupido, Quenga, Mentalista e Aldeão
- **Objetivo:** formalizar o conjunto mínimo de regras necessário para a primeira partida jogável.

A versão 1.1.0 acrescentou o Lycan às composições de novas partidas. A versão
1.2.0 acrescentou o Amaldiçoado, limitado a uma carta por nova partida. A versão
1.3.0 definiu que a conversão do Amaldiçoado só se torna efetiva quando o mestre
o desperta discretamente com os Lobisomens na noite seguinte. A versão 1.4.0
esclarece que uma conversão pendente impede a vitória dos Aldeões quando todos
os outros Lobisomens forem eliminados ou exilados. A versão 1.5.0 acrescenta
o Conjurador às composições de novas partidas. A versão 1.6.0 acrescenta o
Denunciador, limitado a uma carta, com ação individual opcional depois da
Vidente e antes do Conjurador. Para essa ação, Lycan conta como não-Lobisomem,
pois pertence aos Aldeões; ser visto como Lobisomem pela Vidente não altera sua
facção. A versão 1.7.0 acrescenta o Cupido, limitado a uma carta, que escolhe
um par na primeira noite. O vínculo elimina o par quando uma das pessoas
conectadas morre ou é exilada, respeitando proteções noturnas. As alterações
são aditivas. A versão 1.8.0 acrescenta a Quenga, limitada a uma carta, com
ação individual opcional depois do Conjurador e do Cupido (quando chamado).
A versão 1.9.0 acrescenta o Mentalista, limitado a uma carta, com ação
individual obrigatória depois da Quenga.
Partidas e backups anteriores continuam válidos e mantêm seu estado e
comportamento, sem migração de dados. O identificador do conjunto permanece
`werewolf-god-v1`.

## 2. Preparação

- A partida tem de **5 a 75 jogadores**, inclusive.
- O mestre informa nomes e quantidade de cartas de cada papel disponível.
- O total de cartas deve ser igual ao número de jogadores.
- Deve haver ao menos um Lobisomem e menos Lobisomens do que jogadores não Lobisomens.
- O aplicativo sorteia uma carta por jogador e mostra a associação somente ao mestre, que entrega as cartas físicas.
- Não há limite individual adicional de cópias dos papéis descritos além do total de cartas e das restrições acima.
- Todos os papéis não Lobisomem começam no time dos Aldeões. Os Lobisomens formam o outro time; o Amaldiçoado pode mudar de time conforme a regra de conversão abaixo.
- O Lycan pertence ao time dos Aldeões, não age à noite e aparece como Lobisomem somente no resultado da investigação da Vidente.
- A composição pode incluir no máximo um Amaldiçoado. Ele começa no time dos Aldeões. Se os Lobisomens o atacarem sem proteção e a Bruxa não o atacar na mesma noite, sobrevive e a conversão fica pendente, conhecida somente pelo mestre. Na noite seguinte, antes da chamada dos Lobisomens, o mestre o desperta discretamente; somente nesse momento ele passa ao time dos Lobisomens e fica sabendo da conversão.
- O Conjurador pertence ao time dos Aldeões e age à noite depois do Denunciador, que age depois da Vidente.
- O Denunciador pertence ao time dos Aldeões, pode haver no máximo um por partida e sua ação individual e opcional ocorre depois da Vidente e antes do Conjurador.
- O Cupido pertence ao time dos Aldeões, pode haver no máximo um por partida e escolhe duas pessoas diferentes na primeira noite; o par pode incluir o próprio Cupido.
- A Quenga pertence ao time dos Aldeões e pode haver no máximo uma por partida. Sua escolha individual e opcional ocorre depois do Conjurador e do Cupido na primeira noite.
- O Mentalista pertence ao time dos Aldeões, pode haver no máximo um por partida e sua ação individual obrigatória ocorre todas as noites depois da Quenga.

### Cópias da mesma função

- Todas as cópias de uma função formam um único grupo de ação.
- Quando a função é chamada, os participantes vivos daquele grupo decidem juntos uma ação e o mestre registra somente uma ação para o grupo.
- O aplicativo não arbitra divergência nem determina consenso; o mestre registra a escolha final apresentada pelo grupo.
- Se a função permite escolher a si própria, o grupo pode escolher no máximo um dos seus próprios participantes como alvo dessa ação. Se a função não permite escolher a si própria, nenhum participante do grupo pode ser alvo da ação do próprio grupo.
- Participantes eliminados antes da chamada não agem nem consomem usos. Se houver participantes vivos na função, o grupo vivo realiza a ação conjunta normalmente.
- Os Lobisomens também agem como grupo; para eles, já está definido que chegam a consenso por olhares e escolhem juntos uma vítima.

## 3. Fases e fluxo

1. **Preparação:** cadastrar jogadores, configurar cartas e duração do dia, validar e sortear os papéis.
2. **Noite:** o mestre orienta todos a fechar os olhos e chama, na ordem Lobisomens, Guarda-costas, Bruxa, Vidente, Denunciador, Conjurador, Cupido, Quenga e Mentalista, cada função incluída na composição inicial que possui ação noturna; o Cupido só é chamado na primeira noite, e a Quenga e o Mentalista são chamados todas as noites.
3. **Amanhecer:** após as chamadas noturnas (incluindo as do Denunciador, Conjurador, Quenga e Mentalista, se estiverem na composição, e a do Cupido na primeira noite), resolver as ações em conjunto, apresentar o resultado privado ao mestre e verificar a vitória.
4. **Discussão:** se a partida continuar, abrir o dia e iniciar o temporizador configurado.
5. **Votação:** depois que o mestre encerrar a discussão, registrar um voto por jogador vivo e não exilado na ordem sorteada.
6. **Resultado:** apurar a votação, aplicar eventual exílio sem revelar o papel e verificar a vitória.
7. Se não houver vitória, o mestre pode iniciar a próxima noite.

Todas as funções incluídas na composição inicial que tenham ação noturna devem ser chamadas em todas as noites, mesmo que todos os seus participantes estejam mortos ou a Bruxa já não possua usos; isso evita revelar quais funções ainda têm jogadores vivos. A exceção é o Cupido, cuja chamada acontece somente na primeira noite. Se houver participantes vivos no grupo, somente eles podem agir. Se todos estiverem mortos, a chamada é mantida, mas ninguém escolhe alvo, registra ação ou consome uso. Funções que não foram incluídas na composição e papéis sem ação noturna não são chamados. Jogadores eliminados antes da noite não escolhem alvos nem registram ações. Uma ação realizada antes de seu autor ser eliminado na mesma noite continua válida.

## 4. Papéis

| Função | Ação | Alvo e restrições | Efeito / informação |
|---|---|---|---|
| Lobisomens | Escolhem por consenso uma vítima. | Outro jogador vivo e não exilado que não seja Lobisomem. | Ataque noturno; a vítima é eliminada se não estiver protegida. |
| Guarda-costas | Escolhe uma pessoa para proteger a cada noite. | Qualquer jogador vivo e não exilado; pode escolher no máximo um dos próprios membros. Não pode repetir o alvo da noite anterior. | Protege de eliminações noturnas dos Lobisomens ou da Bruxa, mas não do exílio. |
| Bruxa | O grupo compartilha um uso de proteção e um uso de eliminação durante toda a partida; pode usar nenhum, um ou ambos. | Proteção: qualquer jogador vivo e não exilado, inclusive no máximo uma Bruxa do grupo. Eliminação: outro jogador vivo e não exilado, nunca uma Bruxa do grupo. Se usar ambas na mesma noite, os alvos devem ser diferentes. | Proteção bloqueia ataques noturnos dos Lobisomens ou da Bruxa. Eliminação causa morte se o alvo não estiver protegido. Cada uso escolhido é consumido mesmo quando redundante ou bloqueado. |
| Vidente | Escolhe uma pessoa para investigar por noite. | Outro jogador vivo e não exilado; não pode escolher uma Vidente do grupo. | Informa somente se o alvo é Lobisomem ou Lycan, sem revelar o papel exato. O mestre sinaliza “L” com a mão para Lobisomem ou Lycan, ou balança o indicador para “não é Lobisomem”. |
| Lycan | Nenhuma ação noturna. | — | Pertence ao time dos Aldeões e participa da discussão e votação como os demais jogadores vivos; para a Vidente, aparece como Lobisomem. |
| Amaldiçoado | Nenhuma ação noturna; depois de uma conversão pendente, o mestre o desperta discretamente antes da chamada dos Lobisomens na noite seguinte. | No máximo um por partida. A conversão fica pendente se for alvo do ataque dos Lobisomens sem proteção e sem ataque simultâneo da Bruxa; só se efetiva quando o mestre o desperta na noite seguinte. | Começa Aldeão. Até ser despertado, permanece no time dos Aldeões e somente o mestre sabe da conversão pendente. Ao ser despertado, passa ao time dos Lobisomens e fica sabendo; a partir daí, a Vidente o vê como Lobisomem. |
| Denunciador | A pessoa viva escolhe se denuncia alguém a cada noite. | Qualquer outro jogador vivo e não exilado; no máximo uma cópia por partida. Lycan conta como não-Lobisomem. | Se o alvo for Lobisomem, ele é eliminado se não estiver protegido; caso contrário, o Denunciador é eliminado se não estiver protegido. |
| Conjurador | Os Conjuradores vivos escolhem em consenso uma pessoa por noite. | Qualquer jogador vivo, inclusive o próprio Conjurador e integrantes do grupo. Não pode repetir o alvo em dias consecutivos. | O alvo não pode falar do amanhecer até o fim da votação seguinte. Depois de registrar a escolha, o mestre se aproxima sem fazer barulho e toca no ombro do alvo; o alvo continua votando sem falar. |
| Cupido | Escolhe um par na primeira noite; não é chamado nas noites seguintes. | Duas pessoas vivas e diferentes; pode incluir o próprio Cupido. No máximo uma cópia por partida. | Se uma das pessoas conectadas for eliminada à noite ou exilada por votação, a outra também é eliminada. Proteções noturnas bloqueiam a eliminação do alvo e, se o par for protegido, ele sobrevive enquanto o alvo não protegido morre. Somente o mestre e o Cupido conhecem o par. |
| Quenga | A Quenga escolhe individualmente com quem dormir ou opta por não escolher ninguém. | Outro jogador vivo e não exilado, inclusive Lobisomem ou Amaldiçoado. No máximo uma Quenga por partida. | Se escolher um Lobisomem, a Quenga morre, a menos que esteja protegida; o Lobisomem não é eliminado. Se escolher alguém não-Lobisomem, evita o ataque dos Lobisomens quando é o alvo; se o ataque atingir a pessoa escolhida, ambas são alvos de eliminação, cada uma sujeita à própria proteção. Outras ações contra a pessoa escolhida não afetam a Quenga. |
| Mentalista | A cada noite, compara a facção atual de dois jogadores. | Dois jogadores vivos e não exilados, diferentes entre si e diferentes do próprio Mentalista. No máximo um por partida. | Informa ao Mentalista apenas se os dois pertencem ou não ao mesmo time. Não elimina, protege ou altera nenhuma outra ação. |
| Aldeão | Nenhuma ação noturna. | — | Participa da discussão e vota enquanto estiver vivo e não exilado. |

As ações de Guarda-costas, Vidente, Conjurador, Cupido e Mentalista são obrigatórias a cada chamada quando há participantes vivos da função e alvo válido. Os usos da Bruxa, do Denunciador e da Quenga são opcionais, mesmo quando disponíveis.

## 5. Resolução noturna

- Todas as ações aceitas são resolvidas em conjunto; a ordem de chamada não muda seus efeitos.
- Uma proteção do Guarda-costas ou da Bruxa bloqueia eliminações noturnas causadas pelos Lobisomens, pela Bruxa ou pelo Denunciador contra a pessoa protegida.
- Proteções simultâneas no mesmo alvo são redundantes, mas o uso de proteção da Bruxa continua consumido.
- Se Lobisomens e Bruxa atacarem o mesmo alvo sem proteção, esse jogador é eliminado uma única vez; se protegido, sobrevive aos ataques.
- Se Lobisomens atacarem o Amaldiçoado sem proteção e a Bruxa não o atacar nessa noite, ele permanece vivo como Aldeão e a conversão fica pendente. O estado pendente não é mostrado ao personagem nem ao grupo; somente o mestre tem essa informação.
- Na noite seguinte, antes de chamar os Lobisomens, o mestre o desperta discretamente. A conversão passa a valer e ele se junta ao grupo dos Lobisomens nesse momento. Se a Bruxa também o atacou na noite inicial sem proteção, ele morre normalmente e não há conversão pendente. Proteção de qualquer origem bloqueia os ataques e impede a conversão.
- A Vidente o vê como não Lobisomem na noite do ataque inicial e também enquanto a conversão estiver pendente. Depois que o mestre o desperta com os Lobisomens, ele aparece como Lobisomem para investigações posteriores. A conversão só é registrada como efetiva na noite do despertar.
- A proteção não impede exílio diurno.
- A ação do Conjurador não altera a resolução de ataques, proteções ou investigações; o alvo é silenciado no dia seguinte, mesmo que sua própria ação noturna o elimine.
- Se o Denunciador escolher um Lobisomem, esse Lobisomem é eliminado se não estiver protegido. Se escolher qualquer outro papel, inclusive Lycan, o próprio Denunciador é eliminado se não estiver protegido; a proteção do alvo denunciado não o salva. Ações e proteções são resolvidas em conjunto, então uma proteção ao Denunciador pode impedir essa eliminação mesmo que ele tenha denunciado alguém incorretamente.
- O par escolhido pelo Cupido é persistente e privado. O Cupido conhece sua escolha; os dois jogadores conectados não são informados.
- Se uma eliminação noturna contra uma pessoa conectada for bloqueada por proteção, o alvo sobrevive e essa ação não elimina ninguém do par. Se uma pessoa conectada morrer sem proteção, o vínculo elimina a outra, salvo se ela também estiver protegida; nesse caso, somente a primeira morre. O vínculo também elimina a pessoa conectada quando a outra é exilada por votação, pois proteções não impedem exílio.
- O Amaldiçoado só fica com conversão pendente quando é alvo direto dos Lobisomens e sobrevive. Se o vínculo o eliminar antes do despertar — na mesma noite ou depois, inclusive após o exílio do par — a conversão pendente é cancelada.
- A escolha da Quenga não-Lobisomem a leva para fora de casa durante a noite. Nesse caso, um ataque dos Lobisomens contra ela não elimina ninguém, nem é transferido para a pessoa escolhida; outras ações de eliminação contra ela continuam sendo resolvidas normalmente.
- Se a Quenga escolher um Lobisomem, ela é eliminada, a menos que esteja protegida. A escolha não elimina nem altera o alvo escolhido.
- Se os Lobisomens atacarem a pessoa não-Lobisomem com quem a Quenga escolheu dormir, tanto essa pessoa quanto a Quenga são alvos de eliminação. Cada uma pode ser protegida independentemente; proteger uma não protege a outra.
- A morte conjunta da Quenga só ocorre quando os Lobisomens atacam a pessoa escolhida. Bruxa, Denunciador e outras ações contra essa pessoa não transferem seus efeitos para a Quenga. Se outra ação tiver a própria Quenga como alvo, aplica-se normalmente a regra dessa ação e a proteção pertinente.
- Se a pessoa escolhida for o Amaldiçoado não convertido e os Lobisomens a atacarem, o Amaldiçoado sobrevive com conversão pendente segundo a regra do Amaldiçoado; a Quenga também é eliminada, salvo se estiver protegida. Se o vínculo do Cupido eliminar o Amaldiçoado antes do despertar, a conversão pendente é cancelada.
- O Mentalista compara a facção atual dos dois alvos. O Lycan conta como Aldeão; o Amaldiçoado conta como Aldeão enquanto a conversão estiver pendente e passa a contar como Lobisomem somente depois de despertado.
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
- Um Amaldiçoado com conversão pendente continua contando como Aldeão. Só conta como Lobisomem depois que o mestre o desperta discretamente com o grupo.
- Se não houver nenhum Lobisomem vivo, mas houver um Amaldiçoado vivo com conversão pendente, os Aldeões ainda não vencem: a partida continua até o despertar discreto no início da próxima noite. Nesse momento o Amaldiçoado torna-se o único Lobisomem, salvo se a partida já tiver terminado por outra condição.
- Verificar vitória imediatamente após a resolução da noite e imediatamente após o exílio do dia.
- Se não houver vitória, a partida continua. Uma partida encerrada não prossegue para outra fase.

## 8. Revisão, histórico e persistência

- Antes de confirmar a resolução noturna, o mestre pode revisar e corrigir as ações registradas.
- Correções depois de uma noite ou votação concluída não fazem parte desta versão; o comportamento precisa ser definido antes de ser implementado.
- A aplicação salva e retoma a partida localmente no mesmo dispositivo. Não há conta, serviço remoto ou sincronização neste escopo.
- O alvo do Conjurador e o último alvo necessário para validar a repetição são persistidos nas partidas novas; campos ausentes em partidas e backups anteriores permanecem válidos e não recebem valores substitutos.
- A ação do Denunciador é armazenada no histórico noturno existente. Partidas e backups anteriores continuam válidos, sem migração ou valores substitutos.
- O par do Cupido é salvo no estado privado da partida, e sua escolha fica no histórico noturno. Partidas e backups anteriores sem esse campo continuam válidos, sem migração ou valores substitutos.
- A escolha da Quenga é armazenada no histórico noturno existente. A chamada opcional não exige ação registrada quando ela opta por ficar em casa. Partidas e backups anteriores continuam válidos; não há alteração do formato de dados.
- A comparação do Mentalista é armazenada no histórico noturno existente. As partidas e backups anteriores continuam válidos sem migração ou valores substitutos.

## 9. Cenários de aceitação

1. **Limites de participantes:** partidas com 4 ou 76 jogadores são recusadas; 5 e 75 podem prosseguir se a composição de cartas for válida.
2. **Composição inválida:** recusar soma de cartas diferente do total de jogadores, zero Lobisomens ou quantidade de Lobisomens igual/superior à de não Lobisomens.
3. **Sorteio e sigilo:** atribuir exatamente uma carta a cada jogador, manter a associação visível apenas ao mestre e não alterar a composição.
4. **Chamadas e ações em grupo:** todas as funções noturnas incluídas na composição são chamadas em todas as noites, inclusive quando não têm participantes vivos, exceto o Cupido, chamado somente na primeira noite; funções ausentes e papéis sem ação não são chamados. Duas ou mais cópias vivas da mesma função geram uma única ação registrada; participantes eliminados não escolhem nem consomem usos.
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
18. **Mentalista:** deve escolher dois jogadores vivos, diferentes entre si e dele próprio; informa somente se estão no mesmo time. Lycan conta como Aldeão; Amaldiçoado conta como Aldeão até ser despertado e Lobisomem depois.
18. **Vitória:** encerrar após resolução noturna ou exílio diurno quando uma das condições de vitória for satisfeita; não iniciar fase seguinte.
19. **Anulação sem maioria:** com quatro votantes, duas anulações e votos divididos entre dois jogadores, ninguém é exilado; registrar anulação sem maioria.
20. **Retomada local:** salvar a fase e o estado corrente e restaurá-los ao reabrir a aplicação no mesmo navegador.
21. **Lycan:** permitir sua inclusão na composição, não agendá-lo para uma ação noturna e informar “Lobisomem” quando a Vidente investigar um Lycan; sua facção e condição de vitória continuam sendo as dos Aldeões.
22. **Amaldiçoado:** limitar a uma carta na composição; iniciar como Aldeão; após ataque desprotegido dos Lobisomens, manter conversão pendente e secreta até o mestre despertá-lo discretamente na noite seguinte antes da chamada do grupo; contar como Aldeão e aparecer como não Lobisomem para a Vidente até esse despertar; passar então ao time dos Lobisomens e aparecer como Lobisomem nas investigações posteriores; preservar estado e histórico em salvamentos e backups.
23. **Último Lobisomem e Amaldiçoado pendente:** se todos os Lobisomens restantes forem eliminados ou exilados, não declarar vitória dos Aldeões enquanto o Amaldiçoado com conversão pendente estiver vivo; continuar até despertá-lo discretamente, tornando-o o único Lobisomem.
24. **Conjurador:** permitir uma ação coletiva obrigatória depois da chamada do Denunciador (e, portanto, depois da Vidente); escolher qualquer jogador vivo, inclusive a si próprio ou alguém do grupo, mas não repetir o alvo em dias consecutivos. O alvo fica sem falar até o fim da votação, continua votando sem falar, e depois de registrar a ação o aplicativo lembra o mestre de se aproximar sem fazer barulho e tocar no ombro do alvo, sem revelar publicamente quem foi escolhido.
25. **Chamadas do Conjurador:** incluir a chamada em todas as noites quando houver ao menos uma cópia na composição, inclusive se todas estiverem eliminadas; sem Conjuradores vivos, não registrar ação nem escolher alvo.
26. **Partidas existentes:** carregar e restaurar partidas e backups anteriores sem Conjurador, mantendo seus papéis e comportamento sem migração.
27. **Denunciador na composição:** permitir no máximo uma carta, distribuí-la como Aldeão e agendar sua chamada depois da Vidente e antes do Conjurador em todas as noites da partida; sem Denunciador vivo, manter a chamada sem ação.
28. **Denúncia opcional e alvos:** permitir que o Denunciador vivo não use o poder; quando usado, aceitar qualquer outro jogador vivo e não exilado, nunca a si próprio. Um Lycan é não-Lobisomem para a denúncia.
29. **Resultado e proteção da denúncia:** denúncia de Lobisomem elimina o alvo, salvo se protegido; denúncia de não-Lobisomem elimina o Denunciador, salvo se protegido. A proteção do alvo não impede a eliminação do Denunciador; eliminar o Denunciador não cancela uma ação já registrada nem revela publicamente papéis ou causas.
30. **Compatibilidade do Denunciador:** salvar, retomar, exportar e importar ações do Denunciador; continuar carregando partidas e backups anteriores sem Denunciador sem migração.
31. **Cupido na composição:** permitir no máximo uma carta, distribuí-la como Aldeão e chamar o Cupido somente na primeira noite; a escolha obrigatória conecta duas pessoas vivas e diferentes, podendo incluir o próprio Cupido.
32. **Sigilo e persistência do vínculo:** somente o mestre e o Cupido conhecem o par, os jogadores conectados não são informados e a conexão continua válida nas noites seguintes; salvar, retomar, exportar e importar o par e a ação.
33. **Eliminação pelo vínculo:** eliminação noturna desprotegida ou exílio de uma pessoa conectada também elimina a outra; proteção contra eliminação noturna salva o alvo do vínculo sem salvar quem não está protegido.
34. **Amaldiçoado conectado:** se o Amaldiçoado for o par de alguém eliminado enquanto sua conversão estiver pendente — na mesma noite do ataque ou depois, inclusive após exílio do par — o vínculo o elimina e cancela a conversão; sem eliminação do par, permanece Aldeão pendente até ser despertado na noite seguinte.
35. **Partidas existentes:** carregar e restaurar partidas e backups anteriores sem Cupido, mantendo seus papéis e comportamento sem migração.
36. **Quenga na composição:** permitir no máximo uma Quenga, distribuí-la como Aldeã e chamá-la depois do Conjurador e do Cupido na primeira noite e depois do Conjurador nas noites seguintes; manter a chamada sem ação se estiver eliminada.
37. **Escolha opcional e alvos da Quenga:** permitir que escolha qualquer outro jogador vivo e não exilado, inclusive Lobisomem ou Amaldiçoado, ou opte por não escolher ninguém. Recusar a própria Quenga e alvos mortos ou exilados.
38. **Fora de casa:** sem alvo não-Lobisomem escolhido, um ataque dos Lobisomens contra a Quenga desprotegida a elimina. Se ela escolheu alguém não-Lobisomem, o ataque dos Lobisomens contra ela não elimina ninguém; outros efeitos de eliminação contra ela continuam normais.
39. **Escolha de Lobisomem:** se a Quenga escolher um Lobisomem, ela morre sem proteção e sobrevive protegida; a escolha não elimina o Lobisomem.
40. **Ataque ao companheiro:** se os Lobisomens atacarem a pessoa não-Lobisomem escolhida, a Quenga e a pessoa escolhida são eliminadas se desprotegidas. Proteção em uma não protege a outra; testar ambas protegidas, apenas uma protegida e nenhuma protegida.
41. **Outras eliminações no companheiro:** ações da Bruxa ou do Denunciador contra a pessoa escolhida afetam somente essa pessoa; não causam morte conjunta. Se a Quenga for alvo direto de outra ação, ela é resolvida pelas regras normais dessa ação.
42. **Amaldiçoado como companheiro:** se a Quenga escolher o Amaldiçoado não convertido e os Lobisomens o atacarem desprotegido, ele sobrevive com conversão pendente e a Quenga desprotegida morre; se o vínculo do Cupido eliminar o Amaldiçoado antes do despertar, a conversão é cancelada.
43. **Ação e histórico:** permitir revisar ou remover a escolha opcional antes de confirmar a noite e preservar escolhas registradas no histórico de partida, retomada e backup, sem invalidar partidas ou backups anteriores.

Os cenários abaixo são os contratos de aceitação do motor.

## 10. Pendências fora do motor v1

- Papéis futuros, equipes além de Lobisomens/Aldeões e suas interações.
- Correção ou desfazer depois de uma fase confirmada.
- Comportamento de múltiplas variantes de regras ou editor de conjunto de regras.
- Exportação/importação e sincronização online, fora do MVP inicial.

## 11. Aprovação

- Regras e cenários revisados pelo responsável: **Sim**
- Pendências bloqueadoras para o escopo v1: **Nenhuma conhecida**
- Aprovado para implementação: **Sim**
- Aprovador/data: **Responsável do projeto / 2026-11-21 (revisão 1.8.0)**
