import Animateable from '../../../utility/Animateable.js';
export default class CrystalBruteBaseState extends Animateable {
    exitState(currBrute) { }
    updateState(currBrute) {
        this.updateNumberCounter();
    }
    drawImage(currBrute) { }
    enterState(currBrute) {
        this.number = 0;
        this.animationStage = 1;
    }
}
