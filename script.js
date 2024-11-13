let currentMenuIndex = 0;
let currentScreen = 'menu';
let currentSongIndex = 0;
let savedCharts = [];

const screens = {
    menu: document.querySelector('.menu-options'),
    songs: document.querySelector('#song-select'),
    editor: document.querySelector('#chart-editor'),
    settings: document.querySelector('#settings')
};

const menuButtons = document.querySelectorAll('.menu-button');

async function loadSongs() {
    const songList = document.querySelector('.song-list');
    songList.innerHTML = '';
    
    savedCharts = await fetchSavedCharts();
    
    savedCharts.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.innerHTML = `
            <h3>${song.songTitle}</h3>
            <span class="difficulty">Notes: ${song.notes.length}</span>
        `;
        songElement.addEventListener('click', () => {
            currentSongIndex = index;
            updateSongSelection();
            startGame(savedCharts[index]);
        });
        songList.appendChild(songElement);
    });
}

async function fetchSavedCharts() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    return new Promise((resolve) => {
        fileInput.onchange = async (e) => {
            const charts = [];
            for (const file of e.target.files) {
                const text = await file.text();
                charts.push(JSON.parse(text));
            }
            resolve(charts);
            fileInput.remove();
        };
        fileInput.click();
    });
}

const repoUrlInput = document.getElementById('repo-url');
const fetchButton = document.getElementById('fetch-songs');
const loadingIndicator = document.querySelector('.loading-indicator');
const songList = document.querySelector('.song-list');

fetchButton.addEventListener('click', fetchSongsFromRepo);

async function fetchSongsFromRepo() {
    const repoUrl = repoUrlInput.value;
    if (!repoUrl) return;
    loadingIndicator.classList.remove('hidden');
    songList.innerHTML = '';
    try {
        const rawRepoUrl = convertToRawUrl(repoUrl);
        const manifestUrl = `${rawRepoUrl}/refs/heads/main/manifest.json`;
        const response = await fetch(manifestUrl);
        const manifest = await response.json();
        manifest.songs.forEach(song => {
            const songElement = createSongElement(song);
            songList.appendChild(songElement);
        });

    } catch (error) {
        songList.innerHTML = '<div class="error">Failed to fetch songs. Check the repository URL.</div>';
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function convertToRawUrl(githubUrl) {
    return githubUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace(/\/$/, '');
}

function createSongElement(song) {
    const div = document.createElement('div');
    div.className = 'song-item';
    div.innerHTML = `
        <h3>${song.title}</h3>
        <p>Artist: ${song.artist}</p>
        <p>BPM: ${song.bpm}</p>
        <div class="difficulty-list">
            ${song.difficulties.map(diff => 
                `<span class="difficulty-badge ${diff.name.toLowerCase()}">
                    ${diff.name} (Lv.${diff.level})
                </span>`
            ).join('')}
        </div>
    `;

    div.addEventListener('click', () => loadSong(song));
    return div;
}

async function loadSong(song) {
    const repoUrl = convertToRawUrl(repoUrlInput.value);
    const audioUrl = `${repoUrl}/refs/heads/main/${song.audioFile}`;
    const audio = new Audio(audioUrl);
    const selectedDifficulty = song.difficulties[1];
    const chartUrl = `${repoUrl}/refs/heads/main/${song.chartFile}`;
    
    try {
        const chartResponse = await fetch(chartUrl);
        const chartData = await chartResponse.json();
        document.getElementById('song-select').classList.add('hidden');
        const gameContainer = document.getElementById('game-container');
        gameContainer.classList.remove('hidden');
        initializeGame(audio, chartData);
        
    } catch (error) {
        console.log('Chart loading failed:', error);
    }
}

function initializeGame(audio, chartData) {
    startGame(chartData);
    console.log('Game starting with:', {
        audio: audio,
        chart: chartData
    });
}document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (currentScreen === 'menu') return;
        showScreen('menu');
        return;
    }

    switch(currentScreen) {
        case 'menu':
            handleMenuNavigation(e);
            break;
        case 'songs':
            handleSongNavigation(e);
            break;
    }
});
function handleMenuNavigation(e) {
    switch(e.key) {
        case 'ArrowUp':
            currentMenuIndex = (currentMenuIndex - 1 + menuButtons.length) % menuButtons.length;
            updateMenuSelection();
            break;
        case 'ArrowDown':
            currentMenuIndex = (currentMenuIndex + 1) % menuButtons.length;
            updateMenuSelection();
            break;
        case 'Enter':
            selectMenuOption();
            break;
        case 'Escape':
            if (currentScreen !== 'menu') {
                showScreen('menu');
            }
            break;
    }
}

