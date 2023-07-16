/**
    this file contains all the defs regarding a platform's style

    to add another platform style:
    1   add the tag name to the enum
    2   define the data object in platform_style (with tag as key)

    IDEAS/TODO:
        could add more mods in def like friction or material data (alternative to hard baked objects)

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/

/** defines all styles available */
export enum CHECKPOINT_TYPES {
    DEFAULT = "default",
    WOOD = "wood",
    STONE = "stone",
    METAL = "metal",
}

/** registry of all possible styles  */ 
/*      CHECKPOINT DEFS
    holds styling data links to all graphics for checkpoints. each checkpoint
    contains their own collider-area which represents the region of the checkpoint
    that will interact with the player.
*/
export const checkpoint_data = 
[
    //default
    {
        //call-tag
        type: "platform_metal",
        //model location paths
        path: "platformMetal",
        //collision area transform details
        position:   "0_0.5_0",
        scale:      "1_1_1",
        rotation:   "0_0_0",
        //respawn offset
        offset:     "0_1_0"
    }
]