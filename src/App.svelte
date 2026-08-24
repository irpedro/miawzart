<script lang="ts">
  import { onMount, onDestroy, tick  } from 'svelte';
  import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';
  import {
    NOTE_NAMES,
    NOTES,
    KEY_MAP,
    getBaseNoteName,
    getRandomNote,
    playNote,
    preloadInstrument,
    playWrongSound,
    playClickSound,
    playGameOverSound,
  } from './lib/music';
  import './lib/styles.css';
  
  // Notas e Sons
  let staffContainer: HTMLDivElement;
  let previousNote = '';
  let selectedInstrument = 'piano';
  let bgmAudio: HTMLAudioElement | null = null;
  let bgmVolume = 15;  // 15%
  let instrumentVolume = 80; // 80%
  let isMusicEnabled = true; // controle do botão de mudo
  $: if (bgmAudio) bgmAudio.volume = bgmVolume / 100;
  const BGM_MENU = '/audio/Buy Something!.mp3';   // música do menu
  const BGM_GAME = '/audio/two_left_socks.ogg';     // música do jogo
  let currentBgm = BGM_MENU;  // inicialmente aponta para o menu

  // Estado do jogo
  let currentNote = 'c/4';
  let score = 0;
  let message = '';
  let isCorrect = false;
  let unlockedNotes = 17; // Começa com todas as notas desbloqueadas

  // Vidas e temporizador
  let lives = 5;
  let timer = 20;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let isGameOver = false;
  let highScore = 0;
  let currentScreen: 'start' | 'playing' | 'config' | 'credits' | 'gameover' = 'start';
  let difficulty = 17;

  function generateRandomNote() {
    currentNote = getRandomNote(unlockedNotes, previousNote);
    previousNote = currentNote;
  }

  // Funções de música
  async function playBgm(src: string) {
    if (!isMusicEnabled) return;
    if (!bgmAudio) {
      bgmAudio = document.getElementById('bgm') as HTMLAudioElement;
    }
    if (bgmAudio) {
      if (bgmAudio.src !== new URL(src, window.location.href).href) {
        bgmAudio.src = src;
      }
      bgmAudio.loop = true;   // <-- garante repetição
      bgmAudio.volume = bgmVolume / 100;
      await bgmAudio.play();
    }
  }

  function pauseBgm() {
    if (bgmAudio) {
      bgmAudio.pause();
    }
  }

  // Salva as preferências no localStorage
  function savePreferences() {
    localStorage.setItem('mini-mozart-bgm-volume', String(bgmVolume));
    localStorage.setItem('mini-mozart-instrument-volume', String(instrumentVolume));
    localStorage.setItem('mini-mozart-music-enabled', String(isMusicEnabled));
  }

  // Desenha a pauta e a nota no container
  function drawNote() {
    if (!staffContainer) return;
    staffContainer.innerHTML = ''; // limpa a pauta anterior

    const renderer = new Renderer(staffContainer, Renderer.Backends.SVG);
    renderer.resize(500, 220);
    const context = renderer.getContext();

    // FIXED: Separate the draw() call so 'stave' is correctly defined
    const stave = new Stave(10, 50, 480).addClef('treble');
    stave.setContext(context).draw();

    const note = new StaveNote({
      clef: 'treble',
      keys: [currentNote],
      duration: 'q',
    });

    note.setStyle({
      fillStyle: '#FF7043',
      strokeStyle: '#D84315',
    });

    const voice = new Voice({ numBeats: 1, beat_value: 4 });
    voice.setMode(Voice.Mode.SOFT);
    voice.setStave(stave);
    voice.addTickables([note]);

    new Formatter().joinVoices([voice]).format([voice], 350);
    voice.draw(context, stave);
  }

  // Lida com o clique no botão de resposta
  function handleAnswer(answerName: string) {

    if (isGameOver) return;

    const correctFullName = NOTE_NAMES[currentNote];
    const correctBaseName = getBaseNoteName(correctFullName); // extrai "Dó", "Ré", etc.

    if (answerName === correctBaseName) {
      score += 1;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('mini-mozart-highscore', highScore.toString());
      }
      if (score > 0 && score % 5 === 0 && unlockedNotes < NOTES.length) {
        unlockedNotes += 1;
      }
      isCorrect = true;
      message = 'Muito bem! 🎉';
      playNote(currentNote, selectedInstrument, instrumentVolume / 100); // toca a nota correta, com intrumento selecionado e volume ajustado
      spawnConfetti();
    } else {
      isCorrect = false;
      playWrongSound();
      message = `Ops! A nota era ${correctBaseName}.`;

      const gameEnded = loseLife();
      if (gameEnded) {
        gameOver();
        return;
      }
    }

    // Avança para a próxima rodada
    generateRandomNote();
    drawNote();
    startTimer();

    // Limpa a mensagem após 4 segundos
    setTimeout(() => {
      message = '';
    }, 4000);
  }

   // Configura teclas de atalho para respostas
    function handleKeydown(event: KeyboardEvent) {
      if (isGameOver) return;

      const noteName = KEY_MAP[event.key.toLowerCase()];
      if (noteName) {
        handleAnswer(noteName);
      }
    }

  // Função para gerar confetes
  function spawnConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#FF5252', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti-piece');
      container.appendChild(confetti);

      // Configurações aleatórias
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 1 + 0.8) + 's';
      confetti.style.animationDelay = Math.random() * 0.3 + 's';
      confetti.style.width = (Math.random() * 8 + 5) + 'px';
      confetti.style.height = (Math.random() * 8 + 5) + 'px';

      // Remove quando a animação terminar
      confetti.addEventListener('animationend', () => {
        confetti.remove();
      });
    }
  }

  // Temporizador e vidas 
  function startTimer() {
    timer = 20;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timer -= 1;
      if (timer <= 0) {
        clearInterval(timerInterval!);
        const gameEnded = loseLife();
        if (gameEnded) {
          gameOver();
          return;
        } else {
          message = 'Tempo esgotado! Você perdeu uma vida.';
          isCorrect = false;
          // Avança a rodada após 1 segundo
          setTimeout(() => {
            generateRandomNote();
            drawNote();
            startTimer();
            message = '';
          }, 2000);
        }
      }
    }, 1000);
  }

  // Perde uma vida e verifica se o jogo acabou
  function loseLife(): boolean {
    lives -= 1;
    if (lives <= 0) {
      isGameOver = true;
      clearInterval(timerInterval!);
      return true; // jogo acabou
    }
    return false; // ainda tem vidas
  }

  // Reinicia o jogo
  function resetGame() {
    lives = 5;
    score = 0;
    isGameOver = false;
    unlockedNotes = difficulty; // usa a dificuldade escolhida
    generateRandomNote();
    drawNote();
    startTimer();
    message = '';
  }

  // Funções para navegação entre telas
  async function startGame() {
    playClickSound();
    currentScreen = 'playing';
    await tick(); // aguarda o DOM renderizar a tela de jogo
    resetGame();
    preloadInstrument(selectedInstrument);
    if (isMusicEnabled) {
      playBgm(BGM_GAME);
    }
  }

  function goToConfig() {
    playClickSound();
    stopTimer();
    pauseBgm();
    currentScreen = 'config';
    if (isMusicEnabled) {
      playBgm(BGM_MENU);
    }
  }

  function goToStart() {
    playClickSound();
    stopTimer();
    pauseBgm();
    currentScreen = 'start';
    if (isMusicEnabled) {
      playBgm(BGM_GAME);
    }
  }

  function goToCredits() {
    playClickSound();
    stopTimer();
    pauseBgm();
    currentScreen = 'credits';
    if (isMusicEnabled) {
      playBgm(BGM_MENU);
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function gameOver() {
    playGameOverSound();        // toca o som
    stopTimer();                // para o temporizador
    pauseBgm();                 // pausa a música do jogo
    currentScreen = 'gameover'; // muda para a tela
  }

  // Inicializa o jogo
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);

    const savedHighScore = localStorage.getItem('mini-mozart-highscore');
    if (savedHighScore) {
      highScore = parseInt(savedHighScore, 10);
    }

    const savedBgmVolume = localStorage.getItem('mini-mozart-bgm-volume');
    const savedInstrumentVolume = localStorage.getItem('mini-mozart-instrument-volume');
    const savedMusicEnabled = localStorage.getItem('mini-mozart-music-enabled');

    if (savedBgmVolume !== null) bgmVolume = parseInt(savedBgmVolume, 10);
    if (savedInstrumentVolume !== null) instrumentVolume = parseInt(savedInstrumentVolume, 10);
    if (savedMusicEnabled !== null) isMusicEnabled = savedMusicEnabled === 'true';

    playBgm(BGM_MENU);
  });

  // Limpa o listener de eventos e o temporizador ao destruir o componente
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
    if (timerInterval) clearInterval(timerInterval);
  });
