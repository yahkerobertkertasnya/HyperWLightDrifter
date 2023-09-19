import PlayerBaseState from './PlayerBaseState.js';
import { getImage } from '../../../helper/imageLoader.js';
import GameSettings from '../../../constants.js';
import { drawImage } from '../../../helper/renderer/drawer.js';
import Game from "../../Game/Game.js";

export default class PlayerInElevatorState extends PlayerBaseState {
    isBelowGround = false;
    initialPosition = {};

    enterState(currPlayer) {
        currPlayer.direction.x = 0;
        currPlayer.direction.y = 0;
        this.initialPosition = { ...currPlayer.centerPosition };
    }

    updateState(currPlayer) {
        if (currPlayer.centerPosition.y - this.initialPosition.y > 10) {
            this.isBelowGround = true;
        }

        if(currPlayer.centerPosition.y - this.initialPosition.y > 200) {
            Game.getInstance().darkenBackground(0.01);
        }
    }

    drawImage(currPlayer) {
        const moveDown = getImage('idle_down');

        drawImage({
            img: moveDown,
            x: currPlayer.centerPosition.x,
            y: currPlayer.centerPosition.y,
            width: moveDown.width * GameSettings.GAME.GAME_SCALE,
            height: moveDown.height * GameSettings.GAME.GAME_SCALE,
            translate: true,
        });
    }
    exitState(currPlayer) {
        this.isBelowGround = false;
    }
}