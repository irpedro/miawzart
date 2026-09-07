# 🐱🎵 Miawzart

Jogo educativo e divertido para crianças aprenderem leitura de notas musicais e duração das figuras rítmicas.

![Versão](https://img.shields.io/badge/version-1.0.0-blue)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

## 🎮 Sobre o jogo

O **Miawzart** é um jogo web que ajuda crianças a praticar leitura de partituras de forma lúdica. Atualmente, possui o modo "Notas Musicais", onde o jogador identifica a nota mostrada na pauta, e em breve terá o modo "Duração das Notas", com foco em ritmo e compassos.

## ✨ Funcionalidades

- 🎼 Partitura interativa com renderização via VexFlow
- 🎹 Instrumentos com samples reais (piano, flauta, violino)
- ⏱️ Temporizador e sistema de vidas
- 🏆 Pontuação e recorde salvo no navegador
- ⚙️ Configurações de dificuldade, instrumento e volume
- 📱 Design responsivo (funciona em celulares e tablets)
- 🎵 Música de fundo e efeitos sonoros

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 22 ou superior
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/irpedro/miawzart.git

# Entre na pasta
cd miawzart

# Instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev -- --host
```

Abra `http://localhost:5173/miawzart/` no navegador.

## 🌐 Publicação no GitHub Pages

O deploy é automático via GitHub Actions. Ao enviar alterações para a branch `main`, o workflow builda o projeto e publica na branch `gh-pages`.

Para configurar manualmente:

1. Gere o build: `npm run build`
2. Commit e push a pasta `dist` para a branch `gh-pages`
3. No GitHub, ative o Pages apontando para a branch `gh-pages`

## 🧰 Tecnologias usadas

- [Svelte](https://svelte.dev/) + TypeScript
- [Vite](https://vitejs.dev/)
- [VexFlow](https://vexflow.com/) – renderização de partitura
- [soundfont-player](https://www.npmjs.com/package/soundfont-player) – samples de instrumentos
- [FluidR3_GM](https://github.com/gleitz/midi-js-soundfonts) – banco de samples (licença MIT)

## 🎨 Créditos

- **Músicas:** Jazzy Vibes #81 - Jazz Piano Medley (menu) e Two Left Socks (jogo)  
  Autor: Tri-Tachyon  
  Fonte: [OpenGameArt.org](https://opengameart.org/)  
  Licença: [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode)
- **Fonte:** Baloo 2 (Google Fonts)
- **Emojis:** OpenMoji / Twemoji (conforme uso)