</script>

<main>

  <!-- Elemento de áudio para música de fundo -->
  <audio id="bgm" loop preload="auto" src={currentBgm}></audio>

  <!-- Renderiza a tela atual com base no estado currentScreen -->
  {#if currentScreen === 'start'}
    <!-- Tela inicial -->
    <div class="screen start-screen">
      <h1 class="title">
        <span class="mascot">🐱</span>
        Miawzart
      </h1>
      <button class="big-button" on:click={startGame}>🎵 Jogar</button>
      <button class="big-button secondary" on:click={() => { playClickSound(); goToConfig(); }}>⚙️ Configurações</button>
      <button class="big-button secondary" on:click={() => { playClickSound(); goToCredits(); }}>📜 Créditos</button>
    </div>

  <!-- Tela de configurações -->
  {:else if currentScreen === 'config'}
    <div class="screen config-screen">
      <h2 class="config-title">⚙️ Configurações</h2>

      <!-- Dificuldade -->
      <div class="config-group center-group">
        <span class="config-label">Dificuldade</span>
        <div class="config-options">
          <button class="config-btn" class:active={difficulty === 7} on:click={() => { playClickSound(); difficulty = 7; }}>Fácil</button>
          <button class="config-btn" class:active={difficulty === 10} on:click={() => { playClickSound(); difficulty = 10; }}>Médio</button>
          <button class="config-btn" class:active={difficulty === 17} on:click={() => { playClickSound(); difficulty = 17; }}>Difícil</button>
        </div>
      </div>

      <!-- Instrumento -->
      <div class="config-group center-group">
        <span class="config-label">Instrumento</span>
        <div class="config-options">
          <button class="config-btn" class:active={selectedInstrument === 'piano'} on:click={() => { playClickSound(); selectedInstrument = 'piano'; preloadInstrument('piano'); }}>🎹 Piano</button>
          <button class="config-btn" class:active={selectedInstrument === 'flauta'} on:click={() => { playClickSound(); selectedInstrument = 'flauta'; preloadInstrument('flauta'); }}>🎶 Flauta</button>
          <button class="config-btn" class:active={selectedInstrument === 'violino'} on:click={() => { playClickSound(); selectedInstrument = 'violino'; preloadInstrument('violino'); }}>🎻 Violino</button>
        </div>
      </div>

      <!-- Volume da música -->
      <div class="config-group">
        <span class="config-label">Volume da música</span>
        <div class="volume-control">
          <input type="range" min="0" max="100" bind:value={bgmVolume} disabled={!isMusicEnabled} on:change={() => savePreferences()}/>
          <span class="volume-value">{bgmVolume}</span>
        </div>
      </div>

      <!-- Volume dos instrumentos -->
      <div class="config-group">
        <span class="config-label">Volume dos instrumentos</span>
        <div class="volume-control">
          <input type="range" min="0" max="100" bind:value={instrumentVolume} on:change={() => savePreferences()}/>
          <span class="volume-value">{instrumentVolume}</span>
        </div>
      </div>

      <!-- Botão de mudo -->
      <div class="config-group center-group">
        <span class="config-label">Música de fundo</span>
        <button class="config-btn" class:active={isMusicEnabled} on:click={() => {playClickSound(); isMusicEnabled = !isMusicEnabled; if (!isMusicEnabled) pauseBgm(); savePreferences();}}>
          {isMusicEnabled ? '🔊 Ligada' : '🔇 Desligada'}
        </button>
      </div>

      <!-- Resetar recorde -->
      <button class="config-btn danger" on:click={() => { playClickSound(); localStorage.removeItem('mini-mozart-highscore'); highScore = 0; }}>
        🗑️ Resetar recorde
      </button>

      <!-- Voltar -->
      <button class="big-button secondary" on:click={goToStart}>← Voltar</button>
    </div>

  <!-- Tela de créditos -->
  {:else if currentScreen === 'credits'}
    <div class="screen credits-screen">
      <h2 class="config-title">📜 Créditos</h2>
      <div class="credits-content">
        <p><strong>Desenvolvimento:</strong> Pedro Gabriel Ruiz</p>
        <p><strong>Notas musicais e partitura:</strong> VexFlow (MIT License)</p>
        <p><strong>Sons de instrumentos:</strong> FluidR3_GM (MIT License) via soundfont-player</p>
        <p>
          <strong>Músicas:</strong> Jazzy Vibes #81 - Jazz Piano Medley (menu) e Two Left Socks (jogo)<br>
          Autor: Tri-Tachyon<br>
          Fonte: <a href="https://opengameart.org/" target="_blank" rel="noopener">OpenGameArt.org</a><br>
          Licença: <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">CC-BY 4.0</a><br>
          Atribuição: "Music by Tri-Tachyon - https://soundcloud.com/tri-tachyon/albums"
        </p>
        <p><strong>Fonte:</strong> Baloo 2 (Google Fonts)</p>
        <p><strong>Emojis:</strong> OpenMoji / Twemoji (conforme uso)</p>
      </div>
      <button class="big-button secondary" on:click={goToStart}>← Voltar</button>
    </div>

  {:else if currentScreen === 'gameover'}
    <div class="screen gameover-screen">
      <h2 class="config-title">😿 Fim de jogo</h2>
      <p class="gameover-text">Você conseguiu <strong>{score}</strong> pontos!</p>
      <p class="gameover-text">Recorde: <strong>{highScore}</strong></p>
      <div class="gameover-buttons">
        <button class="big-button" on:click={startGame}>🔁 Jogar novamente</button>
        <button class="big-button secondary" on:click={goToStart}>🏠 Menu</button>
      </div>
    </div>

  <!-- Tela de jogo -->
  {:else}

    <div class="sky">
      <div class="cloud cloud1"></div>
      <div class="cloud cloud2"></div>
      <div class="cloud cloud3"></div>
      <div class="sun"></div>
    </div>

    <div class="floating-notes" aria-hidden="true">
      <span class="float-note">🎵</span>
      <span class="float-note">🎶</span>
      <span class="float-note">🎵</span>
      <span class="float-note">🎶</span>
      <span class="float-note">🎵</span>
    </div>

    <div class="side left" aria-hidden="true">
      <span class="instrument">🎹</span>
      <span class="instrument">🥁</span>
      <span class="instrument">🎻</span>
      <span class="instrument">🎺</span>
      <span class="balloon">🎈</span>
      <span class="star">⭐</span>
      <span class="balloon">🎈</span>
    </div>

    <div class="side right" aria-hidden="true">
      <span class="instrument">🎸</span>
      <span class="instrument">🎷</span>
      <span class="instrument">🎵</span>
      <span class="instrument">🎶</span>
      <span class="balloon">🎈</span>
      <span class="star">⭐</span>
      <span class="balloon">🎈</span>
    </div>

    <div class="content">
      <h1 class="title">
        <span class="mascot">🐱</span>
        Miawzart
      </h1>

      <div class="staff-card" bind:this={staffContainer}></div>

      <p class="question">Que nota é essa miaw?</p>

      <div class="status">
        <span class="lives">❤️ {lives}</span>
        <span class="timer">⏱️ {timer}s</span>
      </div>

      <p class="score">Pontos: {score} | Recorde: {highScore}</p>

      {#if message}
        <p class="feedback" class:correct={isCorrect} class:wrong={!isCorrect}>
          {message}
        </p>
      {/if}

      <div class="answers">
        <button class="answer red"    on:click={() => handleAnswer('Dó')}>Dó <span class="key-hint">A</span></button>
        <button class="answer blue"   on:click={() => handleAnswer('Ré')}>Ré <span class="key-hint">S</span></button>
        <button class="answer yellow" on:click={() => handleAnswer('Mi')}>Mi <span class="key-hint">D</span></button>
        <button class="answer green"  on:click={() => handleAnswer('Fá')}>Fá <span class="key-hint">F</span></button>
        <button class="answer orange" on:click={() => handleAnswer('Sol')}>Sol <span class="key-hint">J</span></button>
        <button class="answer purple" on:click={() => handleAnswer('Lá')}>Lá <span class="key-hint">K</span></button>
        <button class="answer pink"   on:click={() => handleAnswer('Si')}>Si <span class="key-hint">L</span></button>
      </div>

      <button class="config-gear" on:click={goToConfig}>⚙️</button>
    </div>

    <div class="confetti-container" id="confetti-container"></div>
  {/if}
</main>