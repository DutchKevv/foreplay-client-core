export class Rectangle {
    
    public left: number = 0;
    public right: number = 0;
    public top: number = 0;
    public bottom: number = 0;
    public width: number = 0;
    public height: number = 0;

    constructor(left, top, width, height) {
        this.left = left || 0;
        this.top = top || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.right = this.left + this.width;
        this.bottom = this.top + this.height;
    }
    set(left: number, top: number, width: number = this.width, height: number = this.height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.right = (this.left + this.width);
        this.bottom = (this.top + this.height);
    }
    within(r) {
        return (r.left <= this.left &&
            r.right >= this.right &&
            r.top <= this.top &&
            r.bottom >= this.bottom);
    }
    overlaps(r) {
        return (this.left < r.right &&
            r.left < this.right &&
            this.top < r.bottom &&
            r.top < this.bottom);
    }
}



