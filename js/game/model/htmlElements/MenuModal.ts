import Modal from './Modal.js';
import Observable from '../utility/Observable.js';

export default class MenuModal extends Modal {
    protected newGameButton: JQuery;
    protected settingsButton: JQuery;

    public constructor(eventEmitter: Observable) {
        super($('#menu-modal'), eventEmitter);
        this.newGameButton = $('.new-game');
        this.settingsButton = $('.settings');

        this.handleInteraction();
        this.handleEvent();
    }

    protected handleEvent() {
        this.eventEmitter.unsubscribe(this.eventFunction);
        this.eventEmitter.subscribe(this.eventFunction);
    }

    private eventFunction = ({ event }) => {
        if (event === 'menuModal:open') {
            this.open();
            return;
        }
        if (event === 'menuModal:toggle') {
            this.toggle();
        }
    };

    private handleInteraction() {
        this.newGameButton.off();
        this.newGameButton.on('mousedown', () => {
            this.eventEmitter.notify('selectionModal:open');
            this.close();
        });

        this.settingsButton.off();
        this.settingsButton.on('mousedown', () => {
            this.eventEmitter.notify('settingsModal:open');
            this.close();
        });
    }
}
