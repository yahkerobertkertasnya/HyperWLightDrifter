import Game from '../game/Game.js';
import GameSettings from '../../constants.js';
import { Vector } from '../utility/interfaces/Vector.js';
import DrawHelper from '../utility/helper/DrawHelper.js';
import { Box } from '../utility/interfaces/Box.js';

const CAMERA_X_CONSTANT = -45;
const CAMERA_Y_CONSTANT = -25;

export default class CameraBox {
    private game: Game;
    private position: Vector;
    private _width: number;
    private _height: number;

    public constructor(game: Game) {
        this.game = game;
        this.position = {
            x: 0,
            y: 0,
        };
        this._width = 800;
        this._height = 500;
    }

    get width(): number {
        return this._width;
    }

    set width(value: number) {
        this._width = value;
    }

    get height(): number {
        return this._height;
    }

    set height(value: number) {
        this._height = value;
    }

    public update() {
        const { player } = this.game;

        this.position.x = this.getTranslatePosition({
            position: player.centerPosition.x,
            length: this._width / 2 + CAMERA_X_CONSTANT,
        });
        this.position.y = this.getTranslatePosition({
            position: player.centerPosition.y,
            length: this._height / 2 + CAMERA_Y_CONSTANT,
        });

        if (Game.debug) {
            this.renderDebugBox();
        }
    }

    renderDebugBox() {
        DrawHelper.setFillStyle(GameSettings.DEBUG.COLOR.CAMERA_BOX);
        DrawHelper.drawRectangle(new Box(this.position.x, this.position.y, this._width, this._height));
    }

    public getOverlap(points: Sides) {
        const directionArray: string[] = [];

        const { top, bottom, left, right } = this.getSides();

        if (right > points.right) {
            directionArray.push('d');
        }

        if (left < points.left) {
            directionArray.push('a');
        }

        if (bottom > points.bottom) {
            directionArray.push('s');
        }

        if (top < points.top) {
            directionArray.push('w');
        }

        return directionArray;
    }

    private getTranslatePosition({ position, length }) {
        return position - length;
    }

    private getSides(): Sides {
        return {
            top: this.position.y,
            bottom: this.position.y + this._height,
            left: this.position.x,
            right: this.position.x + this._width,
        };
    }
}
