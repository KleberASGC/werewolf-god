# Planejamento de infraestrutura, hospedagem e deploy — Assistente de Lobisomem

## 1. Contexto

Nosso projeto já possui um MVP funcional e implementado neste repositório.

A aplicação foi desenvolvida, testada e executada localmente com sucesso. Neste momento, quero avançar para a próxima etapa: disponibilizar a aplicação na internet, permitindo que outras pessoas possam acessá-la e utilizá-la.

Sua missão é atuar como **Arquiteto de Infraestrutura, Engenheiro DevOps e consultor de Cloud Computing**, analisando o projeto existente e propondo a melhor estratégia de hospedagem, publicação e manutenção.

Não quero escolher uma plataforma por popularidade ou simplesmente utilizar a primeira opção gratuita que encontrar.

Quero uma recomendação fundamentada nas características reais da nossa aplicação.

## 2. Objetivo principal

Quero colocar a aplicação em produção gastando o mínimo possível.

Este é inicialmente um projeto pessoal, financiado por mim. Não temos uma base significativa de usuários nem uma demanda elevada de processamento.

Portanto, minha prioridade é:

1. Minimizar os custos mensais de infraestrutura.
2. Preferir planos gratuitos ou serviços de baixo custo, desde que sejam adequados.
3. Evitar administrar servidores e infraestrutura desnecessariamente.
4. Ter uma aplicação estável e disponível para utilização.
5. Manter uma arquitetura que permita escalar futuramente.
6. Evitar custos inesperados e serviços que possam gerar cobranças difíceis de controlar.

Não quero implementar uma infraestrutura preparada para milhares de usuários se ainda teremos poucos usuários.

Por outro lado, não quero uma solução tão limitada que precise ser substituída imediatamente quando o projeto começar a crescer.

## 3. Primeira etapa: análise técnica do projeto existente

Antes de recomendar qualquer plataforma, faça uma análise do repositório atual.

Não assuma que a arquitetura do projeto é a mesma de exemplos anteriores ou que determinadas tecnologias estão sendo utilizadas.

Inspecione os arquivos existentes e identifique:

### Aplicação
- Tecnologias utilizadas no frontend.
- Tecnologias utilizadas no backend, caso exista.
- Frameworks e versões.
- Gerenciadores de pacotes.
- Ferramentas de build.
- Estrutura dos módulos e diretórios.

### Persistência e dados
- Qual banco de dados está sendo utilizado, se houver.
- Como a aplicação persiste informações.
- Se existe necessidade de armazenamento de arquivos.
- Se existem dados que precisam sobreviver a reinicializações ou novos deploys.

### Configuração e execução
- Como executar a aplicação localmente.
- Como realizar o build de produção.
- Quais variáveis de ambiente são necessárias.
- Quais portas e serviços são utilizados.
- Se frontend e backend são publicados separadamente.
- Se existem dependências externas.

### Outros requisitos
- Necessidade de autenticação.
- Necessidade de HTTPS.
- Necessidade de comunicação em tempo real.
- Necessidade de WebSockets ou conexões persistentes.
- Necessidade de tarefas agendadas ou processamento em segundo plano.
- Requisitos de CORS.
- Necessidade de persistência de sessões.

Apresente um resumo da arquitetura encontrada antes de avançar para as recomendações.

Caso encontre problemas ou configurações que precisem ser adaptadas para produção, liste-os.

## 4. Segunda etapa: avaliação das alternativas de hospedagem

Com base na arquitetura real do projeto, avalie as alternativas disponíveis no mercado.

Considere especialmente serviços que ofereçam planos gratuitos ou econômicos.

Não se limite a estas opções. Pesquise outras alternativas que possam ser mais adequadas.

Algumas plataformas que podem ser avaliadas:

### Frontend
- Vercel.
- Netlify.
- Cloudflare Pages.
- Outras alternativas relevantes.

### Backend
- Render.
- Railway.
- Fly.io.
- Cloudflare Workers, caso sejam compatíveis com nossa arquitetura.
- VPS de baixo custo.
- Outras alternativas relevantes.

