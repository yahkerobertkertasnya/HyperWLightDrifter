import ElevatorBaseState from './ElevatorBaseState.js';
import Game from '../../../game/Game.js';
import GameSettings from '../../../../constants.js';
import Elevator from '../Elevator.js';
import AssetManager from '../../../utility/manager/AssetManager.js';
import AudioManager from '../../../utility/manager/AudioManager.js';
import { Box } from '../../../utility/interfaces/Box.js';
import DrawHelper from '../../../utility/helper/DrawHelper.js';

export default class ElevatorMoveState extends ElevatorBaseState {
    private velocity: number;
    private frictionCoefficient: number;
    private aboutToMount: boolean;
    private bottomCropAmount: number;
    private counter: number;

    public constructor() {
        super();
        this.velocity = 0;
        this.frictionCoefficient = 0.05;
        this.aboutToMount = false;
        this.bottomCropAmount = 0;
        this.counter = 0;
    }

    public enterState(elevator: Elevator) {
        Game.getInstance().elevator = elevator;
        elevator.travelDistance = 0;
        const { player } = Game.getInstance();
        player.switchState(player.inElevatorState);
        this.setDefaultValues();
    }

    public updateState(elevator: Elevator) {
        super.updateState(elevator);

        if (this.checkCounter(100)) {
            AudioManager.playAudio('elevator_move_audio').then();

            this.number = 0;
        }
        const { player } = Game.getInstance();

        this.handleVelocity(elevator);

        const velocity = this.velocity * Game.movementDeltaTime;

        player.velocity.y = 0;
        if (this.counter > 140) {
            player.velocity.y = velocity;
        }

        player.centerPosition.y += velocity;
        elevator.position.y += velocity;
        elevator.travelDistance += velocity ?? 0;

        if (this.aboutToMount) {
            elevator.bottomCrop += velocity * 0.415;
            this.bottomCropAmount += velocity * 0.415;
        }

        if (elevator.stageLocation === 2) {
            this.counter += Game.deltaTime;
        }

        if (this.velocity === 0) {
            elevator.switchState(elevator.mountedDownState);
        }
    }

    public drawImage(elevator: Elevator) {
        const elevatorImage = AssetManager.getImage('elevator');

        elevator.width = -0.5 * elevatorImage.width;
        elevator.height = -2 * elevatorImage.height;

        const imageBox = Box.parse({
            x: 0,
            y: 0,
            w: elevatorImage.width,
            h: elevatorImage.height - elevator.bottomCrop,
        });

        const drawBox = Box.parse({
            x: elevator.position.x - elevatorImage.width,
            y: elevator.position.y - elevatorImage.height,
            w: elevatorImage.width * GameSettings.GAME.GAME_SCALE,
            h: (elevatorImage.height - elevator.bottomCrop) * GameSettings.GAME.GAME_SCALE,
        });

        DrawHelper.drawImageCropped(elevatorImage, imageBox, drawBox);
    }

    private setDefaultValues() {
        this.velocity = 0;
        this.frictionCoefficient = 0.05;
        this.aboutToMount = false;
        this.bottomCropAmount = 0;
        this.counter = 0;
        this.number = 99;
    }

    private handleVelocity(elevator: Elevator) {
        if (elevator.stageLocation === 2 && elevator.travelDistance > 650) {
            this.velocity = this.velocity * (1 - this.frictionCoefficient * Game.movementDeltaTime);

            if (elevator.travelDistance > 683) {
                this.aboutToMount = true;
            }

            if (this.velocity <= 0.01) {
                this.velocity = 0;
            }

            if (this.bottomCropAmount < 10) {
                this.velocity = 0.6 * Game.movementDeltaTime;
                return;
            }

            this.velocity = 0;

            return;
        }

        this.velocity += 0.1 * Game.movementDeltaTime;

        this.velocity = Math.min(this.velocity, 3 * Game.deltaTime);
    }
}
