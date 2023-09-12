import JudgementBaseState from './JudgementBaseState.js';
import Game from '../../../Game/Game.js';
import JudgementLaser from '../JudgementLaser.js';
import { drawImage, drawMirroredY } from '../../../../helper/renderer/drawer.js';
import { getNumberedImage } from '../../../../helper/imageLoader.js';
import { getFaceDirection } from '../../../../helper/collision/directionHandler.js';
import GameSettings from '../../../../constants.js';
import { getAngle } from '../../../../helper/angleHelper.js';

export default class JudgementLaserState extends JudgementBaseState {
    enterState(currJudgement) {
        this.number = 0;
        this.animationStage = 1;

        this.maxAttackCount = 1;

        this.attackCount = 0;
        this.attacking = 5;

        this.attackAngle = currJudgement.angle;
    }

    updateState(currJudgement) {
        this.number += 1;

        if (this.number % 15 === 0) {
            this.animationStage += 1;
        }

        if (this.animationStage === 7) {
            const { player } = Game.getInstance();

            this.attackAngle = getAngle({
                x: player.centerPosition.x - currJudgement.position.x,
                y: player.centerPosition.y - (currJudgement.position.y + 40),
            });

            currJudgement.angle = this.attackAngle;
        }

        if (this.attacking !== 5 && this.animationStage < 12) {
            let offset = 60;
            if (getFaceDirection(currJudgement.angle) === 'left') {
                offset = -60;
            }
            JudgementLaser.generate({
                x: currJudgement.position.x + offset,
                y: currJudgement.position.y + 60,
                angle: this.getAttackAngle(currJudgement.angle),
            });
        }

        if (this.animationStage === 8 && this.number % 14 === 0) {
            this.attacking -= 1;
        }
        if (this.animationStage === 12 && this.attacking > 0) {
            this.animationStage -= 4;
        }
        if (this.animationStage === 13) {
            currJudgement.switchState(currJudgement.moveState);
        }
    }

    drawImage(currJudgement) {
        const judgementLaser = getNumberedImage('judgement_laser', (this.animationStage % 13) + 1);

        if (getFaceDirection(currJudgement.angle) === 'left') {
            drawMirroredY({
                img: judgementLaser,
                position: {
                    x: currJudgement.position.x,
                    y: currJudgement.position.y,
                },
                width: judgementLaser.width * GameSettings.GAME.GAME_SCALE,
                height: judgementLaser.height * GameSettings.GAME.GAME_SCALE,
                translate: true,
            });
        } else {
            drawImage({
                img: judgementLaser,
                x: currJudgement.position.x,
                y: currJudgement.position.y,
                width: judgementLaser.width * GameSettings.GAME.GAME_SCALE,
                height: judgementLaser.height * GameSettings.GAME.GAME_SCALE,
                translate: true,
            });
        }
    }

    getAttackAngle(angle) {
        return angle + (Math.random() - 0.5) * 0.25 + Math.sin(this.number * 0.05) * 0.5;
    }
}