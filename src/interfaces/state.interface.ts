import { Player } from "../classes/engine.player";

export interface IState {
    game: {
        player?: Player;
    };
}