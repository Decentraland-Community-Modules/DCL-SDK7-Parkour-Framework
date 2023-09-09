/*      STAGE CONFIG
    contains the setup details for each individual stage, defining what platforms,
    collectibles, and traps will be generated when that stage is being displayed.

    ADD A NEW STAGE:
    1 - add a new stage id to 'STAGE_NAME' (this will be what you call your stage with)
    2 - add a new definition to 'stageConfig' (this represents all the pieces of your stage)

    you can also add additional functionality to your stage by modifying the provided interfaces.
    (this are basically just blueprints stating the required properties of each data object)

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/

import { Vector3 } from "@dcl/sdk/math";
import { CHECKPOINT_TYPES } from "../data/checkpoint-data";
import { COLLECTIBLE_TYPE } from "../data/collectible-data";
import { PLATFORM_STYLE_TYPE } from "../data/platform-data";
import { TRAP_TYPE } from "../data/trap-data";


/** IDs for all available stages */
export enum STAGE_NAME {
    STAGE_0 = "Stage 0",
    STAGE_1 = "Stage 1",
    STAGE_2 = "Stage 2",
}

//### PLATFORMS
//  static
export interface StagePlatformStaticDataObject {
    style: PLATFORM_STYLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; };
    };
}
//  blinking
export interface StagePlatformBlinkingDataObject {
    style: PLATFORM_STYLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; };
    };
    settings: { timeStart: number; timeOn: number; timeOff: number; };
}
//  rotating
export interface StagePlatformRotatingDataObject {
    style: PLATFORM_STYLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; };
    };
    //NOTE: speed is degrees per second
    settings: { speedX: number; speedY: number; speedZ: number; };
}
//  moving
export interface StagePlatformMovingDataObject {
    style: PLATFORM_STYLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; };
    };
    settings: { speed: number; waypoints:Vector3[]; };
}
//### COLLECTIBLES
export interface StageCollectibleDataObject {
    type: COLLECTIBLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; };
    };
}
//### TRAPS
export interface StageTrapDataObject {
    type: TRAP_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; };
    };
}
//### CHECKPOINTS
export interface StageCheckpointDataObject {
    style: CHECKPOINT_TYPES,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; };
    };
    settings: { respawnOffset: { x: number; y: number; z:number; }; respawnDirection: { x: number; y: number; z: number; };  };
}
/** ensure standardization between all data objects 
 * (you can ignore this unless you want to mod the object's data def) 
 */
export interface StageDataObject {
    ID: STAGE_NAME,
    platformsStatic: StagePlatformStaticDataObject[],
    platformsBlinking: StagePlatformBlinkingDataObject[],
    platformsRotating: StagePlatformRotatingDataObject[],
    platformsMoving: StagePlatformMovingDataObject[],
    collectibles: StageCollectibleDataObject[],
    traps: StageTrapDataObject[],
    checkpoints: StageCheckpointDataObject[],
}

