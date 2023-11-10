import JudgementBaseState from './JudgementBaseState.js';
import GameSettings from '../../../../constants.js';
import Game from '../../../game/Game.js';
import AssetManager from '../../../utility/manager/AssetManager.js';
import DirectionHelper from '../../../utility/helper/DirectionHelper.js';
import AudioManager from '../../../utility/manager/AudioManager.js';
import { Box } from '../../../utility/interfaces/Box.js';
import DrawHelper from '../../../utility/helper/DrawHelper.js';
export default class JudgementDeathState extends JudgementBaseState {
    constructor() {
        super();
        this.playedAudio = false;
        this.mirrored = false;
        this.deadTime = 0;
    }
    updateState(currJudgement) {
        super.updateState(currJudgement);
        this.advanceAnimationStage(5);
        const { currState, endState, backgroundOpacity } = Game.getInstance();
        if (this.animationStage >= 21) {
            this.deadTime += Game.deltaTime;
            this.animationStage = 21;
        }
        if (this.deadTime >= 0 && !this.playedAudio) {
            AudioManager.playAudio('boss/death.wav');
            this.playedAudio = true;
        }
        if (this.deadTime > 100) {
            Game.getInstance().darkenBackground(0.005 * Game.deltaTime);
        }
        if (backgroundOpacity <= 0.01 && currState !== endState) {
            Game.getInstance().switchState(endState);
        }
    }
    drawImage(currJudgement) {
        const judgementDeath = AssetManager.getNumberedImage('judgement_death', this.animationStage);
        const imageSize = Box.parse({
            x: currJudgement.position.x,
            y: currJudgement.position.y,
            w: judgementDeath.width * GameSettings.GAME.GAME_SCALE,
            h: judgementDeath.height * GameSettings.GAME.GAME_SCALE,
        });
        DrawHelper.drawImage(judgementDeath, imageSize, true, this.mirrored);
    }
    enterState(currJudgement) {
        super.enterState(currJudgement);
        this.playedAudio = false;
        this.mirrored = DirectionHelper.getFaceDirection(currJudgement.angle) === 'left';
        this.deadTime = 0;
        // const { camera, player } = game.getInstance();
        // const x = currJudgement.position.x - player.centerPosition.x;
        // const y = currJudgement.position.y - player.centerPosition.y;
    }
}
