import PlayerBaseState from './PlayerBaseState.js';
import { get_image } from '../../../helper/fileReader.js';
import { getMouseDirection } from '../../../helper/collision/directionHandler.js';
import Game from '../../Game.js';
import { drawMirroredY } from '../../../helper/renderer/drawer.js';
import getEntityOnAttack from '../../../helper/player/getEntityOnAttack.js';

const scale = 2;

export default class PlayerAttackState extends PlayerBaseState {
    reversed = false;
    number = 1;
    attackNumber = 1;

    enterState(currPlayer) {
        const angle = currPlayer.lookAngle;
        currPlayer.direction.x = Math.cos(angle) * currPlayer.attackMoveSpeed;
        currPlayer.direction.y = Math.sin(angle) * currPlayer.attackMoveSpeed;

        const direction = getMouseDirection({ angle });
        this.direction = direction;
        currPlayer.lastDirection = direction;

        currPlayer.getHitbox({
            direction: this.direction,
        });

        getEntityOnAttack({
            player: currPlayer,
        });

        Game.getInstance().clicks.splice(Game.getInstance().clicks.indexOf('left'), 1);
    }

    exitState(currPlayer) {
        this.direction = '';
        this.attackNumber = 1;
        currPlayer.reversed = !currPlayer.reversed;
        currPlayer.combo = false;
    }

    updateState(currPlayer) {
        this.number++;

        currPlayer.getHitbox({
            direction: this.direction,
        });

        if (Game.getInstance().clicks.includes('left')) {
            currPlayer.combo = true;
        }
        if (this.direction === 'a' || this.direction === 'd') {
            this.attackSideTiming(currPlayer);
            return;
        }
        if (this.direction === 'w' || this.direction === 's') {
            this.attackVerticalTiming(currPlayer);
        }
    }

    drawImage(currPlayer) {
        if (Game.getInstance().debug) {
            currPlayer.canvas.fillStyle = 'red';
            currPlayer.canvas.fillRect(currPlayer.attackBox.x, currPlayer.attackBox.y, currPlayer.attackBox.w, currPlayer.attackBox.h);
        }

        if (this.direction === 'w') {
            if (currPlayer.reversed) {
                get_image('player/attack', 'attack_up', this.attackNumber, function (img) {
                    drawMirroredY({
                        canvas: currPlayer.canvas,
                        img: img,
                        position: {
                            x: currPlayer.position.x - 45,
                            y: currPlayer.position.y - 40,
                        },
                    });
                });
                return;
            }
            get_image('player/attack', 'attack_up', this.attackNumber, function (img) {
                currPlayer.canvas.drawImage(img, currPlayer.position.x - 50, currPlayer.position.y - 40, img.width * scale, img.height * scale);
            });
            return;
        }
        if (this.direction === 'a') {
            get_image('player/attack', 'attack_side', this.attackNumber, function (img) {
                currPlayer.canvas.save();
                currPlayer.canvas?.translate(img.width * scale, 0);
                currPlayer.canvas.scale(-1, 1);
                currPlayer.canvas.drawImage(img, -(currPlayer.position.x - 50), currPlayer.position.y - 30, img.width * scale, img.height * scale);
                currPlayer.canvas.restore();
            });
            return;
        }
        if (this.direction === 'd') {
            get_image('player/attack', 'attack_side', this.attackNumber, function (img) {
                currPlayer.canvas.drawImage(img, currPlayer.position.x - 40, currPlayer.position.y - 30, img.width * scale, img.height * scale);
            });
            return;
        }
        if (this.direction === 's') {
            if (currPlayer.reversed) {
                get_image('player/attack', 'attack_bottom', this.attackNumber, function (img) {
                    currPlayer.canvas.save();
                    currPlayer.canvas?.translate(img.width * scale, 0);
                    currPlayer.canvas.scale(-1, 1);
                    currPlayer.canvas.drawImage(img, -(currPlayer.position.x - 50), currPlayer.position.y - 30, img.width * scale, img.height * scale);
                    currPlayer.canvas.restore();
                });
                return;
            }
            get_image('player/attack', 'attack_bottom', this.attackNumber, function (img) {
                currPlayer.canvas.drawImage(img, currPlayer.position.x - 50, currPlayer.position.y - 30, img.width * scale, img.height * scale);
            });
        }
    }

    attackSideTiming(currPlayer) {
        if (this.number === 4 && this.attackNumber === 1) {
            this.number = 0;
            this.attackNumber += 1;
            return;
        }
        if (this.number === 2 && this.attackNumber < 4) {
            this.number = 0;
            this.attackNumber += 1;
            return;
        }
        if (this.number === 4 && this.attackNumber < 8) {
            this.number = 0;
            this.attackNumber += 1;
        }
        if (this.attackNumber === 8) {
            if (currPlayer.combo) {
                currPlayer.switchState(currPlayer.attackTwoState);
                return;
            }
            if (Game.getInstance().keys.length > 0) {
                currPlayer.switchState(currPlayer.moveState);
                return;
            }
            currPlayer.switchState(currPlayer.idleState);
        }
    }

    attackVerticalTiming(currPlayer) {
        if (this.number === 2 && this.attackNumber < 2) {
            this.number = 0;
            this.attackNumber += 1;
            return;
        }
        if (this.number === 4 && this.attackNumber < 7) {
            this.number = 0;
            this.attackNumber += 1;
        }
        if (this.attackNumber === 7) {
            currPlayer.handleSwitchState({
                move: true,
                attackTwo: true,
                dash: true,
                aim: true,
            });
        }
    }
}
