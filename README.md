# TaskPet 🥚

App de hábitos com um bichinho virtual: cumpra suas tarefas diárias e seu pet evolui. Se você sumir por uma semana,
ele parte, e você recomeça do ovo. Adicione amigos, veja os pets deles e dispute o ranking.

- **App:** React Native + Expo (SDK 58) + Expo Router
- **Estado local:** Zustand + AsyncStorage (funciona sem internet)
- **Backend:** Supabase (login, amigos, ranking, incentivos)
- **Animação do pet:** Rive (planejado, veja [docs/RIVE.md](docs/RIVE.md))

Regras do jogo e roadmap: [docs/PRODUTO.md](docs/PRODUTO.md).

## Rodando

```bash
npm install
npm start          # abre o Expo; escaneie o QR code com o app Expo Go no celular
npm run web        # ou rode no navegador
```

Sem configurar o Supabase, o app roda completo no aparelho e a aba **Amigos** mostra amigos de exemplo.

### Ativando o lado social (Supabase)
1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode o SQL de `supabase/migrations/` (pelo SQL Editor do painel ou com `supabase db push`).
3. Copie `.env.example` para `.env.local` e preencha a URL e a chave anon do projeto.
4. Reinicie o `npm start`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm test` | Testes das regras do pet (`src/domain`) |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | Lint |

## Estrutura

```
src/
  app/            telas (Expo Router)
    (tabs)/       Hoje, Amigos, Perfil
    hatch.tsx     chocar ovo / recomeçar
    new-task.tsx  nova tarefa
    auth.tsx      login e cadastro
  domain/         regras do jogo, sem dependência de React (testadas)
  store/          estado do app salvo no aparelho
  lib/            Supabase e funções sociais
  components/     PetView, TaskRow
supabase/migrations/  esquema do banco com RLS
docs/             produto e integração Rive
```
