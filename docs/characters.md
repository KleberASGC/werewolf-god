# Catálogo de personagens

Este documento reúne as definições dos personagens (papéis) do jogo e serve
como ponto de partida para propor novos. As fichas atuais resumem o conjunto
aprovado em [ruleset-v1.md](./rules/ruleset-v1.md); em caso de divergência, o
conjunto de regras aprovado é a referência para o comportamento implementado.

Este catálogo é documentação, não uma configuração carregada pelo aplicativo.
Adicionar ou alterar uma ficha não muda o jogo automaticamente: depois de
definir as regras, peça a implementação para atualizar o conjunto aprovado,
o motor, a interface e os testes necessários.
O campo **Texto impresso na carta** registra a descrição exata exibida no
componente `ROLE_SUMMARIES` do catálogo do aplicativo.

## Personagens atuais

### Lobisomem

- **Identificador:** `werewolf`
- **Facção:** Lobisomens
- **Texto impresso na carta:** Todas as noites, acorde junto com os outros
  Lobisomens e escolha um jogador para eliminar.
- **Ação:** os Lobisomens vivos agem em grupo e escolhem por consenso um alvo
  durante a noite.
- **Alvos válidos:** outro jogador vivo e não exilado que não seja Lobisomem.
  O grupo não pode escolher um dos seus próprios membros.
- **Obrigatoriedade e usos:** a ação é obrigatória quando há Lobisomens vivos
  e pode ser realizada a cada noite.
- **Efeito:** o alvo é eliminado, a menos que esteja protegido pelo
  Guarda-costas ou pela Bruxa.
- **Informação:** os Lobisomens reconhecem os outros membros da facção.
- **Vitória:** Lobisomens vivos em número igual ou maior que o dos demais
  jogadores vivos.
- **Estado no aplicativo:** implementado.

### Guarda-costas

- **Identificador:** `bodyguard`
- **Facção:** Aldeões
- **Texto impresso na carta:** Todas as noites, escolha um jogador que não
  possa ser eliminado naquela noite.
- **Ação:** os Guarda-costas vivos escolhem em grupo uma pessoa para proteger
  durante a noite.
- **Alvos válidos:** qualquer jogador vivo e não exilado, inclusive um
  Guarda-costas. Se houver várias cópias, no máximo um integrante do grupo
  pode ser escolhido.
- **Restrições:** não pode proteger o mesmo alvo em noites consecutivas.
- **Obrigatoriedade e usos:** a ação é obrigatória quando há Guarda-costas
  vivos e pode ser realizada a cada noite.
- **Efeito:** impede eliminações noturnas dos Lobisomens ou da Bruxa; não
  impede exílio por votação.
- **Informação:** não recebe informação especial sobre o alvo.
- **Vitória:** condição de vitória dos Aldeões.
- **Estado no aplicativo:** implementado.


### Bruxa

- **Identificador:** `witch`
- **Facção:** Aldeões
- **Texto impresso na carta:** Você pode optar por salvar e/ou eliminar um
  jogador à noite, uma única vez por jogo.
- **Ação:** as Bruxas vivas decidem em grupo se usam os poderes disponíveis:
  proteção, eliminação, ambos ou nenhum.
- **Alvos da proteção:** qualquer jogador vivo e não exilado, inclusive no
  máximo uma Bruxa do grupo.
- **Alvos da eliminação:** qualquer jogador vivo e não exilado que não seja
  Bruxa. Se usar os dois poderes na mesma noite, os alvos devem ser diferentes.
- **Usos:** o grupo compartilha um uso de proteção e um uso de eliminação para
  toda a partida. Cada uso escolhido é consumido mesmo que o efeito seja
  redundante ou bloqueado.
- **Efeito:** a proteção impede ataques noturnos dos Lobisomens ou da Bruxa;
  a eliminação mata o alvo, a menos que esteja protegido.
