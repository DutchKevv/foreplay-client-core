import { Engine } from "../../core/engine";
import { Layer } from "../../core/classes/engine.layer";

export const createDraggingImg = function(spriteObj, engine: Engine) {
    const img = spriteToImg(spriteObj, engine);
    const layerGame = <Layer>engine.findChildById(Layer.TYPE_GAME);
    const tileW = layerGame.map.tileW;
    const tileH = layerGame.map.tileH;
    img.draggable = false;
    img['dragging'] = true;
    img.style.position = 'absolute';
    img.classList.add('dragging-img');
    img.width = spriteObj.width ? tileW * spriteObj.width : tileW;
    img.height = spriteObj.height ? tileH * spriteObj.height : tileH;

    return img;
}

export const spriteToImg = function (spriteObj, engine: Engine)  {
    const spritesheetImg = engine.assets.getCached('/images/tile/dist/tiles.png');
    Engine.tempContext.canvas.width = spriteObj.frame.w;
    Engine.tempContext.canvas.height = spriteObj.frame.h;
    Engine.tempContext.clearRect(0, 0, spriteObj.frame.w, spriteObj.frame.h);
    Engine.tempContext.drawImage(spritesheetImg, spriteObj.frame.x, spriteObj.frame.y, spriteObj.sourceSize.w, spriteObj.sourceSize.h, 0, 0, spriteObj.frame.w, spriteObj.frame.h);
    const img = document.createElement('img');
    img.src = Engine.tempContext.canvas.toDataURL();
    (<any>img).data = spriteObj;
    return img;
}