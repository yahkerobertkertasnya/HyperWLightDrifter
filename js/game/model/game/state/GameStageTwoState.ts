import GameBaseState from './GameBaseState.js';
import GameSettings from '../../../constants.js';
import Collider from '../../collideable/Collider.js';
import AssetManager from '../../utility/manager/AssetManager.js';
import Game from '../Game.js';
import AudioManager from '../../utility/manager/AudioManager.js';
import { Vector } from '../../utility/interfaces/Vector.js';

const colliders = [
    { x: 100, y: 0, width: 370, height: 1000 },
    { x: 470, y: 0, width: 995, height: 350 },
    { x: 1465, y: 0, width: 300, height: 1000 },
    { x: 100, y: 1000, width: 1664, height: 500 },
];
export default class GameStageTwoState extends GameBaseState {
    private hasInitialized: boolean;
    private colliders: Collider[];
    private hasBossSpawned: boolean;

    constructor() {
        super();
        this.hasInitialized = false;
        this.colliders = [];
        this.hasBossSpawned = false;
    }

    public async enterState(game: Game) {
        this.hasInitialized = false;
        this.colliders = [];
        AudioManager.stopAll();
        game.stage = 2;
        await this.stageInitializer(game);
        this.hasBossSpawned = false;
        this.hasInitialized = true;
    }

    public updateState(game: Game) {
        if (!this.hasInitialized) {
            return;
        }
        const { camera, player, enemyManager, backgroundOpacity, elevator } = game;

        if (player.currState === player.inElevatorState && player.isBelowGround) {
            game.brightenBackground();

            if (backgroundOpacity === 1) {
                // player.switchState(player.idleState);
            }
        }

        if (elevator!.currState === elevator!.mountedDownState && !this.hasBossSpawned) {
            game.enemyManager.enemyFactory.generateBoss(new Vector(1000, 300));
            this.hasBossSpawned = true;
        }

        game.ctx.clearRect(0, 0, game.canvas.width * 2, game.canvas.height * 3);
        game.ctx.fillStyle = '#000000';
        game.ctx.fillRect(0, 0, game.canvas.width * 2, game.canvas.height * 3);
        camera.shakeCamera();

        if (elevator!.currState === elevator!.mountedDownState) {
            game.setTransparency(game.backgroundOpacity);
            elevator?.update();
            game.setTransparency(1);
        }
        game.setTransparency(game.backgroundOpacity);
        camera.renderLowerBackground();
        game.setTransparency(1);

        if (elevator!.currState === elevator!.moveState) {
            elevator?.update();
        }

        if (!enemyManager.boss || !enemyManager.boss.isDead()) {
            player.updateState(this.colliders);
        }

        game.drawHUD();
        enemyManager.updateBoss();

        enemyManager.updateBossEntities();

        camera.resetShakeCamera();
        camera.updateCamera();
    }

    public async stageInitializer(game: Game) {
        game.prepareCanvas();
        game.changeState();

        await AssetManager.assetLoader([GameSettings.ASSETS.STAGE_TWO, GameSettings.ASSETS.PLAYER], game.player.outfit);

        const { camera, player, elevator, enemyManager } = game;

        enemyManager.clearEntities();

        const mapGround = AssetManager.getImage('map_ground_second');

        camera.init(new Map().set('0,0', mapGround));

        colliders.forEach((collider) => {
            this.colliders.push(new Collider(collider));
        });

        elevator!.changeStage();
        const oldYPosition = player.centerPosition.y;

        elevator!.position.x = 970;
        player.centerPosition.x = 960;

        camera.switchState(camera.followState);

        camera.setCameraPosition({
            position: {
                x: player.centerPosition.x,
                y: 320,
            },
        });

        const yDiff = oldYPosition - elevator!.position.y;
        elevator!.position.y = 0;
        player.centerPosition.y = yDiff;
    }
}
