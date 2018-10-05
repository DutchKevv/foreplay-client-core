import { Camera } from './engine.camera';
import { Map } from './engine.map';
import { ICharacter } from "@foreplay/shared/interfaces/character.interface";
import { Drawable } from './engine.drawable';

var action_frames = {};
var walking_frames = {};

export class Player extends Drawable {

    public uId: string;
    public cId: string;
    public name: string;
    public level: number;
    public health: number;
    public healthMax: number;
    public inventory: Array<string>;
    public previousActiveTile;
    public drawDestination: boolean = true;

    public width = 32;
    public height = 32;
    public action: any = null;
    public rewardtime: any = null;
    public data: any = {};

    /**
     * 
     * @param options 
     */
    constructor(options: ICharacter) {
        super(options);
    }

    public init() {
        this.uId = this.options.uId;
        this.cId = this.options.cId;
        this.name = this.options.name || '????';
        this.level = this.options.level || 1;
        this.health = this.options.health || 100;
        this.healthMax = this.options.healthMax || 100;
        this.inventory = this.options.inventory || [];

        return super.init();
    }

    /**
     * 
     * @param delta 
     * @param currentTime 
     * @param map 
     * @param camera 
     */
    public update(delta: number, currentTime: DOMHighResTimeStamp, map?: Map, camera?: Camera) {
        super.update(delta, currentTime, map, camera);
    }

    /**
     * 
     * @param delta 
     * @param currentTime 
     * @param context 
     * @param camera 
     */
    public draw(delta: number, currentTime: DOMHighResTimeStamp, context: CanvasRenderingContext2D, camera?: Camera) {
        if (this.drawDestination)
            this.drawDestinationPath(delta, context);

        if (this.layer.map) {
            this.checkAutoMovement(delta, this.layer.map);
            this.normalizePositionObject(this.position, this.layer.map);
        }

        this.onDraw(delta, currentTime, context, camera);
        this.drawPlayer(delta, context, camera);
    }

    /**
     * 
     * @param delta 
     * @param context 
     * @param camera 
     */
    public drawPlayer(delta: number, context: CanvasRenderingContext2D, camera?: Camera) {
        let xCanvas = this.position.x;
        let yCanvas = this.position.z;

        if (camera) {
            xCanvas -= camera.xView;
            yCanvas -= camera.zView;
        }

        //Animation frame counts
        if (typeof walking_frames[this.id] == 'undefined') {
            walking_frames[this.id] = 0;
        }
        if (typeof action_frames[this.id] == 'undefined') {
            action_frames[this.id] = 0;
        }

        //Target box test
		/*context.beginPath();
		context.strokeStyle = "red";
		context.arc((data.target_box.x+data.x_rel),(data.target_box.y+data.y_rel), data.target_box.w, 0, 2 * Math.PI);
		context.stroke();
		context.closePath();*/

        // TODO - NORMALIZE;
        let degree = (this.position.r * (180 / Math.PI)) - 270;
        degree = degree * Math.PI / 180;

        // let degree = this.position.r;

        //Shadow
        context.save();
        context.fillStyle = "rgba(0, 0, 0, 0.2)";
        context.translate(xCanvas, yCanvas);
        context.beginPath();
        context.arc(-3, 5, 20, 0, 2 * Math.PI, false);
        context.fill();
        context.closePath();
        context.restore();

        //Feet
        if (this.isMoving === true) {
            walking_frames[this.id] += 1;

            if (walking_frames[this.id] >= 0 && walking_frames[this.id] <= 4) {
                context.save();
                context.fillStyle = 'black';
                context.translate(xCanvas, yCanvas);
                context.rotate(degree);
                context.beginPath();
                context.arc(-10, -8, 5, 0, 10);
                context.fill();
                context.closePath();
                context.restore();
            } else if (walking_frames[this.id] >= 5 && walking_frames[this.id] <= 9) {
                context.save();
                context.fillStyle = 'black';
                context.translate(xCanvas, yCanvas);
                context.rotate(degree);
                context.beginPath();
                context.arc(10, -8, 5, 0, 10);
                context.fill();
                context.closePath();
                context.restore();

            } else if (walking_frames[this.id] >= 10) {
                walking_frames[this.id] = 0;
            }
        }

        //Set original right hand position
        let x1 = 20;
        let x2 = -4;

        //Hands when performing a hit, animation in 10 frames of a swinging sword
        if (this.action == 'fighting' && action_frames[this.id] < 10) {
            action_frames[this.id] += 1;
            //Animate
            if (action_frames[this.id] >= 4) {
                x1 -= (action_frames[this.id]);
            }
            x2 -= (action_frames[this.id]);
        }

        if (this.action == 'fighting' && action_frames[this.id] >= 10) {
            //Reset the action frames counter
            action_frames[this.id] = 0;

            //Submit the stop of the action
            // game.engine.socket.emit('action_stop');
        }

        //Right hand
        context.save();
        context.fillStyle = 'pink';
        context.translate(xCanvas, yCanvas);
        context.rotate(degree);
        context.beginPath();
        context.arc(x1, x2, 5, 0, 10);
        context.fill();
        context.closePath();
        context.restore();

        //Left hand
        context.save();
        context.fillStyle = 'pink';
        context.translate(xCanvas, yCanvas);
        context.rotate(degree);
        context.beginPath();
        context.arc(-20, -4, 5, 0, 10);
        context.fill();
        context.closePath();
        context.restore();

        //Body
        context.save();
        context.fillStyle = this.isSelf ? 'blue' : 'red';
        context.translate(xCanvas, yCanvas);
        context.rotate(degree);
        context.scale(1, 0.5);
        context.beginPath();
        context.arc(0, 0, 20, 0, 10, false);
        context.fill();
        context.closePath();
        context.restore();

        //Head
        context.fillStyle = 'pink';
        context.beginPath();
        context.arc(xCanvas, yCanvas, 10, 0, 2 * Math.PI);
        context.closePath();
        context.fill();

        //Hair
        context.save();
        context.fillStyle = this.isSelf ? 'brown' : 'black';
        context.translate(xCanvas, yCanvas);
        context.rotate(degree);
        context.beginPath();
        context.arc(0, 0, 10, -0.4, 3.5, false);
        context.closePath();
        context.fill();
        context.restore();

        // rewardscreen, display 1 second
        if (this.rewardtime > Date.now() - 1000) {
            //Set the font
            context.font = "bold 18px Arial";
            context.textAlign = "center";

            //Draw the name
            context.fillStyle = 'yellow';
            context.fillText(this.data.reward, xCanvas, yCanvas - 65);
        }

    }