function handleSongNavigation(e) {
    const songItems = document.querySelectorAll('.song-item');
    switch(e.key) {
        case 'ArrowUp':
            currentSongIndex = (currentSongIndex - 1 + songItems.length) % songItems.length;
            updateSongSelection();
            break;
        case 'ArrowDown':
            currentSongIndex = (currentSongIndex + 1) % songItems.length;
            updateSongSelection();
            break;
        case 'Enter':
            if (savedCharts[currentSongIndex]) {
                const gameContainer = document.getElementById('game-container');
                gameContainer.classList.remove('hidden');
                startGame(savedCharts[currentSongIndex]);
            }
            break;
        case 'Escape':
            showScreen('menu');
            break;
    }
}

function updateMenuSelection() {
    menuButtons.forEach((button, index) => {
        button.classList.toggle('selected', index === currentMenuIndex);
    });
}

function updateSongSelection() {
    const songItems = document.querySelectorAll('.song-item');
    songItems.forEach((item, index) => {
        item.classList.toggle('selected', index === currentSongIndex);
    });
}

function selectMenuOption() {
    switch(currentMenuIndex) {
        case 0:
            showScreen('songs');
            break;
        case 1:
            showScreen('editor');
            break;
        case 2:
            showScreen('settings');
            break;
    }
}

async function startGame(song) {
    const gameContainer = document.getElementById('game-container');
    gameContainer.classList.remove('hidden');
    
    const game = new RhythmGame(gameContainer, song);
    await game.init();
    game.start();
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
    currentScreen = screenName;
    
    if (screenName === 'songs') {
        loadSongs();
        currentSongIndex = 0;
        updateSongSelection();
    } else if (screenName === 'editor') {
        if (!window.chartEditor) {
            window.chartEditor = new ChartEditor();
        }
    }
}

class RhythmGame {
    constructor(container, songData) {
        this.container = container;
        this.songData = songData;
        this.notes = JSON.parse(JSON.stringify(songData.notes));
        this.bpm = songData.bpm;
        this.audioContext = new AudioContext();
        this.score = 0;
        this.combo = 0;
        this.scrollSpeed = 600;
        this.noteElements = new Map();
        this.botPlay = document.querySelector('#bot-play').value === 'on';
        this.totalNotesHit = 0;
        this.totalNotes = songData.notes.length;
        this.accuracy = 100;
        this.notesMissed = 0;
    }

    async init() {
        this.setupGameUI();
        await this.loadAudio();
        this.setupKeyListeners();
        this.createNotes();
    }

    setupGameUI() {
        this.container.innerHTML = `
            <div class="game-stats">
                <div id="game-score">Score: 0</div>
                <div id="game-combo">Combo: 0</div>
                <div id="game-accuracy">Accuracy: 0.00%</div>
            </div>
            <div class="game-lanes">
                <div class="lane" data-key="D">
                    <div class="hit-indicator"></div>
                    <div class="key-overlay">D</div>
                </div>
                <div class="lane" data-key="F">
                    <div class="hit-indicator"></div>
                    <div class="key-overlay">F</div>
                </div>
                <div class="lane" data-key="J">
                    <div class="hit-indicator"></div>
                    <div class="key-overlay">J</div>
                </div>
                <div class="lane" data-key="K">
                    <div class="hit-indicator"></div>
                    <div class="key-overlay">K</div>
                </div>
            </div>
        `;
    }

