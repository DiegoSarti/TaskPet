# TaskPet: documento de produto

## Visão

Um app de hábitos em que o usuário cuida de um bichinho virtual. Cumprir as tarefas do dia faz o pet crescer;
abandonar as tarefas deixa o pet triste e, depois de uma semana, faz ele partir. Amigos acompanham os pets uns
dos outros, se incentivam e competem num ranking.

**Público:** geral (crianças, estudantes e adultos que procrastinam).
**Plataformas:** Android e iOS (React Native + Expo). **Backend:** Supabase. **Animação do pet:** Rive.
**Monetização:** em aberto.

## Regras do jogo (implementadas em `src/domain/`)

Os números ficam em `src/domain/rules.ts` e podem ser ajustados sem mexer na lógica.

### Tarefas
- Frequências: **todo dia**, **dias da semana** (ex.: seg/qua/sex), **X vezes por semana**, **X vezes por mês**.
- Quantidade por dia (ex.: 8 copos de água): a tarefa só conta como concluída ao atingir a meta.
- Tarefas removidas são arquivadas para não alterar o histórico.

### XP e evolução
| Conclusão | XP |
|---|---|
| Tarefa diária ou de dias da semana | 10 |
| Tarefa semanal (até a meta da semana) | 25 |
| Tarefa mensal (até a meta do mês) | 60 |

| Estágio | XP mínimo |
|---|---|
| Ovo | 0 |
| Bebê | 50 |
| Filhote | 200 |
| Jovem | 500 |
| Adulto | 1000 |
| Lendário | 2500 |

- O pet **nunca regride** de estágio.
- **Forma (variante):** a partir de *Jovem*, a categoria em que o usuário mais ganhou XP define a forma do pet
  (Atleta, Sábia, Chef, Aquática...). Se nenhuma categoria tiver 40% do XP, a forma é *Equilibrada*.

### Streak e aura
- Um dia conta para o streak quando **80%** das tarefas com dia marcado foram concluídas.
- Dias sem tarefa marcada não quebram nem somam. Hoje não quebra o streak enquanto o dia não acaba.
- A aura do pet muda com o streak: Faísca (3 dias), Chama (7), Brasa azul (14), Arco-íris (30), Lendária (100).

### Humor e morte
Conta os **dias inativos**: dias completos, com tarefa marcada, sem nenhuma tarefa concluída.

| Dias inativos | Estado |
|---|---|
| 0–1 | Feliz / Tranquilo (Radiante com streak ≥ 3 e dia cumprido) |
| 2–3 | Triste, com aviso de quantos dias faltam |
| 4–6 | Doente, com aviso |
| 7 | **Morre.** Vai para o Memorial e o usuário choca um ovo novo do zero |

- O dia em que o pet nasce é período de graça.
- Quem só tem tarefas semanais ou mensais não perde o pet por inatividade.

## Social
- Conta com e-mail e senha (login com Google e Apple fica para uma próxima etapa; a Apple exige
  "Entrar com Apple" quando há login social).
- Cada usuário tem um **código de amigo** de 6 caracteres para compartilhar.
- Amigos veem apenas a "foto" do pet: nome, espécie, estágio, humor, aura, XP e streak. **As tarefas são privadas.**
- **Ranking** entre amigos por XP da semana, streak ou XP total.
- **Incentivos:** 👏 💪 🔥 ❤️ ⭐.

## Notificações (implementadas em `src/domain/reminders.ts`)
- **Lembrete por tarefa:** horário opcional; toca só nos dias da tarefa e não toca se ela já foi concluída
  (semanais/mensais param de lembrar quando a meta do período é batida).
- **Avisos do pet** (horário configurável, padrão 19h): quando ele fica triste (2 dias), doente (4 dias)
  e no último dia antes de partir (6 dias). Uma atividade reagenda tudo.
- Notificações locais, agendadas para os próximos 3 dias e refeitas a cada mudança (limite de 60 no iOS).

## O que já existe (v0.1)
- [x] Chocar ovo (3 espécies iniciais) e dar nome
- [x] Criar tarefas (sugestões prontas ou personalizadas), marcar, desmarcar e arquivar
- [x] XP, estágios, forma por categoria, streak, aura, humor, morte e memorial
- [x] Dados salvos no aparelho (funciona sem internet)
- [x] Esquema do Supabase com segurança por linha (RLS), amizades, ranking e incentivos
- [x] Telas de Amigos/Ranking e Perfil (modo demonstração enquanto o Supabase não está configurado)
- [x] Visual provisório do pet com emojis (o lugar do Rive já está definido)
- [x] Lembretes por tarefa e avisos do pet (v0.2)
- [x] Editar tarefas
- [x] Perfil criado pelo banco no cadastro (funciona com confirmação de e-mail)

## Próximos passos
1. Criar o projeto no Supabase e testar login, amizades e ranking de ponta a ponta.
2. Arquivo `.riv` com a primeira espécie (veja `docs/RIVE.md`) e development build.
3. Login com Google e Apple.
4. Ver os incentivos recebidos e receber push quando chegar um (exige push remoto, development build e EAS).
5. Mais espécies (ideias em aberto).
6. Política de privacidade e regras para menores de idade antes de publicar nas lojas.

## Decisões em aberto
- Catálogo final de espécies.
- Monetização (cosméticos, assinatura...).
- Idade mínima / modo com consentimento dos pais.
