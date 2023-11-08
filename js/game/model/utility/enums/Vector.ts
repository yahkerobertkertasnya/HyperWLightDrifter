export interface Vector {
    x: number;
    y: number;
}

export class Vector {
    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public static Zero(): Vector {
        return { x: 0, y: 0 };
    }
}