- **Obrigatoriedade:** o uso dos poderes é opcional.
- **Informação:** não recebe informação especial sobre os alvos.
- **Vitória:** condição de vitória dos Aldeões.
- **Estado no aplicativo:** implementado.

### Vidente

- **Identificador:** `seer`
- **Facção:** Aldeões
- **Texto impresso na carta:** Todas as noites, escolha um jogador para
  descobrir se ele é um Aldeão ou um Lobisomem.
- **Ação:** as Videntes vivas escolhem em grupo uma pessoa para investigar a
  cada noite.
- **Alvos válidos:** outro jogador vivo e não exilado que não seja Vidente.
  Se houver várias cópias, o grupo não pode investigar um dos seus próprios
  integrantes.
- **Obrigatoriedade e usos:** a ação é obrigatória quando há Videntes vivas e
  pode ser realizada a cada noite.
- **Informação recebida:** somente se o alvo é ou não Lobisomem; o papel exato
  não é revelado. O resultado é apresentado imediatamente ao mestre e não pode
  ser corrigido.
- **Efeito:** não elimina nem protege jogadores.
- **Vitória:** condição de vitória dos Aldeões.
- **Estado no aplicativo:** implementado.

### Aldeão

- **Identificador:** `villager`
- **Facção:** Aldeões
- **Texto impresso na carta:** Encontre os Lobisomens e elimine-os.
- **Ação:** nenhuma ação noturna.
- **Participação:** participa da discussão e vota enquanto estiver vivo e não
  exilado.
- **Informação:** não recebe informação especial.
- **Vitória:** os Aldeões vencem quando todos os Lobisomens são eliminados.
- **Estado no aplicativo:** implementado.

### Lycan

- **Identificador estável:** `lycan`
- **Nome exibido:** Lycan
- **Texto impresso na carta:** Você é um Aldeão, mas, aos olhos do Vidente,
  parece ser um Lobisomem.
- **Facção e condição de vitória:** Aldeões
- **Quantidade permitida na partida:** sem limite individual adicional; vale o total de cartas e jogadores.
- **Fase e ordem de ação:** nenhuma ação noturna.
- **Participação:** discute e vota como os demais jogadores vivos.
- **Informação recebida pela Vidente:** aparece como Lobisomem; o papel exato não é revelado.
- **Outras interações ou efeitos:** nenhum efeito noturno; a condição de vitória é a dos Aldeões.
- **Informação recebida pelo personagem:** não recebe informação especial.
- **Estado no aplicativo:** implementado.

### Amaldiçoado

- **Identificador estável:** `cursed`
- **Nome exibido:** Amaldiçoado
- **Texto impresso na carta:** Você faz parte da Facção dos Aldeões, a menos
  que seja alvo de eliminação pelos Lobisomens; nesse caso, você se torna um
  Lobisomem.
