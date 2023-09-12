import Enemy from "../Enemy.js";
import Game from "../../Game/Game.js";
import renderShadow from "../../../helper/renderer/shadow.js";
import CrystalBruteBaseState from "./state/CrystalBruteBaseState.js";
import CrystalBruteAttackState from "./state/CrystalBruteAttackState.js";
import CrystalBruteDieState from "./state/CrystalBruteDieState.js";
import CrystalBruteMoveState from "./state/CrystalBruteMoveState.js";
import HealthBar from "../healthBar/HealthBar.js";
import EnemyManager from "../EnemyManager.js";

export default class CrystalBrute extends Enemy {
    static generate({ x, y }) {
        const newCrystalBrute = new CrystalBrute({
            x: x,
            y: y,
            width: 136,
            height: 140,
        });

        EnemyManager.getInstance().enemyList.push(newCrystalBrute);
    }
    constructor({ x, y, width, height }) {
        super({
            x: x,
            y: y,
            w: width,
            h: height,
            hitbox: {
                x: -width / 2 + 30,
                y: -height / 2 + 30,
                w: 60,
                h: 30,
            },
            health: 10,
            maxHealth: 10,
        });
        this.currState = new CrystalBruteBaseState();
        this.attackState = new CrystalBruteAttackState();
        this.moveState = new CrystalBruteMoveState();
        this.dieState = new CrystalBruteDieState();
        this.speed = 3;
        this.attack = [];
        this.healthBar = HealthBar.generate({
            position: this.position,
            offset: {
                x: 0,
                y: 75,
            },
            maxHealth: this.maxHealth,
        });
        this.switchState(this.moveState);
    }

    switchState(newState) {
        this.currState.exitState(this);
        this.currState = newState;
        this.currState.enterState(this);
    }

    update() {
        this.knockback();

        if (Game.getInstance().debug) {
            this.debugMode();
        }
        this.currState.updateState(this);

        if(this.currState !== this.dieState) {
            renderShadow({
                position: {
                    x: this.position.x,
                    y: this.position.y + 27.5,
                },
                sizeMultiplier: 3,
            });
        }


        if(this.currState !== this.dieState){
            this.healthBar.update({
                health: this.health,
                position: {
                    x: this.position.x,
                    y: this.position.y,
                }
            });
        }


        this.attack.forEach((attack) => {

            if (attack.update()) {
                this.attack.splice(this.attack.indexOf(attack), 1);
            }
        });


        if(this.damaged >= 0) {
            Game.getInstance().setFilter('sepia(100%) hue-rotate(111deg) saturate(1000%) contrast(118%) invert(100%)');
        }

        this.currState.drawImage(this);

        if(this.damaged >= 0) {
            Game.getInstance().setFilter('none');
            this.damaged -= 1;
        }
    }
}
