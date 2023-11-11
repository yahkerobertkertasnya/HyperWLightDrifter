import CameraBaseState from './CameraBaseState.js';
export default class CameraFollowState extends CameraBaseState {
    updateState(camera) {
        camera.moveCamera();
        camera.cameraBox.update();
    }
    enterState() { }
    exitState() { }
}
