import PlayerBaseState from './PlayerBaseState.js';
import { getMouseDirection } from '../../../helper/collision/directionHandler.js';
import playerDashDrawer from '../../../helper/renderer/playerDashDrawer.js';
import Game from '../../game/Game.js';
import { getHorizontalValue, getVerticalValue } from '../../../helper/distanceHelper.js';
import { Vector } from '../../utility/enums/Vector.js';
import Player from '../Player.js';
import { DashData } from '../../utility/enums/DashData.js';

export default class PlayerDashState extends PlayerBaseState {
    private lastData: DashData[] = [];
    private lastPosition: Vector;
    private direction: string;
    private angle: number;
    private finished: boolean;

    public constructor() {
        super();
        this.lastPosition = Vector.Zero();
        this.direction = '';
        this.angle = 0;
        this.finished = false;
    }

    enterState(currPlayer: Player) {
        super.enterState(currPlayer);
        this.angle = currPlayer.lookAngle;

        const direction = getMouseDirection({ angle: this.angle });
        this.direction = direction;
        this.lastPosition = { ...currPlayer.centerPosition };
        this.finished = false;

        currPlayer.lastDirection = direction;
        currPlayer.stamina -= 20;

        const { audio } = Game.getInstance();
        audio.playAudio('player/dash.wav');
    }

    updateState(currPlayer: Player) {
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

    drawImage(currPlayer: Player) {
        this.lastData.forEach((data) => {
            Game.getInstance().setFilter('brightness(50%) hue-rotate(200deg)');
            playerDashDrawer(data);
            Game.getInstance().setFilter('none');
        });

        const data = this.generateDashData(currPlayer);
        playerDashDrawer(data);

        if (this.lastData.length > 4) {
            this.lastData.shift();
        }
        if (this.animationStage % 3 === 0 && this.number <= 1 && !this.finished) {
            this.lastData.push(data);
        }
    }

    exitState(currPlayer: Player) {
        this.number = 1;
        this.animationStage = 1;
        this.lastData = [];
    }

    private generateDashData(currPlayer: Player): DashData {
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

    private dashTiming(currPlayer: Player) {
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