- **Facção e condição de vitória:** começa no time dos Aldeões. Se a conversão ficar pendente, permanece Aldeão até ser despertado discretamente com os Lobisomens na noite seguinte; só então passa ao time dos Lobisomens e conta para a condição de vitória dessa facção. Se todos os outros Lobisomens forem eliminados enquanto a conversão estiver pendente, a partida continua e ele será o único Lobisomem ao despertar.
- **Quantidade permitida:** no máximo um Amaldiçoado por partida.
- **Ação e momento:** não escolhe alvo nem tem ação noturna. Se a conversão ficar pendente, o mestre o desperta discretamente antes da chamada dos Lobisomens na noite seguinte; só então ele se torna Lobisomem e passa a agir com o grupo.
- **Conversão:** se for alvo do ataque dos Lobisomens, não estiver protegido e não for também alvo da Bruxa na mesma noite, permanece vivo como Aldeão e fica com conversão pendente. A conversão só se efetiva quando o mestre o desperta na noite seguinte.
- **Proteção e ataques simultâneos:** proteção do Guarda-costas ou da Bruxa bloqueia os ataques e impede que a conversão fique pendente. Se a Bruxa também o atacar e não houver proteção, ele morre normalmente sem conversão. Se for alvo apenas de outro efeito de eliminação ou de exílio, é eliminado normalmente.
- **Vidente:** aparece como não Lobisomem na noite do ataque e enquanto a conversão estiver pendente. Depois de ser despertado pelo mestre com os Lobisomens, aparece como Lobisomem.
- **Informação recebida pelo personagem:** antes de ser despertado para a conversão, não sabe que foi escolhido nem que sua conversão está pendente. O mestre o acorda discretamente antes do grupo e o informa pela própria inclusão no chamado dos Lobisomens.
- **Informação mostrada ao mestre e ao grupo:** somente o mestre sabe da conversão pendente durante o dia e antes do despertar. O personagem e o grupo não são informados antes desse momento. O aplicativo atualiza o papel na escalação privada quando o mestre confirma o despertar.
- **Cenários de exemplo:** ataque dos Lobisomens sem proteção nem ataque da Bruxa deixa conversão pendente sem eliminar; na noite seguinte, o mestre o desperta discretamente antes da chamada do grupo e a partir daí ele é Lobisomem; se todos os demais Lobisomens forem eliminados ou exilados antes disso, a partida continua até o despertar, quando ele será o único Lobisomem; ataque simultâneo da Bruxa sem proteção elimina sem conversão; proteção impede a conversão pendente; investigação retorna “não é Lobisomem” até o despertar.
- **Estado no aplicativo:** implementado.

### Conjurador

- **Identificador estável:** `spellcaster`
- **Nome exibido:** Conjurador
- **Texto impresso na carta:** Todas as noites, escolha um jogador que não
  poderá falar no dia seguinte.
- **Facção e condição de vitória:** Aldeões
- **Quantidade permitida na partida:** sem limite individual adicional; vale o total de cartas e jogadores.
- **Ação:** os Conjuradores vivos escolhem em consenso um jogador por noite.
- **Ordem:** depois do Denunciador, que age depois da Vidente.
- **Obrigatoriedade:** obrigatória quando há ao menos um Conjurador vivo.
- **Alvos válidos:** qualquer jogador vivo, inclusive o próprio Conjurador e integrantes do grupo.
- **Limite de usos:** não se aplica
- **Condições e restrições:** não pode silenciar a mesma pessoa por dois dias consecutivos.
- **Efeito:** o alvo não pode falar desde o amanhecer até o fim da votação do dia seguinte. Continua votando, indicando o voto sem falar.
- **Interações com outros personagens/efeitos:** não se aplica
- **Informação recebida pelo personagem:** não se aplica
- **Sinalização:** depois de registrar a escolha, o mestre se aproxima sem fazer barulho e toca no ombro do alvo. O sinal de silenciamento é explicado previamente a todos, mas o mestre não revela publicamente quem foi escolhido.
- **Se o personagem for eliminado:** a chamada da função continua. Se não houver Conjuradores vivos, não há escolha nem efeito.
- **Decisões pendentes:** nenhuma.
- **Estado no aplicativo:** implementado.

### Denunciador

- **Identificador estável:** `revealer`
- **Nome exibido:** Denunciador
- **Texto impresso na carta:** Todas as noites, você pode optar por denunciar
  um jogador. Se esse jogador for um Lobisomem, ele é eliminado. Se não for,
  você é eliminado.
