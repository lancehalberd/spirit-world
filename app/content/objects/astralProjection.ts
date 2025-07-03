import {Hero} from 'app/content/hero';


export class AstralProjection extends Hero {
    constructor(state: GameState, hero: Hero) {
        super();
        this.isAstralProjection = true;
        this.isAirborn = true;
        this.life = state.hero.magic;
        this.x = hero.x;
        this.y = hero.y;
        this.w = hero.w;
        this.h = hero.h;
        this.d = hero.d;
        this.invulnerableFrames = 0;
        this.savedData = {...hero.savedData};
        this.savedData.leftTool = this.savedData.rightTool = null;
        this.z = 4;
    }
}
