import Game from "../Game.js";


export default function playerEffectsHandler({ currPlayer, clear }){
    if(clear){
        clearFilter(currPlayer);
        return;
    }
    damagedHandler(currPlayer);
    healingHandler(currPlayer);
}

function damagedHandler(currPlayer){
    if (currPlayer.immunity < 30) {
        currPlayer.immunity++;
    }
    if (currPlayer.immunity <= 5) {
        const ctx = Game.getInstance().canvasCtx;
        ctx.filter = 'sepia(100%) hue-rotate(111deg) saturate(1000%) contrast(118%) invert(100%)';
    }
}

function healingHandler(currPlayer){
    if(currPlayer.healing > 0){
        currPlayer.healing--;
        const ctx = Game.getInstance().canvasCtx;
        ctx.filter = 'sepia(100%) hue-rotate(111deg) saturate(1000%) contrast(118%)';
        ctx.strokeStyle = 'rgb(0, 255, 0)';
        ctx.lineWidth = (currPlayer.healing / 3) * 3;
        ctx.save();
        ctx.translate(currPlayer.position.x + 15, currPlayer.position.y + 30);
        ctx.rotate(Math.PI / 4);
        // ctx.translate((this.width - this.hitbox.x) / 2, (this.width - this.hitbox.x) / 2);
        ctx.strokeRect(
            10,
            -15,
            currPlayer.width - currPlayer.hitbox.x,
            currPlayer.width - currPlayer.hitbox.x,
        );
        ctx.restore();
        if(currPlayer.health < currPlayer.maxhealth) {
            currPlayer.health += 1;
        }
    }
}

function clearFilter(currPlayer){
    if (currPlayer.immunity <= 5 || currPlayer.healing >= 0) {
        const ctx = Game.getInstance().canvasCtx;
        ctx.filter = 'none';
    }
}