### Banco de dados
- Supabase.
- Neon.
- PostgreSQL gerenciado por outras plataformas.
- Banco de dados disponibilizado pela própria hospedagem.
- Outras alternativas relevantes.

### Infraestrutura integrada
Avalie também se faz sentido utilizar uma plataforma que ofereça frontend, backend e banco de dados integrados, reduzindo a complexidade operacional.

Não precisamos necessariamente separar todos os componentes em fornecedores diferentes.

### Critérios de avaliação

Para cada alternativa relevante, considere:

- Custo mensal.
- Existência de plano gratuito.
- Limites do plano gratuito.
- Limites de processamento, memória e armazenamento.
- Limites de requisições e transferência de dados.
- Política de suspensão por inatividade.
- Disponibilidade e confiabilidade.
- Facilidade de configuração.
- Integração com GitHub.
- Deploy automático após push ou merge.
- Facilidade de rollback.
- Disponibilidade de logs e monitoramento.
- Suporte a domínio personalizado e HTTPS.
- Possibilidade de expansão para planos pagos.
- Facilidade de migração para outro fornecedor.

**Importante:** não considere uma plataforma gratuita automaticamente melhor. Avalie se as limitações do plano gratuito são aceitáveis para nosso cenário.

## 5. Terceira etapa: estratégia de deploy

Quero uma proposta completa de como nossa aplicação deverá ser publicada.

Considere:

### Ambientes

Avalie a necessidade de termos:

- Desenvolvimento local.
- Ambiente de homologação/staging.
- Ambiente de produção.

Como somos inicialmente um projeto pessoal, não precisamos criar ambientes desnecessários. Justifique a estrutura recomendada.

### Pipeline de publicação

Proponha um fluxo de CI/CD utilizando GitHub e a plataforma escolhida.

O cenário desejado é:

1. Desenvolver localmente.
2. Enviar as alterações para o GitHub.
3. Executar automaticamente os testes.
4. Realizar o build.
5. Publicar a aplicação caso todas as verificações sejam aprovadas.

Avalie também como realizar rollback caso uma publicação apresente problemas.

### Configurações de produção

Identifique tudo que precisará ser configurado:

- Variáveis de ambiente.
- Secrets.
- URLs de frontend e backend.
- CORS.
- Conexão com banco de dados.
- HTTPS.
- Configurações de domínio.
- Configurações específicas do framework.

Não exponha segredos ou credenciais nos arquivos do repositório.

## 6. Quarta etapa: domínio e identidade da aplicação

Quero também definir como será o endereço público da aplicação.

Avalie:

- Se devemos comprar um domínio próprio desde o início.
- Se podemos começar utilizando um subdomínio gratuito da plataforma.
- Qual seria o custo anual de um domínio próprio.
- Quais registradores são interessantes para um projeto brasileiro.
- Como configurar DNS.
- Como configurar HTTPS e certificados SSL.
- Como estruturar possíveis subdomínios para frontend, API e outros serviços.

Considere que a aplicação será inicialmente utilizada por amigos, mas poderá ser disponibilizada publicamente no futuro.

Quero sugestões de extensões de domínio, considerando opções como .com.br, .com e outras que façam sentido.

Não é necessário registrar ou comprar nenhum domínio. Quero apenas entender as opções e os custos.

## 7. Quinta etapa: estimativa de custos

Esta é uma das partes mais importantes da análise.

Quero uma estimativa de custos mensais e anuais considerando três cenários:

### Cenário A — MVP econômico

- Poucos usuários.
- Utilização eventual.
- Baixo volume de acessos.
- Prioridade absoluta em minimizar custos.

### Cenário B — Projeto em crescimento

- Mais usuários.
- Utilização frequente.
- Maior volume de partidas.
- Necessidade de maior disponibilidade e capacidade.

### Cenário C — Aplicação consolidada

- Base de usuários maior.
- Acesso simultâneo.
- Maior volume de dados.
- Necessidade de melhorar recursos de infraestrutura.

