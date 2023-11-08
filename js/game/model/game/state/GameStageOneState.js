var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import GameBaseState from './GameBaseState.js';
import Game from '../Game.js';
import GameSettings from '../../../constants.js';
import { assetLoader } from '../../../helper/assets/assetLoader.js';
import Navbar from '../../htmlElements/Navbar.js';
import AssetManager from '../../utility/AssetManager.js';
export default class GameStageOneState extends GameBaseState {
    enterState(game) {
        return __awaiter(this, void 0, void 0, function* () {
            Navbar.close();
            game.toggleFullscreen(true);
            game.stage = 1;
            yield this.stageInitializer(game);
            const { audio, player } = game;
            player.switchState(player.spawnState);
            audio.playAudio('forest_stage/background.ogg', null, true);
        });
    }
    updateState(game) {
        super.updateState(game);
        game.pauseHandler();
        game.mapGenerator.update();
        const { ctx, camera, player, elevators, interactablesManager } = game;
        ctx.clearRect(camera.position.x, camera.position.y, game.canvas.width * 2, game.canvas.height * 2);
        ctx.fillStyle = '#000000';
        ctx.fillRect(camera.position.x, camera.position.y, game.canvas.width * 2, game.canvas.height * 3);
        camera.shakeCamera();
        elevators.forEach((elevator) => {
            elevator.update();
        });
        if (player.currState === player.inElevatorState) {
            player.updateState([]);
        }
        game.setTransparency(game.backgroundOpacity);
        camera.renderLowerBackground();
        game.setTransparency(1);
        if (this.checkCounter(1)) {
            game.particlesFactory.generateFireflies(1000, 3, 0.25, game.player.centerPosition, game.ctx);
            this.resetCounter();
        }
        game.setTransparency(game.backgroundOpacity);
        camera.renderTopBackground();
        game.setTransparency(1);
        camera.updateCamera();
        camera.resetShakeCamera();
        game.particlesManager.update();
        const validInteractable = interactablesManager.detectInteractable(game.player.centerPosition);
        player.interactionBar.detectPlayerInteraction(validInteractable);
        player.interactionBar.drawBar();
        game.drawHUD();
        this.handleStageChange(game);
    }
    handleStageChange(game) {
        const { player, backgroundOpacity } = Game.getInstance();
        // if (player.currState?.isBelowGround && backgroundOpacity === 0) {
        //     game.switchState(game.stageTwoState);
        // }
    }
    stageInitializer(game) {
        return __awaiter(this, void 0, void 0, function* () {
            $('#menu-modal').css('display', 'none');
            const { camera, player, htmlHandlers } = game;
            game.keys = [];
            game.clicks = [];
            yield AssetManager.assetLoader([GameSettings.ASSETS.STAGE_ONE, GameSettings.ASSETS.PLAYER, GameSettings.ASSETS.PLAYER]);
            yield assetLoader([GameSettings.ASSETS.STAGE_ONE, GameSettings.ASSETS.PLAYER, GameSettings.ASSETS.PLAYER], htmlHandlers);
            game.mapGenerator.init();
            camera.init();
            player.centerPosition = {
                x: 512 + player.width / 2,
                y: 512 + player.height / 2,
            };
            game.prepareCanvas();
            camera.setCameraPosition({
                position: game.player.centerPosition,
            });
        });
    }
}