    /**
     * 
     * @param delta 
     * @param context 
     * @param camera 
     */
    public drawHealthBar(delta: number, context: CanvasRenderingContext2D, camera: Camera) {
        const xCanvas = (this.position.x) - camera.xView;
        const yCanvas = (this.position.z) - camera.zView;

        //Set the font
        context.font = "bold 18px Arial";
        context.textAlign = "center";

        //Draw the shadow
        context.fillStyle = "rgba(0, 0, 0, 0.4)";
        context.fillText(this.name, xCanvas - 2, yCanvas - 44);

        context.fillStyle = '#FFFFFF';
        context.fillText(this.name, xCanvas, yCanvas - 45);

        //Healthbar
        context.fillStyle = '#5A0303';
        context.beginPath();
        context.rect(xCanvas - 25, yCanvas - 30, 50, 5);
        context.closePath();
        context.fill();

        const healthPercentage = Math.round(this.health * (50 / this.healthMax));

        context.fillStyle = '#FF0000';
        context.beginPath();
        context.rect(xCanvas - 25, yCanvas - 30, healthPercentage, 5);
        context.closePath();
        context.fill();
    }

    /**
     * 
     * @param delta 
     * @param context 
     */
    public drawDestinationPath(delta: number, context: CanvasRenderingContext2D) {
        const camera = this.layer.camera;
        const tileSize = 32;

        for (let i = 0, len = this.movePath.length; i < len; i++) {
            const nextTile = this.movePath[i];
            context.fillStyle = 'red';
            context.fillRect((nextTile.gx * tileSize) - camera.xView, (nextTile.gz * tileSize) - camera.zView, tileSize, tileSize);
            context.fillStyle = "white";
            context.fillText('' + i, (nextTile.gx * tileSize) - camera.xView + (tileSize / 3), (nextTile.gz * tileSize) - camera.zView + (tileSize / 2) + 4);
        }
    }

    public destroy() {
        clearTimeout(this.behaviorTimeout);
        super.destroy();
    }
}