- **Facção e condição de vitória:** Aldeões
- **Quantidade permitida na partida:** no máximo um.
- **Tipo de ação:** individual.
- **Fase e ordem de ação:** age à noite, depois da Vidente e antes do Conjurador.
- **Ação:** pode denunciar uma pessoa viva, diferente de si, a cada noite.
- **Obrigatoriedade:** opcional enquanto estiver vivo e não exilado; não há limite de usos.
- **Alvos válidos:** qualquer outro jogador vivo e não exilado. O Lycan conta como não-Lobisomem para esta ação.
- **Efeito:** se o alvo for Lobisomem, ele é eliminado, a menos que esteja protegido. Se não for Lobisomem, o Denunciador é eliminado, a menos que esteja protegido. A proteção do alvo não impede a eliminação do Denunciador.
- **Interações com outros personagens/efeitos:** as proteções do Guarda-costas ou da Bruxa bloqueiam a eliminação da pessoa protegida, tanto quando o Denunciador acerta o Lobisomem quanto quando denuncia alguém que não é Lobisomem.
- **Informação recebida pelo personagem:** nenhuma informação especial; recebe o mesmo resultado do amanhecer que os demais.
- **Se o personagem for eliminado:** a chamada continua; sem Denunciador vivo não há escolha nem efeito.
- **Decisões pendentes:** nenhuma.
- **Estado no aplicativo:** implementado.

### Cupido

- **Identificador estável:** `cupid`
- **Nome exibido:** Cupido
- **Texto impresso na carta:** Na primeira noite, escolha dois jogadores para ficarem conectados. Se um deles for eliminado, o outro também será eliminado.
- **Facção e condição de vitória:** Aldeões; vence com o time dos Aldeões.
- **Quantidade permitida na partida:** no máximo um.
- **Tipo de ação:** individual, uma única vez.
- **Fase e ordem de ação:** escolha obrigatória na primeira noite, depois do Conjurador. O Cupido não é chamado nas noites seguintes.
- **Alvos válidos:** duas pessoas vivas e diferentes; o Cupido pode ser um dos alvos.
- **Efeito:** se uma das pessoas conectadas for eliminada à noite ou exilada por votação, a outra também será eliminada.
- **Proteções:** se uma ação noturna contra uma pessoa conectada for bloqueada por proteção, o alvo sobrevive e essa ação não elimina ninguém do par. Se o alvo morrer e o par estiver protegido, o alvo morre e o par sobrevive. Proteções não impedem a eliminação do par por exílio.
- **Interação com o Amaldiçoado:** se ele for alvo direto dos Lobisomens e sobreviver, a conversão fica pendente até ser despertado na noite seguinte. Se o vínculo o eliminar antes desse despertar — na mesma noite ou depois, inclusive após o exílio do par — a conversão pendente é cancelada.
- **Informação recebida pelo personagem:** o Cupido conhece o par que escolheu. O mestre também conhece o par; os jogadores conectados não são informados.
- **Se o personagem for eliminado:** a escolha já registrada continua válida.
- **Decisões pendentes:** nenhuma.
- **Estado no aplicativo:** implementado.

### Quenga

- **Identificador estável:** `hooker`
- **Nome exibido:** Quenga
- **Texto impresso na carta:** Todas as noites, você pode optar por dormir com um jogador. Se esse jogador for um lobisomem, você é eliminada. Se não for: e os lobisomens tentarem te atacar então ninguém morre porque você não estava em casa; se os lobisomens atacarem o jogador que você optou por dormir, morrem vocês dois.
- **Facção e condição de vitória:** Aldeões; vence quando todos os Lobisomens forem eliminados, conforme a condição de vitória dos Aldeões.
- **Quantidade permitida na partida:** no máximo 1.
- **Tipo de ação:** individual.
- **Fase e ordem de ação:** escolhe durante a noite, depois do Conjurador e antes da resolução conjunta das ações noturnas. A ordem das chamadas não altera a resolução.
- **Ação:** pode escolher outro jogador vivo e não exilado para dormir com ele, ou optar por não escolher ninguém.
- **Obrigatoriedade:** opcional, a cada noite em que estiver viva e não exilada.
- **Alvos válidos:** qualquer outro jogador vivo e não exilado, inclusive um Lobisomem ou o Amaldiçoado.
- **Pode escolher a si mesma ou alguém do próprio grupo?:** não se aplica escolha de grupo; não pode escolher a si mesma.
- **Limite de usos:** uma escolha por noite; não há limite por partida.
- **Condições e restrições:** a escolha não é pública. Se não escolher ninguém, permanece em casa. A proteção aplicável pode impedir sua eliminação, mas não protege automaticamente a pessoa com quem dormiu.
- **Efeito:**
  - Se não escolher ninguém, uma eliminação que a tenha como alvo a elimina normalmente, a menos que esteja protegida contra aquela fonte.
  - Se escolher um Lobisomem, ela é eliminada, a menos que esteja protegida naquela noite. Essa escolha não elimina o Lobisomem.
  - Se escolher alguém que não seja Lobisomem, um ataque dos Lobisomens contra a Quenga não elimina ninguém: ela estava fora de casa e o ataque não é transferido para a pessoa escolhida.
  - Se os Lobisomens atacarem a pessoa não-Lobisomem escolhida, a pessoa e a Quenga são alvos de eliminação. Cada uma pode ser protegida independentemente: quem não estiver protegida morre; quem estiver protegida sobrevive.
  - Se a pessoa escolhida for o Amaldiçoado ainda não convertido e os Lobisomens a atacarem, o Amaldiçoado sobrevive e fica com a conversão pendente conforme a regra do Amaldiçoado; a Quenga também é eliminada, a menos que esteja protegida.
