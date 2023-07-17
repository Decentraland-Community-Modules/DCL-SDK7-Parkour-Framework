/**
    this file contains all the defs regarding a checkpoint's style

    to add another checkpoint style:
    0   create your model
    1   add the 'id' to the enum (this is the name you will use to access the type via code)
    2   define the data object in the data segmentv (with the 'id' property set to the same value you put in the enum)

    TODO:
        add baked-in sounds for activation & respawn (idk, the current callback linkage seems to work fine atm)

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/

/** defines all styles available */
export enum CHECKPOINT_TYPES {
    METAL = "metal",
}

/** ensure standardization between all data objects 
 * (you can ignore this unless you want to mod the object's data def) 
 */
export interface CheckpointDataObject {
    id: string,
    area: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
    };
    path: string;
}

/** registry of all checkpoint styles */ 
export const CheckpointData:CheckpointDataObject[] = [
    {
        id: "metal",
        area:{ //trigger box size
            position: { x:0, y:0, z:0 },
            scale: { x:1, y:1, z:1 }
        },
        path: "models/parkour/checkpoints/checkpoint-metal.glb" ,
    },
]