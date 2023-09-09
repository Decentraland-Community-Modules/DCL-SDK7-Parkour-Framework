/**
    this file contains all the defs regarding a trap

    to add another checkpoint style:
    0   create your model (check notes for anim specifics)
    1   add the 'id' to the enum (this is the name you will use to access the type via code)
    2   define the data object in the data segmentv (with the 'id' property set to the same value you put in the enum)

    NOTE:
        animations are a WIP, im spending some time on building out a good doctrine

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/

/** defines all available collectables */
export enum TRAP_TYPE {
    SPIKE,
}

/** ensure standardization between all data objects 
 * (you can ignore this unless you want to mod the object's data def) 
 */
export interface TrapDataObject {
    id: TRAP_TYPE,
    area: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
    };
    path: string;
}

/** registry of all trap styles */ 
export const TrapData:TrapDataObject[] = [
    {
        id: TRAP_TYPE.SPIKE,
        area:{ //trigger box size
            position: { x:0, y:0, z:0 },
            scale: { x:1, y:1, z:1 }
        },
        path: "models/parkour/traps/trap-spike-static.glb" ,
    },
]
/*
//multi-piece traps
export const trap_data_multi = 
[
    //spike-launcher
    {
        //call-tag
        type: "spike_launcher",
        //model location paths
        path_base: "trapSpikeLauncher_Base",
        path_projectile: "trapSpikeLauncher_Projectile",
        //death area transform details, relative to projectile object
        position:   "0_0.25_0",
        scale:      "0.25_0.5_0.25",
        rotation:   "0_0_0"
    }
]*/