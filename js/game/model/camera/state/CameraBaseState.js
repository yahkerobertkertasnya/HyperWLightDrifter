import { drawImage, drawImageFromBottom } from '../../../helper/renderer/drawer.js';
import GameSettings from '../../../constants.js';
import Game from '../../Game/Game.js';
import { getManhattanDistance } from '../../../helper/distanceHelper.js';

const SCREEN_SIZE = 1920;
export default class CameraBaseState {
    enterState(camera) {}

    updateState(camera) {}

    renderLowerLayer(camera) {
        const { GAME_SCALE } = GameSettings.GAME;
        camera.lowerLayers.forEach((background, positionStr) => {
            const position = {
                x: Number(positionStr.split(',')[0]) * (background.width - 1) * GAME_SCALE,
                y: Number(positionStr.split(',')[1]) * (background.height - 1) * GAME_SCALE,
            };

            if (!this.isInScreen(camera, position)) {
                return;
            }

            drawImage({
                img: background,
                x: position.x,
                y: position.y,
                width: background.width * GAME_SCALE,
                height: background.height * GAME_SCALE,
            });
        });
    }

    renderUpperLayer(camera) {
        let hasUpdatedPlayer = false;

        const { player } = Game.getInstance();
        const { GAME_SCALE } = GameSettings.GAME;

        const { objects, colliders } = this.getObjects(camera);

        objects.forEach((piece) => {
            const { image, position, flipped } = piece;

            if (!hasUpdatedPlayer) {
                hasUpdatedPlayer = this.updatePlayer(position.y, colliders);
            }

            drawImageFromBottom({
                img: image,
                x: position.x,
                y: position.y,
                width: image.width * GAME_SCALE,
                height: image.height * GAME_SCALE,
                mirrored: flipped,
            });
        });

        if (!hasUpdatedPlayer) {
            player.updateState(colliders);
        }
    }

    getObjects(camera) {
        const { player } = Game.getInstance();
        const { GAME_SCALE, FOREST_STAGE } = GameSettings.GAME;
        const objects = [];
        const colliders = [];

        camera.upperLayers.forEach((object, positionStr) => {
            const position = {
                y: Number(positionStr.split(',')[0]) * FOREST_STAGE.FLOOR_WIDTH * GAME_SCALE,
                x: Number(positionStr.split(',')[1]) * FOREST_STAGE.FLOOR_WIDTH * GAME_SCALE,
            };

            if (!this.isInScreen(camera, position)) {
                return;
            }

            object.pieces.forEach((piece) => {
                const { collider } = piece;

                const distance = getManhattanDistance({
                    x: collider.x - player.centerPosition.x,
                    y: collider.y - player.centerPosition.y,
                });

                if (distance < 300) {
                    colliders.push(collider);
                }
                objects.push(piece);
            });
        });

        objects.sort((pieceOne, pieceTwo) => {
            return pieceOne.position.y - pieceTwo.position.y;
        });

        return { objects, colliders };
    }

    isInScreen(camera, position) {
        if (position.x > camera.position.x + SCREEN_SIZE / 2 || position.x < camera.position.x - SCREEN_SIZE / 2) {
            return false;
        }

        return !(position.y > camera.position.y + SCREEN_SIZE / 2 || position.y < camera.position.y - SCREEN_SIZE / 2);
    }

    updatePlayer(yAbsPosition, colliders) {
        const { player } = Game.getInstance();
        const { centerPosition, height } = player;

        const playerY = centerPosition.y + height;

        if (yAbsPosition < playerY) {
            return false;
        }

        player.updateState(colliders);
        return true;
    }

    exitState(camera) {}
}