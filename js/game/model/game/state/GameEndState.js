import GameBaseState from './GameBaseState.js';
import EndingVideo from '../../htmlElements/EndingVideo.js';

export default class GameEndState extends GameBaseState {
    enterState(_game) {
        EndingVideo.open();
        EndingVideo.handleClose();
        localStorage.setItem('finished', 'true');
    }

    exitState(_game) {
        EndingVideo.close();
        $('#opening-screen').attr('src', '../assets/ui/start_end.png').css('animation', 'fadeIn 0.5s ease-in-out');
    }
}