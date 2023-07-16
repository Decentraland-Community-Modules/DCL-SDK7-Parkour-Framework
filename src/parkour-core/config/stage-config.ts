import { COLLECTIBLE_TYPE } from "../data/collectible-data";
import { PLATFORM_STYLE_TYPE, PLATFORM_TYPE } from "../data/platform-data";


/** defines call-linkage for all available stages */
export enum STAGE_TYPE {
    STAGE_0 = "stage_0",
    STAGE_1 = "stage_1",
    STAGE_2 = "stage_2",
}

/** ensure standardization between all data objects 
 * (you can ignore this unless you want to mod the object's data def) 
 */
export interface StageDataObject {
    id: string,
    platformsStatic: StagePlatformStaticDataObject[],
    platformsBlinking: StagePlatformBlinkingDataObject[],
    platformsRotating: StagePlatformRotatingDataObject[],
    platformsMoving: StagePlatformMovingDataObject[],
    collectibles: StageCollectibleDataObject[],
    traps: StageTrapDataObject[],
}
//static platforms
export interface StagePlatformStaticDataObject {
    style: PLATFORM_STYLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; w:number; };
    };
}
//blinking platforms
export interface StagePlatformBlinkingDataObject {
    style: PLATFORM_STYLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; w:number; };
    };
    settings: { timeStart: number; timeOn: number; timeOff: number; };
}
//rotating platforms
export interface StagePlatformRotatingDataObject {
    style: PLATFORM_STYLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; w:number; };
    };
    settings: { speedX: number; speedY: number; speedZ: number; };
}
//moving platforms
export interface StagePlatformWaypointDataObject { position: { x: number; y: number; z: number; }; }
export interface StagePlatformMovingDataObject {
    style: PLATFORM_STYLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; w:number; };
    };
    settings: { speed: number; waypoints:StagePlatformWaypointDataObject[]; };
}
//collectibles
export interface StageCollectibleDataObject {
    type: COLLECTIBLE_TYPE,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; w: number; };
    };
}
//traps
export interface StageTrapDataObject {
    type: string,
    transform: {
        position: { x: number; y: number; z: number; };
        scale: { x: number; y: number; z: number; };
        rotation: { x: number; y: number; z: number; w: number; };
    };
}

/*      STAGE CONFIG
    contains the setup details for each individual stage, defining what platforms,
    collectibles, and traps will be generated.

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export const StageConfig: StageDataObject[] = [
    //stage def
    {
        id:"stage_0", //name of stage
        //all platforms in stage
        //  statics
        platformsStatic: [
            { style:PLATFORM_STYLE_TYPE.WOOD, transform:{ position: { x:8, y:1.5, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } } },
        ],
        //  blinking
        platformsBlinking: [
            { style:PLATFORM_STYLE_TYPE.WOOD, transform:{ position: { x:8, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
                settings: { timeStart:0, timeOn:2, timeOff:2 } },
        ],
        //  rotating
        platformsRotating: [
            { style:PLATFORM_STYLE_TYPE.WOOD, transform:{ position: { x:8, y:1.5, z:10 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
            settings: { speedX:30, speedY:0, speedZ:0 } },
        ],
        //  moving
        platformsMoving: [
            { style:PLATFORM_STYLE_TYPE.WOOD, transform:{ position: { x:8, y:1.5, z:14 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
            settings: { speed:0.5, waypoints: [
                {position: { x:8, y:1.5, z:14 }}, {position: { x:8, y:5.5, z:14 }}, 
            ]} 
            },
        ],
        //all collectibles in stage
        collectibles: [
            { type:COLLECTIBLE_TYPE.COPPER, transform:{ position: { x:2, y:1.5, z:2 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0, w:0 } } },
        ],
        //all traps in stage
        traps: []
    },
    {
        id:"stage_1",
        //all platforms in stage
        platformsStatic: [
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:8, y:1.5, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } } },
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:12, y:2, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } } },
        ],
        //  blinking
        platformsBlinking: [
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:8, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
                settings: { timeStart:0, timeOn:2, timeOff:2 } },
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:12, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
                settings: { timeStart:2, timeOn:2, timeOff:2 } },
        ],
        //  rotating
        platformsRotating: [
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:8, y:1.5, z:10 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
            settings: { speedX:-20, speedY:0, speedZ:30 } },
        ],
        //  moving
        platformsMoving: [
            { style:PLATFORM_STYLE_TYPE.STONE, transform:{ position: { x:8, y:1.5, z:14 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
            settings: { speed:0.5, waypoints: [
                {position: { x:8, y:1.5, z:14 }}, {position: { x:14, y:3.5, z:14 }}, 
            ]} 
            },
        ],
        //all collectibles in stage
        collectibles: [
            { type:COLLECTIBLE_TYPE.COPPER, transform:{ position: { x:2, y:1.5, z:4 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0, w:0 } } },
            { type:COLLECTIBLE_TYPE.SILVER, transform:{ position: { x:4, y:1.5, z:4 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0, w:0 } } },
        ],
        //all traps in stage
        traps: []
    },
    {
        id:"stage_2",
        //all platforms in stage
        platformsStatic: [
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:8, y:1.5, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } } },
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:12, y:2, z:2 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } } },
        ],
        //  blinking
        platformsBlinking: [
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:8, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
                settings: { timeStart:0, timeOn:4, timeOff:2 } },
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:12, y:1.5, z:6 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
                settings: { timeStart:3, timeOn:4, timeOff:2 } },
        ],
        //  rotating
        platformsRotating: [
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:8, y:1.5, z:10 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
            settings: { speedX:20, speedY:0, speedZ:20 } },
        ],
        //  moving
        platformsMoving: [
            { style:PLATFORM_STYLE_TYPE.METAL, transform:{ position: { x:8, y:1.5, z:14 }, scale: { x:1, y:1, z:1 }, rotation: { x:0, y:0, z:0, w:0 } }, 
            settings: { speed:0.5, waypoints: [
                {position: { x:8, y:1.5, z:14 }}, {position: { x:2, y:6, z:14 }}, {position: { x:14, y:6, z:14 }}, 
            ]} 
            },
        ],
        //all collectibles in stage
        collectibles: [
            { type:COLLECTIBLE_TYPE.COPPER, transform:{ position: { x:2, y:1.5, z:6 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0, w:0 } } },
            { type:COLLECTIBLE_TYPE.SILVER, transform:{ position: { x:4, y:1.5, z:6 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0, w:0 } } },
            { type:COLLECTIBLE_TYPE.GOLD, transform:{ position: { x:6, y:1.5, z:6 }, scale: { x:0.25, y:0.25, z:0.25 }, rotation: { x:0, y:0, z:0, w:0 } } },
        ],
        //all traps in stage
        traps: []
    },
]