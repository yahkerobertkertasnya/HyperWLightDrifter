import Game from '../../Game/Game.js';
import Enemy from '../Enemy.js';
import {getHorizontalValue, getVerticalValue} from "../../../helper/distanceHelper.js";
import {getImage} from "../../../helper/imageLoader.js";
import {drawImage} from "../../../helper/renderer/drawer.js";

export default class JudgementLaser extends Enemy {
    static generate({ x, y, angle }) {
        const newJudgementLaser = new JudgementLaser({
            x,
            y,
            velocity: {
                value: 12.5,
                angle: angle,
            },
            lifetime: 200 + Math.random() * 200,
        });
        Game.getInstance().bossEntities.push(newJudgementLaser);
    }
    constructor({ x, y, velocity, lifetime }) {
        super({
            x,
            y,
            hitbox: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            },
            w: 20,
            h: 20,
            health: 1,
            maxHealth: 1,
        });
        this.imageAngle = Math.random() * 2 * Math.PI;
        this.velocity = velocity;
        this.maxLifetime = lifetime;
        this.lifetime = lifetime;
    }

    damage(_) {
        // override
    }

    knockback() {
        this.velocity.value *= 3;
    }

    update() {
        this.lifetime -= 1;

        this.position.x += getHorizontalValue({
            angle: this.velocity.angle,
            magnitude: this.velocity.value,
        });

        this.position.y += getVerticalValue({
            angle: this.velocity.angle,
            magnitude: this.velocity.value,
        });

        this.render();

        if (this.lifetime <= 0) {
            this.kill();
        }
    }

    kill() {
        const { bossEntities } = Game.getInstance();
        bossEntities.splice(bossEntities.indexOf(this), 1);
    }

    render() {
        const laserBullet = getImage('judgement_laser_bullet');

        drawImage({
            img: laserBullet,
            x: this.position.x,
            y: this.position.y,
            width: laserBullet.width,
            height: laserBullet.height,
            translate: true,
        });
    }
}