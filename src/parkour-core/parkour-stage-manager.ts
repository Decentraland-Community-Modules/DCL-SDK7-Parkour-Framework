import { Entity, Transform } from "@dcl/sdk/ecs";
import { Dictionary, List } from "../utilities/collections";
import { STAGE_TYPE, StageCheckpointDataObject, StageCollectibleDataObject, StageConfig, StageDataObject, StagePlatformBlinkingDataObject, StagePlatformMovingDataObject, StagePlatformRotatingDataObject, StagePlatformStaticDataObject } from "./config/stage-config";
import { CollectibleData, CollectibleDataObject } from "./data/collectible-data";
import { ParkourCollectible } from "./parkour-collectible";
import { ParkourScoring } from "./parkour-scoring.ui";
import { ParkourPlatform, ParkourPlatformBlinkingComponent, ParkourPlatformMovingComponent, ParkourPlatformMovingData, ParkourPlatformRotatingComponent } from "./parkour-platforms";
import { PLATFORM_TYPE } from "./data/platform-data";
import { Vector3 } from "@dcl/sdk/math";
import { ParkourCheckpoint, ParkourCheckpointComponent, RespawnLocationData } from "./parkour-checkpoint";
import { movePlayerTo } from "~system/RestrictedActions";

/** defines callback blueprint for stage competion callbacks */
type ParkourStageCompleteCallback = () => void;
/** defines callback blueprint for game competion callbacks */
type ParkourGameCompleteCallback = () => void;
/*     PARKOUR MANAGER
    this module handles the process of creating/resetting stages and directly interfaces
    with parkour scoring to update values/monitor stage progress. 
    
    sfx calls are also handled here, though you could easily split them apart if you
    wanted to manage them via your own system (just reassign the callbacks).

    TODO:
        set up platform parenting, recurssion is nearly in place
        add on-game-start calls (ex: push the player to the first checkpoint location of a map) 

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export module ParkourStageManager 
{
    //when true debug logs are generated (toggle off when you deploy)
    const isDebugging:boolean = true;

    /** cur parkour stage being processed compared to game stage */
    var curGameStage:number = 0;
    /** cur stage type currently being displayed */
    var curStage:STAGE_TYPE;

    /** internal counter for total number of collectibles */
    var collectibleCount:number = 0;
    /** internal counter for max possible score obtainable by gathering collectibles */
    var collectibleScoreMax:number = 0;

    /** chain of all stages that should be completed before the enitre game is finished */
    export var GameStages:STAGE_TYPE[] = [];

    /** all callbacks here are called when the stage is completed */
    var stageCompletedCallbacks:List<ParkourStageCompleteCallback> = new List<ParkourStageCompleteCallback>();
    /** registration for new stage completion callback */
    export function RegisterCallbackCompletedStage(callback:ParkourStageCompleteCallback) {
        stageCompletedCallbacks.addItem(callback);
    }

    /** all callbacks here are called when the game is completed */
    var gameCompletedCallbacks:List<ParkourGameCompleteCallback> = new List<ParkourGameCompleteCallback>();
    /** registration for new game completion callback */
    export function RegisterCallbackCompletedGame(callback:ParkourGameCompleteCallback) {
        gameCompletedCallbacks.addItem(callback);
    }

    /** starts the game from the first stage, automatically pushing to the next linked stage upon completing the previous one */
    export function StartGame() {
        //reset counter
        curGameStage = 0;
        //start first stage
        SetStage(GameStages[curGameStage]);
    }

    /** sets the current parkour stage being displayed and resets parkour scoring */
    export function SetStage(stage:STAGE_TYPE) {
        if(isDebugging) console.log("Parkour Manager: attempting to set new stage="+stage+"...");
        //clear previous stage
        ClearStage();
        
        //attempt to get stage def
        var defStage:StageDataObject|undefined = StageConfig.find(item => item.id === stage);
        //ensure def was found
        if(defStage === undefined) {
            console.error("Parkour Manager: set() failed, could not find given type='"+stage.toString()+"' in data, check you data IDs");
            defStage = StageConfig[0];
        }

        //reset scoring counters
        collectibleCount = 0;
        collectibleScoreMax = 0;

        //generate all platforms
        //  static
        for (const platform of defStage.platformsStatic) {
            PreparePlatformStatic(platform);
        }
        //  blinking
        for (const platform of defStage.platformsBlinking) {
            PreparePlatformBlinking(platform);
        }
        //  rotating
        for (const platform of defStage.platformsRotating) {
            PreparePlatformRotating(platform);
        }
        //  moving
        for (const platform of defStage.platformsMoving) {
            PreparePlatformMoving(platform);
        }
        
        //generate all collectibles
        for (const collectible of defStage.collectibles) {
            PrepareCollectible(collectible);
        }
        
        //generate all traps

        //generate all checkpoints
        for (const checkpoint of defStage.checkpoints) {
            PrepareCheckpoint(checkpoint);
        }

        //reset scoring manager
        ParkourScoring.ResetScore(collectibleCount, collectibleScoreMax);

        //update current stage
        curStage = stage;
        if(isDebugging) console.log("Parkour Manager: set new stage="+stage+"!");
    }

    /** prepares a new static platform */
    export function PreparePlatformStatic(platform: StagePlatformStaticDataObject, parent:undefined|Entity = undefined) {
        //create new platfrom object
        const entityPlatform:Entity = ParkourPlatform.Create(PLATFORM_TYPE.STATIC, platform.style);
        //position platfrom
        const entityTransform = Transform.getMutable(entityPlatform);
        entityTransform.parent = parent;
        entityTransform.position = platform.transform.position;
        entityTransform.scale = platform.transform.scale;
        entityTransform.rotation = platform.transform.rotation;
        if(isDebugging) console.log("Parkour Manager: added new platform to stage, \n\ttype="+PLATFORM_TYPE.STATIC+
            "\n\tpos(x="+entityTransform.position.x+", y="+entityTransform.position.y+", z="+entityTransform.position.z+"), "+
            "\n\tscale(x="+entityTransform.scale.x+", y="+entityTransform.scale.y+", z="+entityTransform.scale.z+")"
        );
        //process all children

    }
    
    /** prepares a new blinking platform */
    export function PreparePlatformBlinking(platform: StagePlatformBlinkingDataObject, parent:undefined|Entity = undefined) {
        if(isDebugging) console.log("Parkour Manager: adding new platform to stage, \n\ttype="+PLATFORM_TYPE.BLINKING+"...");
        //create new platfrom object
        const entityPlatform:Entity = ParkourPlatform.Create(PLATFORM_TYPE.BLINKING, platform.style);
        //load in component settings
        const component = ParkourPlatformBlinkingComponent.getMutable(entityPlatform);
        component.isOn = false;
        component.timeDelta = platform.settings.timeStart;
        component.timeOn = platform.settings.timeOn;
        component.timeOff = platform.settings.timeOff;
        component.sizeScale = platform.transform.scale;
        //position platfrom
        const entityTransform = Transform.getMutable(entityPlatform);
        entityTransform.parent = parent;
        entityTransform.position = platform.transform.position;
        entityTransform.scale = platform.transform.scale;
        entityTransform.rotation = platform.transform.rotation;
        if(isDebugging) console.log("Parkour Manager: added new platform to stage, \n\ttype="+PLATFORM_TYPE.BLINKING+
            "\n\tpos(x="+entityTransform.position.x+", y="+entityTransform.position.y+", z="+entityTransform.position.z+"), "+
            "\n\tscale(x="+entityTransform.scale.x+", y="+entityTransform.scale.y+", z="+entityTransform.scale.z+")"
        );
        //process all children

        //activate component
        component.isProcessing = true;
    }
    
    /** prepares a new rotating platform */
    export function PreparePlatformRotating(platform: StagePlatformRotatingDataObject, parent:undefined|Entity = undefined) {
        if(isDebugging) console.log("Parkour Manager: adding new platform to stage, \n\ttype="+PLATFORM_TYPE.ROTATING+"...");
        //create new platfrom object
        const entityPlatform:Entity = ParkourPlatform.Create(PLATFORM_TYPE.ROTATING, platform.style);
        //load in component settings
        const component = ParkourPlatformRotatingComponent.getMutable(entityPlatform);
        component.speedX = platform.settings.speedX;
        component.speedY = platform.settings.speedY;
        component.speedZ = platform.settings.speedZ;
        //position platfrom
        const entityTransform = Transform.getMutable(entityPlatform);
        entityTransform.parent = parent;
        entityTransform.position = platform.transform.position;
        entityTransform.scale = platform.transform.scale;
        entityTransform.rotation = platform.transform.rotation;
        if(isDebugging) console.log("Parkour Manager: added new platform to stage, \n\ttype="+PLATFORM_TYPE.ROTATING+
            "\n\tpos(x="+entityTransform.position.x+", y="+entityTransform.position.y+", z="+entityTransform.position.z+"), "+
            "\n\tscale(x="+entityTransform.scale.x+", y="+entityTransform.scale.y+", z="+entityTransform.scale.z+")"
        );
        //process all children

        //activate component
        component.isProcessing = true;
    }
    
    /** prepares a new moving platform */
    export function PreparePlatformMoving(platform: StagePlatformMovingDataObject, parent:undefined|Entity = undefined) {
        if(isDebugging) console.log("Parkour Manager: adding new platform to stage, \n\ttype="+PLATFORM_TYPE.MOVING+"...");
        //create new platfrom object
        const entityPlatform:Entity = ParkourPlatform.Create(PLATFORM_TYPE.MOVING, platform.style);
        //load in component settings
        const component = ParkourPlatformMovingComponent.getMutable(entityPlatform);
        component.indexCur = 0;
        component.speed = platform.settings.speed;
        component.waypoints = [];
        for (let i = 0; i < platform.settings.waypoints.length; i++) {
            component.waypoints.push(Vector3.create(
                platform.settings.waypoints[i].position.x,
                platform.settings.waypoints[i].position.y,
                platform.settings.waypoints[i].position.z
            ));
        }
        //position platfrom
        const entityTransform = Transform.getMutable(entityPlatform);
        entityTransform.parent = parent;
        entityTransform.position = platform.transform.position;
        entityTransform.scale = platform.transform.scale;
        entityTransform.rotation = platform.transform.rotation;
        if(isDebugging) console.log("Parkour Manager: added new platform to stage, \n\ttype="+PLATFORM_TYPE.MOVING+
            "\n\tpos(x="+entityTransform.position.x+", y="+entityTransform.position.y+", z="+entityTransform.position.z+"), "+
            "\n\tscale(x="+entityTransform.scale.x+", y="+entityTransform.scale.y+", z="+entityTransform.scale.z+")"
        );
        //process all children

        //activate component
        component.isProcessing = true;
    }

    /** prepares a new collectible */
    export function PrepareCollectible(collectible:StageCollectibleDataObject) {
        //attempt to get type def
        var collectibleDef:CollectibleDataObject|undefined = CollectibleData.find(item => item.id === collectible.type);
        //ensure def was found
        if(collectibleDef === undefined) {
            console.error("Parkour Manager: set() failed, could not find given collectible type='"+collectible.type.toString()+"' in data, check you data IDs");
            collectibleDef = CollectibleData[0];
        }
        //create new collectible object
        const entityCollectible:Entity = ParkourCollectible.Create(collectible.type);
        //position collectible
        const entityTransform = Transform.getMutable(entityCollectible);
        entityTransform.position = collectible.transform.position;
        entityTransform.scale = collectible.transform.scale;
        entityTransform.rotation = collectible.transform.rotation;
        if(isDebugging) console.log("Parkour Manager: added new collectible to stage, \n\ttype="+collectible.type+
            "\n\tpos(x="+entityTransform.position.x+", y="+entityTransform.position.y+", z="+entityTransform.position.z+"), "+
            "\n\tscale(x="+entityTransform.scale.x+", y="+entityTransform.scale.y+", z="+entityTransform.scale.z+")"
        );
        //add to required score
        collectibleCount++;
        collectibleScoreMax += collectibleDef.value;
    }

    /** prepares a new checkpoint */
    export function PrepareCheckpoint(checkpoint: StageCheckpointDataObject) {
        if(isDebugging) console.log("Parkour Manager: adding new checkpoint to stage, \n\tstyle="+checkpoint.style+"...");
        //create new checkpoint object
        const entityCheckpoint:Entity = ParkourCheckpoint.Create(checkpoint.style);
        //load in component settings
        const component = ParkourCheckpointComponent.getMutable(entityCheckpoint);
        component.respawnOffset = checkpoint.settings.respawnOffset;
        component.respawnLook = checkpoint.settings.respawnOffset;
        //position checkpoint
        const entityTransform = Transform.getMutable(entityCheckpoint);
        entityTransform.position = checkpoint.transform.position;
        entityTransform.scale = checkpoint.transform.scale;
        entityTransform.rotation = checkpoint.transform.rotation;
        if(isDebugging) console.log("Parkour Manager: added new checkpoint to stage, \n\tstyle="+checkpoint.style+
            "\n\tpos(x="+entityTransform.position.x+", y="+entityTransform.position.y+", z="+entityTransform.position.z+"), "+
            "\n\tscale(x="+entityTransform.scale.x+", y="+entityTransform.scale.y+", z="+entityTransform.scale.z+")"
        );
    }

    /** called when a stage is completed */
    export function CompleteStage() {
        if(isDebugging) console.log("Parkour Manager: current stage="+curStage+" completed!");

        //push to next game stage
        curGameStage++;

        //next game stage exists
        if(curGameStage < GameStages.length) {
            if(isDebugging) console.log("Parkour Manager: starting next stage...");
            //call all stage completion callbacks
            for (var i: number = 0; i < stageCompletedCallbacks.size(); i++) {
                stageCompletedCallbacks.getItem(i)();
            }
            //start next stage
            SetStage(GameStages[curGameStage]);
        }
        //game is completed
        else {
            if(isDebugging) console.log("Parkour Manager: game has been completed!");
            //call all game completion callbacks
            for (var i: number = 0; i < gameCompletedCallbacks.size(); i++) {
                gameCompletedCallbacks.getItem(i)();
            }
            //clear stage
            ClearStage();
        }
    }

    /** resets all parkour object on the current field and parkour scoring value */
    export function ResetStage() {
        SetStage(GameStages[curGameStage]);
    }

    /** clears all parkour objects from the field (objs still exist in-scene) and hides parkour scoring */
    export function ClearStage() {
        //hide all platforms
        ParkourPlatform.RemoveAll();
        //hide all collectibles
        ParkourCollectible.RemoveAll();
        //hide all traps

        //hide all checkpoints
        ParkourCheckpoint.RemoveAll();
        //hide scoring system
        ParkourScoring.SetDisplayState(false);
    }

    /** clears all parkour objects from the field (objs are removed from scene) and hides parkour scoring */
    export function CleanStage() {
        //destroy all platforms
        ParkourPlatform.DestroyAll();
        //destroy all collectibles
        ParkourCollectible.DestroyAll();
        //destroy all traps
        
        //destroy all checkpoints
        ParkourCheckpoint.DestroyAll();
    }

    /** respawns the player at their last checkpoint */
    export function PlayerRespawn(respawnData:RespawnLocationData) {
        //place player based on respawn data
        movePlayerTo({
          newRelativePosition: Vector3.create(respawnData.respawnLocation.x,respawnData.respawnLocation.y,respawnData.respawnLocation.z),
          cameraTarget: Vector3.create(respawnData.respawnLookDir.x,respawnData.respawnLookDir.y,respawnData.respawnLookDir.z),
        })
    }
}