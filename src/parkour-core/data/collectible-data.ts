/**
    this file contains all the defs regarding collectibles

    to add another collectible:
    0   create your model (bake in any animations, such as coin rotation & sway)
    1   add the 'id' to the enum (this is the name you will use to access the type via code)
    2   define the data object in the data segmentv (with the 'id' property set to the same value you put in the enum)

    IDEAS/TODO:
        add dynamic matieral plugs, 1 base object can have many different mat/textures applied to it

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/

/** defines call-linkage for all available collectibles */
export enum COLLECTIBLE_TYPE {
    COPPER = "copper",
    SILVER = "silver",
    GOLD = "gold",
}

/** ensure standardization between all data objects 
 * (you can ignore this unless you want to mod the object's data def) 
 */
export interface CollectibleDataObject {
    id: string,
    value: number;
    area: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
    };
    sound: string;
    path: string;
}

/** registry of all collectibles  */
export const CollectibleData: CollectibleDataObject[] = [
    //collectible def
    {
        id: "copper",  //tag
        value:1, //points gained on pickup
        area:{ //trigger box size
            position: { x:0, y:0, z:0 },
            scale: { x:1, y:1, z:1 }
        },
        sound: "audio/parkour/sfx_collect.wav", //sound played on pickup (empty = none)
        path: "models/parkour/collectibles/coin-copper.glb" //display model
    },
    { 
        id: "silver",
        value:5,
        area:{
            position: { x:0, y:0, z:0 },
            scale: { x:1, y:1, z:1 }
        },
        sound: "audio/parkour/sfx_collect.wav", 
        path: "models/parkour/collectibles/coin-silver.glb" 
    },
    { 
        id: "gold",
        value:10,
        area:{
            position: { x:0, y:0, z:0 },
            scale: { x:1, y:1, z:1 }
        },
        sound: "audio/parkour/sfx_collect.wav", 
        path: "models/parkour/collectibles/coin-gold.glb" 
    },
];