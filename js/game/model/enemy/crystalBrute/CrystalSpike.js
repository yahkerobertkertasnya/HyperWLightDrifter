import Game from '../../game/Game.js';
import HitBoxComponent from '../../utility/HitBoxComponent.js';
import GameSettings from '../../../constants.js';
import Animateable from '../../utility/Animateable.js';
import AssetManager from '../../utility/manager/AssetManager.js';
import RandomHelper from '../../utility/helper/RandomHelper.js';
import { Box } from '../../utility/interfaces/Box.js';
import DrawHelper from '../../utility/helper/DrawHelper.js';
export default class CrystalSpike extends Animateable {
    constructor(position, attackObserver) {
        super();
        this.position = position.copy();
        this.attackObserver = attackObserver;
        this.isLeft = RandomHelper.getRandomBoolean(0.5);
        this.damaged = false;
        const { WIDTH, HEIGHT } = GameSettings.GAME.ENEMY.CRYSTAL_BRUTE.CRYSTAL_SPIKE;
        this.width = WIDTH;
        this.height = HEIGHT;
        this.hitbox = new HitBoxComponent(-this.width / 2, -this.height / 2, 0, 0);
    }
    update() {
        this.number += Game.deltaTime;
        if (this.animationStage >= 12) {
            return;
        }
        if (!this.damaged) {
            const box = {
                x: this.position.x - this.width / 2,
                y: this.position.y - this.height / 2,
                w: this.width,
                h: this.height,
            };
            this.attackObserver.notify('attackArea', box);
        }
        this.render();
        this.handleDebug();
        this.advanceAnimationStage(5);
    }
    isPastLifetime() {
        return this.animationStage >= 120;
    }
    render() {
        const crystalSpike = AssetManager.getNumberedImage('crystal_spike', this.animationStage);
        const imageSize = Box.parse({
            x: this.position.x,
            y: this.position.y,
            w: crystalSpike.width * GameSettings.GAME.GAME_SCALE,
            h: crystalSpike.height * GameSettings.GAME.GAME_SCALE,
        });
        DrawHelper.drawImage(crystalSpike, imageSize, true, this.isLeft);
    }
    handleDebug() {
        if (Game.debug) {
            DrawHelper.setFillStyle('rgb(255, 0, 0, 0.5)');
            const { x, y, w, h } = this.hitbox.getPoints(this.position, this.width, this.height);
            DrawHelper.drawRectangle(new Box(x, y, w, h));
        }
    }
}
