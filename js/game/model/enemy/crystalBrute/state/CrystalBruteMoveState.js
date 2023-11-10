import CrystalBruteBaseState from './CrystalBruteBaseState.js';
import Game from '../../../game/Game.js';
import AssetManager from '../../../utility/manager/AssetManager.js';
import DirectionHelper from '../../../utility/helper/DirectionHelper.js';
import RandomHelper from '../../../utility/helper/RandomHelper.js';
import AudioManager from '../../../utility/manager/AudioManager.js';
import DistanceHelper from '../../../utility/helper/DistanceHelper.js';
import { PolarVector } from '../../../utility/interfaces/PolarVector.js';
import AngleHelper from '../../../utility/helper/AngleHelper.js';
import { Box } from '../../../utility/interfaces/Box.js';
import DrawHelper from '../../../utility/helper/DrawHelper.js';
import GameSettings from '../../../../constants.js';
export default class CrystalBruteMoveState extends CrystalBruteBaseState {
    constructor() {
        super(...arguments);
        this.clockwise = true;
        this.moveTime = 0;
        this.attackDelay = 0;
    }
    enterState(currBrute) {
        this.clockwise = RandomHelper.getRandomBoolean(0.5);
        this.moveTime = 0;
        this.attackDelay = RandomHelper.randomValue(100, 100);
        currBrute.speed = 0.5;
    }
    updateState(currBrute) {
        super.updateState(currBrute);
        this.moveTime += Game.deltaTime;
        this.advanceAnimationStage(20, 6);
        if (this.checkCounter(20) && (this.animationStage === 0 || this.animationStage === 3)) {
            AudioManager.playAudio('enemy/crystal_brute/walk.wav');
        }
        if (currBrute.health <= 0) {
            currBrute.switchState(currBrute.dieState);
            return;
        }
        if (this.moveTime > this.attackDelay) {
            currBrute.switchState(currBrute.attackState);
            return;
        }
        this.handleMovement(currBrute);
    }
    drawImage(currBrute) {
        const bruteWalk = AssetManager.getNumberedImage('crystal_brute_walk', this.animationStage);
        const imageSize = Box.parse({
            x: currBrute.position.x,
            y: currBrute.position.y,
            w: bruteWalk.width * GameSettings.GAME.GAME_SCALE,
            h: bruteWalk.height * GameSettings.GAME.GAME_SCALE,
        });
        DrawHelper.drawImage(bruteWalk, imageSize, true, DirectionHelper.getFaceDirection(currBrute.angle) === 'left');
    }
    handleMovement(currBrute) {
        const { player } = Game.getInstance();
        const { centerPosition } = player;
        const distance = DistanceHelper.getMagnitude({
            x: centerPosition.x - currBrute.position.x,
            y: centerPosition.y - currBrute.position.y,
        });
        let angle = AngleHelper.getAngle({
            x: centerPosition.x - currBrute.position.x,
            y: centerPosition.y - currBrute.position.y,
        });
        currBrute.angle = angle;
        if (distance > 750) {
            currBrute.switchState(currBrute.idleState);
            return;
        }
        if (distance < 200) {
            angle = this.getRotateAngle(currBrute.angle);
        }
        const pVector = new PolarVector(currBrute.speed * Game.deltaTime, angle);
        currBrute.position.x += DistanceHelper.getHorizontalValue(pVector);
        currBrute.position.y += DistanceHelper.getVerticalValue(pVector);
    }
    getRotateAngle(angle) {
        return angle + (Math.PI / 2) * (this.clockwise ? 1 : -1);
    }
}
