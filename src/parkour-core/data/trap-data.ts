/**
    this file contains all the defs regarding traps

    to add another trap:
    1   add the 'tag' to the enum
    2   define the data object in trap_data (with tag as key)

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/

/** defines all available collectables */
export enum TRAP_TYPES {
    SPIKE = "spike",
}

/** registry of all traps */
export const trap_data = {
    "spike": {
        //how much damage this trap does
        value: 0,
        //death area transform details
        area:{
            position: { x:0, y:0, z:0 },
            scale: { x:0, y:0, z:0 },
            rotation: { x:0, y:0, z:0 },
        },
        //model location paths
        path: "models/parkour/trap/spike",
    },
}
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