- **Interações com outros personagens/efeitos:** somente o ataque dos Lobisomens contra a pessoa não-Lobisomem escolhida causa o efeito conjunto. Outras ações de eliminação contra essa pessoa afetam apenas o alvo escolhido. Se outra ação de eliminação tiver a Quenga como alvo, ela é resolvida normalmente contra ela, sujeita às proteções e demais regras dessa ação. Exílio por votação não é afetado por estar fora de casa.
- **Informação recebida pelo personagem:** nenhuma informação especial.
- **Informação mostrada ao mestre e ao grupo:** a escolha e seus efeitos são privados para o mestre; o grupo não recebe informação sobre com quem ela dormiu. O mestre anuncia ao amanhecer somente as eliminações, conforme a regra geral.
- **Se o personagem for eliminado:** a chamada continua; sem Quenga viva não há escolha nem efeito.
- **Cenários de exemplo:**
  1. Sem escolher ninguém, a Quenga desprotegida é eliminada se qualquer ação de eliminação a tiver como alvo.
  2. Escolhe um Lobisomem: a Quenga desprotegida morre; se protegida, sobrevive. O Lobisomem não é eliminado por essa escolha.
  3. Escolhe um Aldeão e os Lobisomens atacam a Quenga: ninguém morre pelo ataque, inclusive a pessoa escolhida.
  4. Escolhe João, um Aldeão. Se os Lobisomens atacarem João, sem proteção ambos morrem; se João estiver protegido, só a Quenga desprotegida morre; se a Quenga estiver protegida, João desprotegido morre e ela sobrevive; se ambos estiverem protegidos, ambos sobrevivem.
  5. Escolhe João, mas a Bruxa ou o Denunciador usa uma ação de eliminação contra ele: somente João é afetado pela ação, conforme suas regras; não há morte conjunta da Quenga.
  6. Escolhe o Amaldiçoado ainda não convertido e os Lobisomens o atacam sem proteção: o Amaldiçoado sobrevive com conversão pendente e a Quenga desprotegida morre.
- **Decisões pendentes:** nenhuma sobre os efeitos descritos nesta ficha.
- **Estado no aplicativo:** implementado.

### Mentalista