    createNotes() {
        const lanes = document.querySelectorAll('.lane');
        this.notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            lanes[note.lane].appendChild(noteElement);
            this.noteElements.set(note, noteElement);
            noteElement.style.top = '0%';
        });
    }

    setupKeyListeners() {
        const keyMap = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
        
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (keyMap.hasOwnProperty(key)) {
                const lane = keyMap[key];
                this.handleKeyPress(lane);
            }
        });
    }

    handleKeyPress(lane) {
        const lanes = document.querySelectorAll('.lane');
        const hitIndicator = lanes[lane].querySelector('.hit-indicator');
        const keyOverlay = lanes[lane].querySelector('.key-overlay');
        let hit = false;
        hitIndicator.classList.add('hit-flash');
        keyOverlay.classList.add('key-pressed');
        
        setTimeout(() => {
            hitIndicator.classList.remove('hit-flash');
            keyOverlay.classList.remove('key-pressed');
        }, 100);
    
        const currentTime = this.audioContext.currentTime - this.startTime;
        const hitWindow = 0.150;
    
        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];
            if (note.lane === lane) {
                const currentTime = this.audioContext.currentTime - this.startTime;
                const hitWindow = 0.150;
                const accuracyDelta = 1 - Math.abs(note.time - currentTime) / hitWindow;

                if (accuracyDelta > 0) {
                    this.score += 100 * accuracyDelta * (1 + this.combo * 0.1);
                    this.combo++;
                    this.accuracy = Math.max(0, this.accuracy + accuracyDelta * (100 / this.totalNotes));
                    const noteElement = this.noteElements.get(note);
                    if (noteElement) {
                        noteElement.remove();
                        this.noteElements.delete(note);
                    }
                    this.notes.splice(i, 1);
                    i--;

                    hit = true;
                    this.updateStats();
                    break;
                }
            }
        }

        if (!hit && !this.botPlay) {
            this.notesMissed++;
            this.accuracy = Math.max(0, this.accuracy - (100 / this.totalNotes));
            this.combo = 0;
            this.updateStats();
        }
    }    

    async loadAudio() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'audio/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        return new Promise((resolve) => {
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                const arrayBuffer = await file.arrayBuffer();
                this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                fileInput.remove();
                resolve();
            };
            fileInput.click();
        });
    }

    start() {
        if (!this.audioBuffer) return;
        
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.connect(this.audioContext.destination);
        
        this.startTime = this.audioContext.currentTime;
        this.audioSource.start(0);
        this.gameLoop();
    }

    gameLoop() {
        const currentTime = this.audioContext.currentTime - this.startTime;
        
        this.noteElements.forEach((element, note) => {
            const timeUntilHit = note.time - currentTime;
            const progress = (1 - timeUntilHit) * 100;
            element.style.top = `${progress}%`;
            if (this.botPlay && timeUntilHit <= 0.05 && timeUntilHit >= -0.05) {
                this.score += 100 * (1 + this.combo * 0.1);
                this.combo++;
                element.remove();
                this.noteElements.delete(note);
                this.updateStats();
                const lanes = document.querySelectorAll('.lane');
                const lane = lanes[note.lane];
                const hitIndicator = lane.querySelector('.hit-indicator');
                const keyOverlay = lane.querySelector('.key-overlay');
                hitIndicator.classList.add('hit-flash');
                keyOverlay.classList.add('key-pressed');
                setTimeout(() => {
                    hitIndicator.classList.remove('hit-flash');
                    keyOverlay.classList.remove('key-pressed');
                }, 100);
            }
            if (!this.botPlay && progress > 100) {
                element.remove();
                this.noteElements.delete(note);
                this.combo = 0;
                this.updateStats();
            }
        });

        if (this.noteElements.size > 0) {
            requestAnimationFrame(() => this.gameLoop());
        } else {
            setTimeout(() => {
                alert(`Game Over!\nFinal Score: ${Math.floor(this.score)}`);
                document.getElementById('game-container').classList.add('hidden');
                showScreen('songs');
            }, 1000);
        }
    }
    updateStats() {
        document.getElementById('game-score').textContent = `Score: ${Math.floor(this.score)}`;
        document.getElementById('game-combo').textContent = `Combo: ${this.combo}`;
        document.getElementById('game-accuracy').textContent = `Accuracy: ${this.accuracy.toFixed(2)}%`;
    }
}

class ChartEditor {
    constructor() {
        this.timeline = [];
        this.currentTime = 0;
        this.audioContext = new AudioContext();
        this.audioBuffer = null;
        this.audioSource = null;
        this.isPlaying = false;
        this.bpm = 120;
        this.snap = 4;
        this.selectedNotes = new Set();
        this.startTime = 0;
        this.timelineOffset = 0;
        this.setupEditor();
    }

    setupEditor() {
        this.canvas = document.getElementById('timeline');
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
        this.resizeCanvas();
        this.draw();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = 400;
    }

