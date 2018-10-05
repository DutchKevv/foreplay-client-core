import { Player } from './engine.player';

export class PlayerSelf extends Player {

    public isSelf: boolean = true;

    public update(delta: number, currentTime: DOMHighResTimeStamp) {
        this.isMoving = false;

        this.checkKeyboard(delta);
        this.checkMouse();

        
        super.update(delta, currentTime);
    }

    /**
    * 
    * @param map 
    * @param camera 
    */
    public checkMouse(): void {
        const camera = this.layer.camera;
        const map = this.layer.map;
        const activemMouseKeys = this.engine.controls.activeMouse;
        const activemTouchKeys = this.engine.controls.activeTouch;

        if (!map) return;
        
        // follow mouse / touch on mouse down / touchmove
        if (activemTouchKeys.move || (activemMouseKeys.down && activemMouseKeys.move)) {
            this.isMoving = true;
            const activeKey = activemTouchKeys.move || activemMouseKeys.move;
            const screenXZ = this.getRelativeXZFromScreenXY(activeKey.x, activeKey.y);
            this.faceDirectionByScreenXY(screenXZ.x, screenXZ.z, camera);
        }

        // walk to clicked tile
        else if (activemMouseKeys.up && map.state.selectedTile && !map.state.selectedTile.blockedBy) {
            this.moveToTile(map.state.selectedTile, this.layer.map);
            map.setHighlightedTile(map.state.selectedTile);
        }
    }

    /**
     * 
     * @param delta 
     */
    public checkKeyboard(delta: number): void {
        const activeDownKeys = this.engine.controls.activeKeyboard.down;

        if (activeDownKeys.a || activeDownKeys.left) {
            this.isMoving = true;
            this.unsetMoveTo();
            this.position.r -= this.behavior.speed / 2000;
        }

        if (activeDownKeys.d || activeDownKeys.right) {
            this.isMoving = true;
            this.unsetMoveTo();
            this.position.r += this.behavior.speed / 2000;
        }

        if (activeDownKeys.w || activeDownKeys.up) {
            this.isMoving = true;
            this.unsetMoveTo();
            this.position.x += this.behavior.speed * delta * Math.cos(this.position.r);
            this.position.z += this.behavior.speed * delta * Math.sin(this.position.r);
        }

        if (activeDownKeys.s || activeDownKeys.down) {
            this.isMoving = true;
            this.unsetMoveTo();
            this.position.x -= this.behavior.speed * delta * Math.cos(this.position.r);
            this.position.z -= this.behavior.speed * delta * Math.sin(this.position.r);
        }
    }
}