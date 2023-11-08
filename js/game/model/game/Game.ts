import Player from '../player/Player.js';
import Camera from '../camera/Camera.js';
import hudHandler from '../../ui/hudHandler.js';
import GameSettings from '../../constants.js';
import EnemyManager from '../enemy/EnemyManager.js';
import GameStartState from './state/GameStartState.js';
import GameStageOneState from './state/GameStageOneState.js';
import GameStageTwoState from './state/GameStageTwoState.js';
import GamePausedState from './state/GamePausedState.js';
import GameBaseState from './state/GameBaseState.js';
import AudioPlayer from '../../../audio/AudioPlayer.js';
import GameLoseState from './state/GameLoseState.js';
import MapGenerator from '../map/MapGenerator.js';
import GameEndState from './state/GameEndState.js';
import { getImage } from '../../helper/assets/assetGetter.js';
import HTMLHandlers from '../htmlElements/HTMLHandlers.js';
import ParticlesManager from '../particles/ParticlesManager.js';
import InteractablesFactory from '../interactables/InteractablesFactory.js';
import CheatCodeManager from '../utility/CheatCodeManager.js';
import InputManager from '../utility/InputManager.js';
import AssetManager from '../utility/AssetManager.js';
import ParticlesFactory from '../particles/ParticlesFactory.js';
import InteractablesManager from '../interactables/InteractablesManager.js';
import SetPiece from '../map/setPieces/SetPiece';

export default class Game {
    public static instance: Game | null = null;
    public deltaTime: number;
    public stage: number;
    public movementDeltaTime: number;
    public showFPS: boolean;
    public fpsShowCounter: number;
    public fps: number;
    public loading: boolean;
    public player!: Player;
    public width: number;
    public height: number;
    public keys: string[];
    public clicks: string[];
    public objects: Map<string, SetPiece>;
    public coins: any[];
    public elevators: any[];
    public elevator: any;
    public enemyManager!: EnemyManager;
    public canvas!: HTMLCanvasElement;
    public ctx!: CanvasRenderingContext2D;
    public debug: boolean;
    public backgroundOpacity: number;
    public keyCount: number;
    public audio: AudioPlayer;
    public currState: any;
    public startState: any;
    public stageOneState: any;
    public stageTwoState: any;
    public pausedState: any;
    public loseState: any;
    public endState: any;
    public renderCollider: boolean;
    public interactablesManager!: InteractablesManager;
    public interactablesFactory!: InteractablesFactory;
    public htmlHandlers: HTMLHandlers;
    public mapGenerator!: MapGenerator;
    public cheatCodeManager!: CheatCodeManager;
    public inputManager!: InputManager;
    public HUD!: CanvasRenderingContext2D;
    public camera!: Camera;
    public particlesManager!: ParticlesManager;
    public particlesFactory!: ParticlesFactory;

    constructor() {
        this.stage = 1;
        this.deltaTime = 0;
        this.movementDeltaTime = 0;
        this.showFPS = false;
        this.fpsShowCounter = 0;
        this.fps = 60;
        this.loading = false;
        this.width = GameSettings.game.SCREEN_WIDTH;
        this.height = GameSettings.game.SCREEN_HEIGHT;
        this.keys = [];
        this.clicks = [];
        this.objects = new Map();
        this.coins = [];
        this.elevators = [];
        this.elevator = null;
        this.debug = true;
        this.backgroundOpacity = 1;
        this.keyCount = 0;
        this.audio = AudioPlayer.getInstance();
        this.currState = new GameBaseState();
        this.startState = new GameStartState();
        this.stageOneState = new GameStageOneState();
        this.stageTwoState = new GameStageTwoState();
        this.pausedState = new GamePausedState();
        this.loseState = new GameLoseState();
        this.endState = new GameEndState();
        this.renderCollider = false;
        this.htmlHandlers = new HTMLHandlers(this);
    }

    static getInstance() {
        if (Game.instance == null) {
            Game.instance = new Game();
        }
        return Game.instance;
    }

    changeState() {
        this.objects.clear();
        this.ctx!.fillStyle = '#000000';
        this.ctx!.fillRect(0, 0, this.canvas!.width, this.canvas!.height * 2);
    }