    setupEventListeners() {
        document.getElementById('audio-upload').addEventListener('change', (e) => this.loadAudio(e.target.files[0]));
        document.getElementById('play-pause').addEventListener('click', () => this.togglePlayback());
        document.getElementById('bpm').addEventListener('change', (e) => this.bpm = parseInt(e.value));
        document.getElementById('snap').addEventListener('change', (e) => this.snap = parseInt(e.value));
        document.getElementById('save-chart').addEventListener('click', () => this.saveChart());
        document.getElementById('load-chart').addEventListener('change', (e) => this.loadChart(e.target.files[0]));
        
        document.addEventListener('keydown', (e) => {
            const keyMap = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
            if (keyMap.hasOwnProperty(e.key.toLowerCase())) {
                this.placeNote(keyMap[e.key.toLowerCase()]);
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.deleteSelectedNotes();
            }
        });

        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }

    async loadAudio(file) {
        const arrayBuffer = await file.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.currentSongTitle = file.name.replace(/\.[^/.]+$/, "");
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        if (!this.audioBuffer) return;
        
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.connect(this.audioContext.destination);
        
        this.startTime = this.audioContext.currentTime - this.currentTime;
        this.audioSource.start(0, this.currentTime);
        this.isPlaying = true;
        
        this.animationFrame = requestAnimationFrame(() => this.updatePlayback());
    }

    stopPlayback() {
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource = null;
        }
        this.isPlaying = false;
        cancelAnimationFrame(this.animationFrame);
    }

    updatePlayback() {
        if (!this.isPlaying) return;
        
        this.currentTime = this.audioContext.currentTime - this.startTime;
        this.scrollTimeline();
        this.draw();
        this.updateTimeDisplay();
        
        this.animationFrame = requestAnimationFrame(() => this.updatePlayback());
    }

    scrollTimeline() {
        const scrollOffset = (this.currentTime * this.canvas.width / 8) - (this.canvas.width / 4);
        this.timelineOffset = -Math.max(0, scrollOffset);
    }

    placeNote(lane) {
        this.timeline.push({
            time: this.currentTime,
            lane: lane,
            selected: false
        });
        
        this.timeline.sort((a, b) => a.time - b.time);
        this.draw();
        this.updateNoteCount();
    }

    deleteSelectedNotes() {
        this.timeline = this.timeline.filter(note => !note.selected);
        this.selectedNotes.clear();
        this.draw();
        this.updateNoteCount();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawNotes();
        this.drawPlayhead();
    }

    drawGrid() {
        const gridSize = this.canvas.width / 32;
        this.ctx.save();
        this.ctx.translate(this.timelineOffset || 0, 0);
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= this.canvas.width * 4; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        const laneHeight = this.canvas.height / 4;
        for (let y = 0; y <= this.canvas.height; y += laneHeight) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width * 4, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawNotes() {
        const laneHeight = this.canvas.height / 4;
        const noteWidth = 20;

        this.ctx.save();
        this.ctx.translate(this.timelineOffset || 0, 0);
        
        this.timeline.forEach(note => {
            const x = (note.time * this.canvas.width / 8) - noteWidth / 2;
            const y = note.lane * laneHeight;
            
            this.ctx.fillStyle = note.selected ? '#FF5555' : '#6C63FF';
            this.ctx.fillRect(x, y, noteWidth, laneHeight);
        });
        
        this.ctx.restore();
    }

    drawPlayhead() {
        const x = (this.currentTime * this.canvas.width / 8) + (this.timelineOffset || 0);
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
    }

    updateTimeDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = Math.floor(this.currentTime % 60);
        document.getElementById('current-time').textContent = 
            `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updateNoteCount() {
        document.getElementById('note-count').textContent = 
            `Notes: ${this.timeline.length}`;
    }

    saveChart() {
        const chartData = {
            bpm: this.bpm,
            notes: this.timeline,
            songTitle: this.currentSongTitle || 'Untitled'
        };
        
        const blob = new Blob([JSON.stringify(chartData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chartData.songTitle}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async loadChart(file) {
        const text = await file.text();
        const chartData = JSON.parse(text);
        this.timeline = chartData.notes;
        this.bpm = chartData.bpm;
        document.getElementById('bpm').value = this.bpm;
        this.draw();
        this.updateNoteCount();
    }
}

updateMenuSelection();
