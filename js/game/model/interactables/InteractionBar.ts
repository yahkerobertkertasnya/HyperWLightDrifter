import { getNumberedImage } from '../../helper/assets/assetGetter.js';
import { drawImage } from '../../helper/renderer/drawer.js';
import GameSettings from '../../constants.js';
import Game from '../game/Game.js';
import { getMagnitudeValue } from '../../helper/distanceHelper.js';
import Medkit from './Medkit.js';
import Key from './Key.js';
import Player from '../player/Player';
import Observable from '../utility/Observable';
import { Interactables } from '../utility/enums/Interactables';

export default class InteractionBar {
    private player: Player;
    private inputEventEmitter: Observable;
    private animationStage: number;
    private number: number;
    private transparency: number;
    private isInteracting: boolean;
    private allowDraw: boolean;
    private interactionStage: number;

    constructor(player: Player, inputEventEmitter: Observable) {
        this.player = player;
        this.inputEventEmitter = inputEventEmitter;
        this.animationStage = 1;
        this.number = 0;
        this.transparency = 0;
        this.isInteracting = false;
        this.allowDraw = false;
        this.interactionStage = 0;

        this.eventHandler();
    }

    public setAllowDraw(boolean: boolean) {
        this.allowDraw = boolean;
    }

    public setTransparency(transparency: number) {
        this.transparency = transparency;
    }

    public update() {
        const { deltaTime } = Game.getInstance();
        if (!this.isInteracting) {
            this.interactionStage -= deltaTime;
            this.interactionStage = Math.max(this.interactionStage, 0);
        }
    }

    public detectPlayerInteraction(object: Interactables | null, interactDistance = 100) {
        const { player } = Game.getInstance();

        if (object == null) {
            return;
        }

        const distance = getMagnitudeValue({
            x: player.centerPosition.x - object.position.x,
            y: player.centerPosition.y - object.position.y,
        });

        if (distance < interactDistance) {
            this.setAllowDraw(true);

            this.transparency = Math.abs(distance - interactDistance) / interactDistance;

            this.handler(object);
        }
    }

    public drawBar() {
        if (!this.allowDraw) {
            this.animationStage = 1;
            return;
        }
        const { player, ctx } = Game.getInstance();

        const interactionBar = getNumberedImage('interaction_bar', this.animationStage);

        Game.getInstance().setTransparency(this.transparency);

        if (interactionBar == null) {
            return;
        }

        drawImage({
            img: interactionBar,
            x: player.centerPosition.x + 50,
            y: player.centerPosition.y - 10,
            width: interactionBar.width * GameSettings.GAME.GAME_SCALE,
            height: interactionBar.height * GameSettings.GAME.GAME_SCALE,
        });

        ctx.fillStyle = 'rgb(255, 255, 255, 0.9)';

        ctx.fillRect(player.centerPosition.x + 54, player.centerPosition.y - 2, this.interactionStage, 16);

        Game.getInstance().setTransparency(1);
        this.allowDraw = false;
    }

    public checkCounter(number: number) {
        return this.number >= number;
    }

    public advanceAnimationStage(number: number, maxStage?: number) {
        const advanceStage = Math.floor(this.number / number);

        if (advanceStage > 0) {
            this.animationStage += advanceStage;
            this.number = 0;

            if (maxStage && this.animationStage > maxStage) {
                this.animationStage = 1;
            }
        }
    }

    private eventHandler = () =>
        this.inputEventEmitter.subscribe(({ event, data }) => {
            if (event === 'keydown') {
                if (data === 'e') {
                    this.isInteracting = true;
                }
            }
            if (event === 'keyup') {
                if (data === 'e') {
                    this.isInteracting = false;
                }
            }
        });

    private handler(object: Interactables) {
        const { audio, deltaTime } = Game.getInstance();

        if (this.isInteracting && this.transparency >= 0.5) {
            this.number += deltaTime;
            this.interactionStage += deltaTime;

            if (this.interactionStage >= 20) {
                if (object instanceof Medkit) {
                    object.activate(this.player);
                }
                if (object instanceof Key) {
                    object.activate();
                    Game.getInstance().keyCount += 1;
                }
                return true;
            }

            if (this.checkCounter(10)) {
                audio.playAudio('player/interact/interact.wav');
            }

            this.advanceAnimationStage(10);
        }

        return false;
    }
}
