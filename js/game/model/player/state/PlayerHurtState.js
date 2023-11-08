import PlayerBaseState from './PlayerBaseState.js';
import { drawImage } from '../../../helper/renderer/drawer.js';
import GameSettings from '../../../constants.js';
import { getMoveDirection } from '../../../helper/collision/directionHandler.js';
import { getRandomBoolean } from '../../../helper/randomHelper.js';
import Game from '../../game/Game.js';
import AssetManager from '../../utility/AssetManager.js';
export default class PlayerHurtState extends PlayerBaseState {
    constructor() {
        super();
        this.mirrored = false;
    }
    enterState(currPlayer) {
        super.enterState(currPlayer);
        this.mirrored = this.mirroredHandler(currPlayer);
        const { audio } = Game.getInstance();
        audio.playAudio('player/hurt.wav');
    }
    updateState(currPlayer) {
        super.updateState(currPlayer);
        this.advanceAnimationStage(10);
        if (this.animationStage >= 4) {
            currPlayer.handleSwitchState({
                move: true,
                attackOne: true,
                dash: true,
                aim: true,
                throws: true,
            });
        }
    }
    drawImage(currPlayer) {
        const playerHurt = AssetManager.getNumberedImage('player_hurt', this.animationStage);
        drawImage({
            img: playerHurt,
            x: currPlayer.centerPosition.x,
            y: currPlayer.centerPosition.y,
            width: playerHurt.width * GameSettings.GAME.GAME_SCALE,
            height: playerHurt.height * GameSettings.GAME.GAME_SCALE,
            translate: true,
            mirrored: this.mirrored,
        });
    }
    mirroredHandler(currPlayer) {
        const { direction } = getMoveDirection({ currPlayer });
        if (direction === 'w' || direction === 's' || direction === '') {
            return getRandomBoolean(0.5);
        }
        return direction === 'a';
    }
}
