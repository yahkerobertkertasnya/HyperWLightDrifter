import Game from '../Game/Game.js';
import { drawRotated } from '../../helper/renderer/drawer.js';
import { getRandomValue } from '../../helper/randomHelper.js';
import { getHorizontalValue, getMagnitudeValue, getVerticalValue } from '../../helper/distanceHelper.js';
import { getNumberedImage } from '../../helper/imageLoader.js';
import { getAngle } from '../../helper/angleHelper.js';
import CrystalBrute from '../enemy/crystalBrute/CrystalBrute.js';
import CrystalSpider from '../enemy/crystalSpider/CrystalSpider.js';
import Animateable from '../Animateable.js';
import GameSettings from '../../constants.js';

export default class Grenade extends Animateable {
    constructor({ x, y, w, h, angle, velocity }) {
        super();
        this.position = {
            x: x,
            y: y,
        };
        this.width = w;
        this.height = h;
        this.angle = angle;
        this.velocity = velocity;
        this.friction = 0.03;
        this.number = 0;
        this.animationStage = 1;
        this.rotationNumber = 0;
        this.rotation = getRandomValue({
            randomValue: Math.PI * 3,
        });
        this.playedAudio = false;
    }

    static generate({ x, y, angle }) {
        const newGrenade = new Grenade({
            x: x,
            y: y,
            w: 16,
            h: 16,
            angle: angle,
            velocity: 10,
        });

        Game.getInstance().player.projectiles.push(newGrenade);
    }

    update() {
        const { deltaTime } = Game.getInstance();
        if (deltaTime) {
            this.number += deltaTime;

            if (this.animationStage <= 2) {
                this.rotationNumber += deltaTime * 0.05;
            }
        }

        this.position.x += getHorizontalValue({
            magnitude: this.velocity * deltaTime,
            angle: this.angle,
        });

        this.position.y += getVerticalValue({
            magnitude: this.velocity * deltaTime,
            angle: this.angle,
        });

        this.velocity = this.velocity * (1 - this.friction * deltaTime);

        if (this.checkCounter(50) && this.animationStage === 1) {
            this.animationStage += 1;
            this.number = 0;
        }
        if (this.animationStage > 1) {
            this.advanceAnimationStage(2);
            this.velocity = 0;
        }

        const { player, audio } = Game.getInstance();
        const { projectiles } = player;

        if (!this.playedAudio && this.animationStage >= 2) {
            audio.playAudio('player/grenade/explode.wav');
            this.playedAudio = true;
            this.handleDamage();
        }

        if (this.animationStage >= 11) {
            projectiles.splice(projectiles.indexOf(this), 1);
            return;
        }

        this.render();
    }

    render() {
        const grenade = getNumberedImage('grenade', this.animationStage);

        drawRotated({
            img: grenade,
            position: {
                x: this.position.x + this.width / 2,
                y: this.position.y + this.height / 2,
            },
            angle: this.rotation + this.rotationNumber,
            mirrored: true,
        });
    }

    handleDamage() {
        const { audio, enemyManager, enemyList } = Game.getInstance();
        // const { enemyList, bossEntities, boss } = enemyManager;

        enemyList.forEach((enemy) => {
            if (enemy.currState === enemy.dieState) {
                return;
            }

            const distance = getMagnitudeValue({
                x: this.position.x - enemy.position.x,
                y: this.position.y - enemy.position.y,
            });

            const angle = getAngle({
                x: this.position.x - enemy.position.x,
                y: this.position.y - enemy.position.y,
            });

            if (distance >= 250) {
                return;
            }

            if (enemy instanceof CrystalSpider) {
                audio.playAudio('enemy/crystal_spider/hurt.wav');
            }

            if (enemy instanceof CrystalBrute) {
                audio.playAudio('enemy/crystal_brute/hurt.wav');
            }
            enemy.damage({
                amount: GameSettings.PLAYER.DAMAGE.GRENADE,
                angle: -angle,
            });
        });

        // bossEntities.forEach((entity) => {
        //     const distance = getMagnitudeValue({
        //         x: this.position.x - entity.position.x,
        //         y: this.position.y - entity.position.y,
        //     });
        //
        //
        //     if (distance >= 250) {
        //         return;
        //     }
        //
        //     entity.health -= GameSettings.PLAYER.DAMAGE.GRENADE;
        // });
        //
        // if (!boss) {
        //     return;
        // }
        //
        // const distance = getMagnitudeValue({
        //     x: this.position.x - boss.position.x,
        //     y: this.position.y - boss.position.y,
        // });
        //
        //
        // if (distance >= 250) {
        //     return;
        // }
        //
        // boss.damage({
        //     amount: GameSettings.PLAYER.DAMAGE.GRENADE,
        // });
    }
}
