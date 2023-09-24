import PlayerBaseState from './PlayerBaseState.js';
import { getMouseDirection } from '../../../helper/collision/directionHandler.js';
import playerDashDrawer from '../../../helper/renderer/playerDashDrawer.js';
import Game from '../../Game/Game.js';
import { getHorizontalValue, getVerticalValue } from '../../../helper/distanceHelper.js';

export default class PlayerDashState extends PlayerBaseState {
    lastData = [];

    enterState(currPlayer) {
        super.enterState(currPlayer);
        this.angle = currPlayer.lookAngle;

        const direction = getMouseDirection({ angle: this.angle });
        this.direction = direction;
        this.lastPosition = { ...currPlayer.centerPosition };
        this.finished = false;


        currPlayer.lastDirection = direction;
        currPlayer.stamina -= 10;

        const { audio } = Game.getInstance();
        audio.playAudio('player/dash.wav');
    }

    updateState(currPlayer) {
        super.updateState(currPlayer);

        this.dashTiming(currPlayer);
        if (this.checkCounter(4)) {
            return;
        }

        const { deltaTime } = Game.getInstance();

        currPlayer.velocity.x = getHorizontalValue({
            magnitude: currPlayer.dashMoveSpeed * deltaTime,
            angle: this.angle,
        });
        currPlayer.velocity.y = getVerticalValue({
            magnitude: currPlayer.dashMoveSpeed * deltaTime,
            angle: this.angle,
        });
    }

    drawImage(currPlayer) {
        this.lastData.forEach((data) => {
            Game.getInstance().setFilter('brightness(50%) hue-rotate(200deg)');
            playerDashDrawer(data);
            Game.getInstance().setFilter('none');
        });

        const data = this.generateDashData(currPlayer);
        playerDashDrawer(data);

        if (this.lastData.length > 2) {
            this.lastData.shift();
        }
        if (this.animationStage % 3 === 0 && this.number < 7 && !this.finished) {
            this.lastData.push(data);
        }
    }

    exitState(_currPlayer) {
        this.number = 1;
        this.animationStage = 1;
        this.lastData = [];
    }

    generateDashData(currPlayer) {
        return {
            currPosition: {
                x: currPlayer.centerPosition.x,
                y: currPlayer.centerPosition.y,
            },
            animationStage: this.animationStage,
            angle: this.angle,
            lastPosition: this.lastPosition,
            direction: this.direction,
        };
    }

    dashTiming(currPlayer) {
        this.advanceAnimationStage(2);
        this.animationStage = Math.min(this.animationStage, 11);

        if (this.animationStage >= 11) {
            this.finished = true;
            if (this.lastData.length > 0) {
                this.lastData.shift();
                return;
            }


            currPlayer.handleSwitchState({
                move: true,
                attackOne: true,
                dash: true,
                aim: true,
                throws: true,
            });
        }
    }
}
