import PlayerBaseState from './PlayerBaseState.js';
import Grenade from '../Grenade.js';
import Game from '../../game/Game.js';
import { getFaceDirection, getMouseDirection } from '../../../helper/collision/directionHandler.js';
import { drawImage } from '../../../helper/renderer/drawer.js';
import GameSettings from '../../../constants.js';
import Player from '../Player.js';
import AssetManager from '../../utility/AssetManager.js';

export default class PlayerThrowingState extends PlayerBaseState {
    private hasThrown: boolean;
    private direction: string;

    constructor() {
        super();
        this.hasThrown = false;
        this.direction = '';
    }

    enterState(currPlayer: Player) {
        super.enterState(currPlayer);

        this.hasThrown = false;
        this.direction = getMouseDirection({
            angle: currPlayer.lookAngle,
        });
        const { audio } = Game.getInstance();

        audio.playAudio('player/grenade/throw.wav');
    }

    updateState(currPlayer: Player) {
        super.updateState(currPlayer);

        this.advanceAnimationStage(5);

        if (this.animationStage >= 4 && !this.hasThrown) {
            Grenade.generate({
                x: currPlayer.centerPosition.x,
                y: currPlayer.centerPosition.y,
                angle: currPlayer.lookAngle,
            });
            this.hasThrown = true;
        }

        if (this.animationStage < 8) {
            return;
        }

        currPlayer.handleSwitchState({
            move: true,
            attackOne: true,
            dash: true,
            aim: true,
            throws: true,
        });
    }

    drawImage(currPlayer: Player) {
        let playerThrow: HTMLImageElement | null = null;

        const { centerPosition, lookAngle } = currPlayer;
        if (this.direction === 'a' || this.direction === 'd') {
            playerThrow = AssetManager.getNumberedImage('player_throw_side', this.animationStage);
        }
        if (this.direction === 'w') {
            playerThrow = AssetManager.getNumberedImage('player_throw_up', this.animationStage);
        }
        if (this.direction === 's') {
            playerThrow = AssetManager.getNumberedImage('player_throw_down', this.animationStage);
        }

        if (!playerThrow) {
            return;
        }

        drawImage({
            img: playerThrow,
            x: centerPosition.x,
            y: centerPosition.y,
            width: playerThrow.width * GameSettings.GAME.GAME_SCALE,
            height: playerThrow.height * GameSettings.GAME.GAME_SCALE,
            translate: true,
            mirrored: getFaceDirection(lookAngle) === 'left',
        });
    }
}