- **Identificador estável:** `mentalist`
- **Nome exibido:** Mentalista
- **Texto impresso na carta:** A cada noite, você pode apontar para dois jogadores e descobrir se esses jogadores estão ou não na mesma equipe.
- **Facção e condição de vitória:** Aldeões
- **Quantidade permitida na partida:** 1
- **Tipo de ação:** individual
- **Ação:** Aponta para dois jogadores e descobre se eles fazem parte do mesmo time ou não.
- **Obrigatoriedade:** Precisa apontar para dois todas as noites.
- **Alvos válidos:** Excluindo a si mesmo, pode apontar para quaisquer dois jogadores vivos e não-exilados.
- **Pode escolher a si mesmo ou alguém do próprio grupo?:** não pode escolher a si mesmo; pode apontar para qualquer outro jogador vivo, inclusive alguém da própria facção dos Aldeões.
- **Limite de usos:** 1x por noite, ilimitado enquanto estiver vivo.
- **Fase e ordem de ação:** ação individual obrigatória todas as noites, depois da Quenga.
- **Condições e restrições:** os dois alvos devem ser vivos, não exilados e diferentes; nenhum deles pode ser o Mentalista.
- **Efeito:** o resultado compara a facção atual dos dois alvos e é informado imediatamente ao Mentalista pelo mestre. Os jogadores permanecem vivos e nenhum outro efeito é aplicado pela ação.
- **Interações com outros personagens/efeitos:** o Amaldiçoado deve se comportar para o Mentalista da mesma forma que se comporta para o vidente.
- **Informação recebida pelo personagem:** Se os dois jogadores apontados pertencem ao mesmo time (facção) ou não.
- **Se o personagem for eliminado:** a chamada continua; sem Mentalista vivo não há escolha nem efeito.
- **Decisões pendentes:** nenhuma.
- **Estado no aplicativo:** implementado.

### Padre

- **Identificador estável:** `priest`
- **Nome exibido:** Padre
- **Texto impresso na carta:** uma vez por partida, escolha um jogador para ser protegido. Esse jogador não pode ser eliminado durante a noite.
- **Facção e condição de vitória:** Aldeões
- **Quantidade permitida na partida:** 1
- **Tipo de ação:** individual
- **Ação:** Pode optar por proteger um jogador em uma única noite na partida.
- **Obrigatoriedade:** Opcional
- **Alvos válidos:** Qualquer jogador vivo e não exilado
- **Pode escolher a si mesmo ou alguém do próprio grupo?:** sim
- **Limite de usos:** 1 vez por partida.
- **Efeito:** Protege soberanamente um jogador contra todas as eliminações noturnas daquela noite. O alvo não morre por qualquer ação noturna enquanto estiver protegido.
- **Interações com outros personagens/efeitos:** igual à proteção soberana do Guarda-costas. A proteção impede eliminações dos Lobisomens, da Bruxa, do Denunciador, da Quenga e do vínculo do Cupido. Não impede exílio por votação.
- **Informação recebida pelo personagem:** nenhuma
- **Se o personagem for eliminado:** a chamada continua; sem Padre vivo ou após o poder já ter sido usado não há escolha nem efeito.
- **Decisões pendentes:** nenhuma.
- **Estado no aplicativo:** implementado.

### Depressivo

- **Identificador estável:** `tanner`
- **Nome exibido:** Depressivo
- **Texto impresso na carta:** Você odeia seu trabalho e sua vida
- **Facção e condição de vitória:** facção independente, joga sozinho e vence somente quando é exilado por votação. Se essa condição ocorrer na mesma resolução que uma vitória de equipe, a vitória do Depressivo prevalece. Caso contrário, a primeira condição de vitória atendida encerra a partida.
- **Quantidade permitida na partida:** no máximo 1.
- **Ação e chamada noturna:** nenhuma ação; não é chamado pelo moderador à noite.
- **Participação:** discute e vota enquanto estiver vivo e não exilado.
- **Interações com as vitórias das equipes:** sua presença não bloqueia as condições de vitória dos Aldeões ou dos Lobisomens. Para a paridade dos Lobisomens, conta como não-Lobisomem vivo. Se morrer à noite ou for eliminado indiretamente pelo vínculo do Cupido, não vence.
- **Informação recebida pelo personagem:** nenhuma informação especial.
- **Decisões pendentes:** nenhuma.
- **Estado no aplicativo:** implementado.