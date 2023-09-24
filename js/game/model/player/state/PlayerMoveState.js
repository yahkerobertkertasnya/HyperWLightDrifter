import PlayerBaseState from './PlayerBaseState.js';
import { getMoveDirection } from '../../../helper/collision/directionHandler.js';
import Game from '../../Game/Game.js';
import { getNumberedImage } from '../../../helper/imageLoader.js';
import { drawImage } from '../../../helper/renderer/drawer.js';
import GameSettings from '../../../constants.js';
import { getRandomValue } from '../../../helper/randomHelper.js';

export default class PlayerMoveState extends PlayerBaseState {
    enterState(currPlayer) {

    }

    updateState(currPlayer) {
        super.updateState(currPlayer);

        this.advanceAnimationStage(4, 12);

        if (this.animationStage % 6 === 0) {
            const randomValue = getRandomValue({
                initialValue: 1,
                randomValue: 2,
                rounded: true,
            });

            const { audio } = Game.getInstance();
            audio.playAudio('player/footstep_forest.wav', randomValue);
        }

        currPlayer.regenerateStamina();

        const { direction, playerDirection } = getMoveDirection({
            currPlayer: currPlayer,
        });

        this.direction = direction;

        currPlayer.velocity = playerDirection;

        if (direction) {
            currPlayer.lastDirection = direction;
        }

        currPlayer.handleSwitchState({
            move: true,
            attackOne: true,
            dash: true,
            aim: true,
            throws: true,
        });
    }

    drawImage(currPlayer) {
        let moveImage = null;
        if (this.direction === 'w') {
            moveImage = getNumberedImage('move_up', this.animationStage);
        }
        if (this.direction === 'a') {
            moveImage = getNumberedImage('move_left', this.animationStage);
        }
        if (this.direction === 's') {
            moveImage = getNumberedImage('move_down', this.animationStage);
        }
        if (this.direction === 'd') {
            moveImage = getNumberedImage('move_right', this.animationStage);
        }

        if (moveImage === null) {
            return;
        }

        drawImage({
            img: moveImage,
            x: currPlayer.centerPosition.x,
            y: currPlayer.centerPosition.y,
            width: moveImage.width * GameSettings.GAME.GAME_SCALE,
            height: moveImage.height * GameSettings.GAME.GAME_SCALE,
            translate: true,
        });
    }
}
