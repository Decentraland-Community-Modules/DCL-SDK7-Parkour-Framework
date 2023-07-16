/**
    this file contains all the defs regarding platform styles

    to add another platform style:
    0   create your model
    1   add the 'tag' to the enum
    2   define the data object in platform_style (with tag as key)

    IDEAS/TODO:
        add dynamic matieral plugs, 1 base object can have many different mat/textures applied to it

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/

/** defines all types of platforms available */
export enum PLATFORM_TYPE {
    STATIC = 0,
    BLINKING = 1,
    ROTATING = 2,
    MOVING = 3,
}

/** defines all styles available */
export enum PLATFORM_STYLE_TYPE {
    WOOD = "wood",
    STONE = "stone",
    METAL = "metal",
}

/** ensure standardization between all data objects 
 * (you can ignore this unless you want to mod the object's data def) 
 */
export interface PlatformStyleDataObject {
    id: string,
    path: string;
}

/** registry of all platform styles  */ 
export const PlatformStyleData:PlatformStyleDataObject[] = [
    {
        id: "wood",
        path: "models/parkour/platforms/platform-wood.glb" 
    },
    {
        id: "stone",
        path: "models/parkour/platforms/platform-stone.glb" 
    },
    {
        id: "metal",
        path: "models/parkour/platforms/platform-metal.glb" 
},
    ];