export const StageConfig: StageDataObject[] = [
    //stage def
    {
        ID:STAGE_NAME.STAGE_0, //name of stage
        //all platforms in stage
        //  statics
        platformsStatic: [
            { style:PLATFORM_STYLE_TYPE.WOOD, transform:{ position: { x:8, y:1.5, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } } },
        ],
        //  blinking
        platformsBlinking: [
            { style:PLATFORM_STYLE_TYPE.WOOD, transform:{ position: { x:8, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { timeStart:0, timeOn:2, timeOff:2 } },
        ],
        //  rotating
        platformsRotating: [
            { style:PLATFORM_STYLE_TYPE.WOOD, transform:{ position: { x:8, y:1.5, z:10 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
            settings: { speedX:30, speedY:0, speedZ:0 } },
        ],
        //  moving
        platformsMoving: [
            { style:PLATFORM_STYLE_TYPE.WOOD, transform:{ position: { x:8, y:1.5, z:14 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
            settings: { speed:0.5, waypoints: [
                { x:8, y:1.5, z:14 },{ x:8, y:5.5, z:14 }, 
            ]} 
            },
        ],
        //all collectibles
        collectibles: [
            { type:COLLECTIBLE_TYPE.COPPER, transform:{ position: { x:8, y:2.5, z:2 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0 } } },
        ],
        //all traps
        traps: [
            { type:TRAP_TYPE.SPIKE, transform:{ position: { x:8, y:0, z:8 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } } }
        ],
        //all checkpoints
        checkpoints: [
            { style:CHECKPOINT_TYPES.METAL, transform:{ position: { x:2, y:0, z:5 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { respawnOffset: { x:0, y:1.5, z:0 }, respawnDirection: { x:8, y:2, z:5 } } },
            { style:CHECKPOINT_TYPES.METAL, transform:{ position: { x:2, y:0, z:8 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { respawnOffset: { x:0, y:1.5, z:0 }, respawnDirection: { x:8, y:2, z:8 } } },
        ],
    },
    {
        ID:STAGE_NAME.STAGE_1,
        //all platforms in stage
        platformsStatic: [
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:8, y:1.5, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } } },
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:12, y:3, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } } },
        ],
        //  blinking
        platformsBlinking: [
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:8, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { timeStart:0, timeOn:2, timeOff:2 } },
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:12, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { timeStart:2, timeOn:2, timeOff:2 } },
        ],
        //  rotating
        platformsRotating: [
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:8, y:1.5, z:10 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
            settings: { speedX:0, speedY:30, speedZ:0 } },
        ],
        //  moving
        platformsMoving: [
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:8, y:1.5, z:14 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
            settings: { speed:0.5, waypoints: [
                { x:8, y:1.5, z:14 }, { x:14, y:3.5, z:14 }, 
            ]} 
            },
        ],
        //all collectibles in stage
        collectibles: [
            { type:COLLECTIBLE_TYPE.COPPER, transform:{ position: { x:8, y:2.5, z:2 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0 } } },
            { type:COLLECTIBLE_TYPE.SILVER, transform:{ position: { x:12, y:4, z:2 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0 } } },
        ],
        //all traps
        traps: [

        ],
        //all checkpoints
        checkpoints: [
            { style:CHECKPOINT_TYPES.METAL, transform:{ position: { x:2, y:0, z:5 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { respawnOffset: { x:0, y:1.5, z:0 }, respawnDirection: { x:8, y:2, z:5 } } },
            { style:CHECKPOINT_TYPES.METAL, transform:{ position: { x:2, y:0, z:8 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { respawnOffset: { x:0, y:1.5, z:0 }, respawnDirection: { x:8, y:2, z:8 } } },
        ],
    },
    {
        ID:STAGE_NAME.STAGE_2,
        //all platforms in stage
        platformsStatic: [
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:8, y:1.5, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } } },
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:12, y:3, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } } },
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:12, y:4.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } } },
        ],
        //  blinking
        platformsBlinking: [
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:8, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { timeStart:0, timeOn:4, timeOff:2 } },
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:12, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { timeStart:3, timeOn:4, timeOff:2 } },
        ],
        //  rotating
        platformsRotating: [
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:8, y:1.5, z:10 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
            settings: { speedX:0, speedY:0, speedZ:30 } },
        ],
        //  moving
        platformsMoving: [
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:8, y:1.5, z:14 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
            settings: { speed:0.5, waypoints: [
                { x:8, y:1.5, z:14 }, { x:2, y:6, z:14 }, { x:14, y:6, z:14 }, 
            ]} 
            },
        ],
        //all collectibles in stage
        collectibles: [
            { type:COLLECTIBLE_TYPE.COPPER, transform:{ position: { x:8, y:2.5, z:2 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0 } } },
            { type:COLLECTIBLE_TYPE.SILVER, transform:{ position: { x:12, y:4, z:2 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0 } } },
            { type:COLLECTIBLE_TYPE.GOLD, transform:{ position: { x:12, y:5.5, z:6 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0 } } },
        ],
        //all traps
        traps: [

        ],
        //all checkpoints
        checkpoints: [
            { style:CHECKPOINT_TYPES.METAL, transform:{ position: { x:2, y:0, z:5 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { respawnOffset: { x:0, y:1.5, z:0 }, respawnDirection: { x:8, y:2, z:5 } } },
            { style:CHECKPOINT_TYPES.METAL, transform:{ position: { x:2, y:0, z:8 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0 } }, 
                settings: { respawnOffset: { x:0, y:1.5, z:0 }, respawnDirection: { x:8, y:2, z:8 } } },
        ],
    },
]