    async init() {
        this.keyCount = 0;
        this.camera = new Camera();
        this.inputManager = new InputManager(this);
        this.player = new Player(this.inputManager.eventEmitter);
        this.enemyManager = new EnemyManager(this.player.attackObserver);
        this.interactablesManager = new InteractablesManager(this);
        this.interactablesFactory = this.interactablesManager.interactablesFactory;
        this.cheatCodeManager = new CheatCodeManager(this, this.inputManager.eventEmitter);
        this.mapGenerator = new MapGenerator(this);
        this.particlesManager = new ParticlesManager();
        this.particlesFactory = this.particlesManager.particleFactory;
        AssetManager.setHTMLHandler(this.htmlHandlers!);
    }

    async playGame() {
        this.loading = true;
        this.particlesManager!.clear();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.switchState(this.stageOneState);
        this.loading = false;
    }

    prepareCanvas() {
        const canvas = document.getElementById('game') as HTMLCanvasElement;
        this.canvas = canvas;

        this.ctx = canvas.getContext('2d')!;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.HUD = (document.getElementById('HUD') as HTMLCanvasElement).getContext('2d')!;
        this.HUD.setTransform(1, 0, 0, 1, 0, 0);
        this.configCanvas();
    }

    configCanvas() {
        this.ctx!.imageSmoothingEnabled = false;
        this.ctx!.scale(GameSettings.game.GAME_SCALE, GameSettings.game.GAME_SCALE);

        this.HUD!.imageSmoothingEnabled = false;
        this.HUD!.scale(GameSettings.game.GAME_SCALE, GameSettings.game.GAME_SCALE);
    }

    async switchState(nextState: GameBaseState) {
        await this.currState.exitState(this);
        this.currState = nextState;
        await this.currState.enterState(this);
    }

    update(deltaTime: number) {
        this.deltaTime = deltaTime * GameSettings.GAME.GAME_SPEED;
        this.movementDeltaTime = Math.cbrt(deltaTime * GameSettings.GAME.GAME_SPEED);
        if (this.loading) {
            return;
        }
        this.currState.updateState(this);
        this.fpsHandler();
    }

    toggleFullscreen(state: boolean) {
        if (state) {
            document.documentElement.requestFullscreen().then();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(); // Standard
            }
        }
    }

    pauseHandler() {
        if (this.keys.includes('p')) {
            this.switchState(this.pausedState).then();
        }
    }

    unpauseGame() {
        this.keys = [];
        this.clicks = [];
        if (this.stage === 1) {
            this.currState.exitState(this);
            this.currState = this.stageOneState;
        } else if (this.stage === 2) {
            this.currState.exitState(this);
            this.currState = this.stageTwoState;
        }
    }

    fpsHandler() {
        if (!this.showFPS) {
            return;
        }

        if (!this.deltaTime) return;
        this.fpsShowCounter += this.deltaTime;
        if (this.fpsShowCounter > 5) {
            this.fpsShowCounter = 0;
            this.fps = Math.round(60 / this.deltaTime);
        }

        this.HUD!.font = '25px Arial';
        this.HUD!.fillStyle = 'white';
        this.HUD!.textAlign = 'right';
        this.HUD!.fillText(String(this.fps), GameSettings.GAME.SCREEN_WIDTH / 2 - 5, 25);
    }

    drawHUD() {
        hudHandler({
            HUD: this.HUD,
            player: this.player,
            keyCount: this.keyCount,
        });

        if (this.player!.immunity >= 30) {
            return;
        }

        this.setTransparency(Math.sin(Math.abs(this.player!.immunity - 30) / 30));

        const damageUI = getImage('damaged_ui');
        this.ctx!.drawImage(damageUI, this.camera!.position.x, this.camera!.position.y, damageUI.width * GameSettings.GAME.GAME_SCALE, damageUI.height * GameSettings.GAME.GAME_SCALE);

        this.setTransparency(1);
    }

    darkenBackground(darken = 0.05) {
        this.backgroundOpacity -= darken;
        if (this.backgroundOpacity < darken) {
            this.backgroundOpacity = 0;
        }
    }

    brightenBackground(brighten = 0.05) {
        this.backgroundOpacity += brighten;
        if (this.backgroundOpacity > 1) {
            this.backgroundOpacity = 1;
        }
    }

    setTransparency(transparency: number, canvas = this.ctx) {
        if (transparency < 0) {
            transparency = 0;
        }
        canvas!.globalAlpha = transparency;
    }

    setFilter(filter: string) {
        this.ctx!.filter = filter;
    }
}