Para cada cenário, apresente:

- Plataforma de frontend.
- Plataforma de backend.
- Banco de dados, se necessário.
- Domínio.
- Outros serviços necessários.
- Custo mensal estimado.
- Custo anual estimado.

Apresente os valores preferencialmente em reais (BRL), indicando quando houver conversão de dólar e qual cotação foi utilizada.

Diferencie claramente:

- Serviços gratuitos.
- Custos fixos.
- Custos variáveis.
- Custos que podem surgir com aumento de utilização.

Não invente preços. Utilize informações atualizadas dos fornecedores, priorizando suas páginas oficiais de preços e documentação.

Sempre que possível, inclua os links das fontes consultadas e a data da consulta.

Também identifique riscos de cobranças inesperadas e formas de estabelecer limites de gastos ou alertas.

## 8. Sexta etapa: segurança, backup e operação

Mesmo sendo um projeto pessoal, quero que a aplicação tenha uma operação minimamente confiável.

Avalie:

- HTTPS obrigatório.
- Proteção das variáveis de ambiente.
- Segurança das APIs.
- Controle de acesso.
- Backups do banco de dados, caso exista.
- Recuperação em caso de perda de dados.
- Logs de aplicação.
- Monitoramento de disponibilidade.
- Alertas em caso de falhas.
- Estratégia de atualização de dependências.

Não quero contratar ferramentas caras para isso se existirem alternativas gratuitas ou nativas das plataformas escolhidas.

## 9. Estratégia de evolução

A solução inicial deve ser simples, mas precisamos entender como ela poderá evoluir.

Explique como seria possível:

- Aumentar os recursos computacionais.
- Migrar para um plano pago.
- Aumentar a capacidade do banco de dados.
- Separar componentes que inicialmente estejam integrados.
- Migrar para outro provedor.
- Suportar mais usuários simultâneos.

Evite recomendar microsserviços, Kubernetes ou arquiteturas distribuídas sem uma necessidade concreta.

Prefiro uma infraestrutura simples, gerenciada e modular.

## 10. Entregáveis esperados

Ao finalizar a análise, quero receber:

1. **Diagnóstico da arquitetura atual:** descrição dos componentes e requisitos reais da aplicação.
2. **Comparativo de hospedagem:** alternativas avaliadas, vantagens, limitações e custos.
3. **Arquitetura recomendada:** desenho da infraestrutura proposta.
4. **Estratégia de deploy:** fluxo completo desde o GitHub até a produção.
5. **Estratégia de domínio:** recomendação de domínio, registrador e configuração DNS.
6. **Estimativa financeira:** custos dos três cenários descritos.
7. **Plano de segurança e operação:** backups, logs, monitoramento e controle de gastos.
8. **Roadmap de implantação:** tarefas organizadas em ordem de execução.
9. **Checklist de produção:** tudo que precisa estar pronto antes de disponibilizarmos a aplicação publicamente.

Utilize diagramas quando ajudarem a explicar a arquitetura.

## 11. Como quero que você trabalhe

Quero uma análise crítica e consultiva.

Para cada decisão relevante:

- Apresente alternativas.
- Compare vantagens e desvantagens.
- Explique os impactos financeiros e técnicos.
- Faça uma recomendação objetiva.
- Justifique sua escolha.

Priorize dados atuais e documentação oficial dos fornecedores.

Não recomende serviços apenas porque possuem um plano gratuito. Considere suas limitações e o custo de evolução.

Não quero uma solução superdimensionada para o momento atual.

**Muito importante: estamos na fase de planejamento. Não altere arquivos, não instale dependências, não crie configurações de infraestrutura, não faça deploy e não contrate serviços.**

Primeiro, analise o repositório e apresente o diagnóstico e a recomendação de arquitetura.

Se existirem dúvidas que possam mudar significativamente a decisão, faça perguntas objetivas.

Ao final, apresente uma proposta de implementação para minha aprovação. Somente depois da minha aprovação começaremos a executar o plano.