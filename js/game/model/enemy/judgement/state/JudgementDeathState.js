import JudgementBaseState from './JudgementBaseState.js';
import { getNumberedImage } from '../../../../helper/imageLoader.js';
import { drawImage } from '../../../../helper/renderer/drawer.js';
import GameSettings from '../../../../constants.js';
import { getFaceDirection } from '../../../../helper/collision/directionHandler.js';
import Game from '../../../Game/Game.js';
import AudioPlayer from '../../../../../audio/AudioPlayer.js';

export default class JudgementDeathState extends JudgementBaseState {
    updateState(currJudgement) {
        this.number += 1;

        if (this.number % 5 === 0) {
            this.animationStage += 1;

            if (this.animationStage === 22) {
                this.animationStage = 21;
            }
        }

        if (this.animationStage === 21) {
            this.deadTime += 1;
        }

        if (this.deadTime === 100) {
            AudioPlayer.getInstance().playAudio('death.wav');
        }

        if (this.deadTime > 100 && this.number % 2 === 0) {
            Game.getInstance().darkenBackground(0.01);
        }
    }

    drawImage(currJudgement) {
        const judgementDeath = getNumberedImage('judgement_death', this.animationStage);

        drawImage({
            img: judgementDeath,
            x: currJudgement.position.x,
            y: currJudgement.position.y,
            width: judgementDeath.width * GameSettings.GAME.GAME_SCALE,
            height: judgementDeath.height * GameSettings.GAME.GAME_SCALE,
            translate: true,
            mirrored: this.mirrored,
        });
    }

    enterState(currJudgement) {
        this.number = 0;
        this.animationStage = 1;
        this.mirrored = getFaceDirection(currJudgement.angle) === 'left';
        this.deadTime = 0;

        const { camera, player } = Game.getInstance();
        const x = currJudgement.position.x - player.centerPosition.x;
        const y = currJudgement.position.y - player.centerPosition.y;

        camera.moveCameraPosition({
            direction: {
                x: -x * 0.05,
                y: -y * 0.05,
            },
        });
    }
}