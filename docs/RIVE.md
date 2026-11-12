# Integração com Rive

Hoje o pet é desenhado por `src/components/PetView.tsx` com emojis e animações simples.
Quando a arte estiver pronta no [Rive](https://rive.app), o `PetView` passa a renderizar o arquivo `.riv`
com as **mesmas props**, sem mudar nenhuma tela.

## Contrato do arquivo `.riv`

Arquivo: `assets/rive/taskpet.riv`

- **Uma artboard por espécie**, com o nome definido em `riveArtboard` no `src/domain/species.ts`
  (`Gotinha`, `Brasinha`, `Brotinho`).
- Cada artboard tem uma **state machine chamada `Pet`** com estes inputs numéricos:

| Input | Valores |
|---|---|
| `stage` | 0 Ovo · 1 Bebê · 2 Filhote · 3 Jovem · 4 Adulto · 5 Lendário |
| `mood` | 0 Radiante · 1 Feliz · 2 Normal · 3 Triste · 4 Doente · 5 Morto |
| `aura` | 0 Nenhuma · 1 Faísca · 2 Chama · 3 Brasa azul · 4 Arco-íris · 5 Lendária |
| `variant` | 0 Nenhuma · 1 Equilibrado · 2 Exercício · 3 Alimentação · 4 Hidratação · 5 Estudo · 6 Saúde · 7 Casa · 8 Outro |

E um trigger:

| Trigger | Quando dispara |
|---|---|
| `celebrate` | Quando o usuário conclui uma tarefa (pulinho de alegria) |

## Passos técnicos quando o arquivo existir
1. `npx expo install rive-react-native` (biblioteca com código nativo).
2. O app deixa de rodar no Expo Go e passa a usar um **development build**:
   `npx expo run:android` / `npx expo run:ios`, ou `npx eas-cli build --profile development`.
3. Trocar o conteúdo do `PetView` pelo componente Rive, mapeando as props para os inputs acima.
