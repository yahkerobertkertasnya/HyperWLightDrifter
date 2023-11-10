import Medkit from './Medkit.js';
import Key from './Key.js';
import Elevator from './Elevator/Elevator.js';
import { Vector } from '../utility/interfaces/Vector.js';
import Observable from '../utility/Observable.js';
import RandomHelper from '../utility/helper/RandomHelper.js';

export default class InteractablesFactory {
    private eventEmitter: Observable;

    public constructor(eventEmitter: Observable) {
        this.eventEmitter = eventEmitter;
    }

    public generateKey(position: Vector) {
        const x = Math.round(position.x / 256);
        const y = Math.round(position.y / 256);
        const key = `${y},${x}`;

        const keyObject = new Key(position, 10, 10, key, this.eventEmitter);

        this.eventEmitter.notify('addInteractable:key', keyObject);
    }

    public generateMedkit(position: Vector, key: string) {
        const angle = RandomHelper.randomValue(0, 4) * Math.PI;

        position = {
            x: position.x + Math.cos(angle) * 100,
            y: position.y + Math.sin(angle) * 100,
        };

        const medkit = new Medkit(position, 10, 10, key, this.eventEmitter);

        this.eventEmitter.notify('addInteractable', medkit);

        return medkit;
    }

    public generateElevator(position: Vector) {
        const elevator = new Elevator(position, this.eventEmitter);

        this.eventEmitter.notify('addInteractable', elevator);

        return elevator;
    }
}
