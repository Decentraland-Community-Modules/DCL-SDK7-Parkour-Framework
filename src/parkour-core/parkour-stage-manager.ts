import { Vector3 } from "@dcl/sdk/math";
import { movePlayerTo } from "~system/RestrictedActions";
import { List } from "../utilities/collections";
import { STAGE_NAME, StageDataObject, StageConfig, StagePlatformStaticDataObject, StagePlatformBlinkingDataObject, StagePlatformRotatingDataObject, StagePlatformMovingDataObject, StageCollectibleDataObject, StageCheckpointDataObject, StageTrapDataObject } from "./config/stage-config";
import { CollectibleDataObject, CollectibleData } from "./data/collectible-data";
import { PLATFORM_TYPE } from "./data/platform-data";
import { ParkourCheckpoint } from "./parkour-checkpoint";
import { ParkourCollectible } from "./parkour-collectible";
import { ParkourPlatform } from "./parkour-platforms";
import { ParkourScoring } from "./parkour-scoring.ui";
import { ParkourTrap } from "./parkour-trap";
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
    const isDebugging:boolean = false;
    /** hard-coded tag for module, helps log search functionality */
    const debugTag:string = "Parkour Stage Manager: ";

    /** when true will automatically spawn player at the first spawnpoint created in the game */
    const forceRespawn:boolean = true;

    /** cur parkour stage being processed compared to game stage */
    var curGameStage:number = 0;
    /** cur stage type currently being displayed */
    var curStage:STAGE_NAME;

    /** internal counter for total number of collectibles */
    var collectibleCount:number = 0;
    /** internal counter for max possible score obtainable by gathering collectibles */
    var collectibleScoreMax:number = 0;

    /** chain of all stages that should be completed before the enitre game is finished */
    export var GameStages:STAGE_NAME[] = [];

    /** defines callback blueprint for stage competion callbacks */
    type ParkourStageCompleteCallback = () => void;
    /** all callbacks here are called when the stage is completed */
    var stageCompletedCallbacks:List<ParkourStageCompleteCallback> = new List<ParkourStageCompleteCallback>();
    /** registration for new stage completion callback */
    export function RegisterCallbackCompletedStage(callback:ParkourStageCompleteCallback) {
        stageCompletedCallbacks.addItem(callback);
    }

    /** defines callback blueprint for game competion callbacks */
    type ParkourGameCompleteCallback = () => void;
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
    export function SetStage(stage:STAGE_NAME) {
        if(isDebugging) console.log(debugTag+"attempting to set new stage="+stage+"...");
        //clear previous stage
        DisableStageObjects();
        
        //attempt to get stage def
        var defStage:StageDataObject|undefined = StageConfig.find(item => item.ID === stage);
        //ensure def was found
        if(defStage === undefined) {
            console.error(debugTag+"set() failed, could not find given type='"+stage.toString()+"' in data, check you data IDs");
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
        for (const trap of defStage.traps) {
            PrepareTrap(trap);
        }

        //clear current checkpoint
        ParkourCheckpoint.CurrentCheckpoint = undefined;
        //generate all checkpoints
        for (const checkpoint of defStage.checkpoints) {
            PrepareCheckpoint(checkpoint);
        }

        //reset scoring manager
        ParkourScoring.ResetScore(collectibleCount, collectibleScoreMax);

        //if enforcing spawn on game start, spawn player at current checkpoint
        if(forceRespawn) PlayerRespawn(ParkourCheckpoint.GetCurrentRespawnLocation());

        //update current stage
        curStage = stage;
        if(isDebugging) console.log(debugTag+"set new stage="+stage+"!");
    }

    /** prepares a new static platform */
    export function PreparePlatformStatic(data: StagePlatformStaticDataObject) {
        //create new platfrom object
        ParkourPlatform.Create({
            type: PLATFORM_TYPE.STATIC, 
            style: data.style,
            //position
            position: data.transform.position,
            scale: data.transform.scale,
            rotation: data.transform.rotation,
        });

        if(isDebugging) console.log(debugTag+"added new static platform to stage, style="+data.style+
            "\n\tpos(x="+data.transform.position.x+", y="+data.transform.position.y+", z="+data.transform.position.z+")"
        );
    }
    
    /** prepares a new blinking platform */
    export function PreparePlatformBlinking(data: StagePlatformBlinkingDataObject) {
        //create new platfrom object
        ParkourPlatform.Create({
            type: PLATFORM_TYPE.BLINKING, 
            style: data.style,
            //position
            position: data.transform.position,
            scale: data.transform.scale,
            rotation: data.transform.rotation,
            //settings
            timeStart: data.settings.timeOn,
            timeOn: data.settings.timeOn,
            timeOff: data.settings.timeOn,
        });

        if(isDebugging) console.log(debugTag+"added new blinking platform to stage, style="+data.style+
            "\n\tpos(x="+data.transform.position.x+", y="+data.transform.position.y+", z="+data.transform.position.z+")"
        );
    }
    
    /** prepares a new rotating platform */
    export function PreparePlatformRotating(data: StagePlatformRotatingDataObject) {
        //create new platfrom object
        ParkourPlatform.Create({
            type: PLATFORM_TYPE.ROTATING, 
            style: data.style,
            //position
            position: data.transform.position,
            scale: data.transform.scale,
            rotation: data.transform.rotation,
            //settings
            speedX: data.settings.speedX,
            speedY: data.settings.speedY,
            speedZ: data.settings.speedZ,
        });

        if(isDebugging) console.log(debugTag+"added new rotating platform to stage, style="+data.style+
            "\n\tpos(x="+data.transform.position.x+", y="+data.transform.position.y+", z="+data.transform.position.z+")"
        );
    }
    
    /** prepares a new moving platform */
    export function PreparePlatformMoving(data: StagePlatformMovingDataObject) {
        //create new platfrom object
        ParkourPlatform.Create({
            type: PLATFORM_TYPE.MOVING, 
            style: data.style,
            //position
            position: data.transform.position,
            scale: data.transform.scale,
            rotation: data.transform.rotation,
            //settings
            speed: data.settings.speed,
            waypoints: data.settings.waypoints,
        });

        if(isDebugging) console.log(debugTag+"added new moving platform to stage, style="+data.style+
            "\n\tpos(x="+data.transform.position.x+", y="+data.transform.position.y+", z="+data.transform.position.z+")"
        );
    }

    /** prepares a new collectible */
    export function PrepareCollectible(data:StageCollectibleDataObject) {
        //create new collectible object
        ParkourCollectible.Create({
            type: data.type,
            position: data.transform.position,
            scale: data.transform.scale,
            rotation: data.transform.rotation,
        });
        //attempt to get type def
        var collectibleDef:CollectibleDataObject|undefined = CollectibleData.find(item => item.id === data.type);
        //ensure def was found
        if(collectibleDef === undefined) {
            console.error(debugTag+"set() failed, could not find given collectible type='"+data.type.toString()+"' in data, check you data IDs");
            collectibleDef = CollectibleData[0];
        }
        //add to required score
        collectibleCount++;
        collectibleScoreMax += collectibleDef.value;

        if(isDebugging) console.log(debugTag+"added new collectible to stage, type="+data.type+
            "\n\tpos(x="+data.transform.position.x+", y="+data.transform.position.y+", z="+data.transform.position.z+")"
        );
    }

    /** prepares a new trap */
    export function PrepareTrap(data:StageTrapDataObject) {
        //create new collectible object
        ParkourTrap.Create({
            type: data.type,
            position: data.transform.position,
            scale: data.transform.scale,
            rotation: data.transform.rotation,
        });

        if(isDebugging) console.log(debugTag+"added new trap to stage, type="+data.type+
            "\n\tpos(x="+data.transform.position.x+", y="+data.transform.position.y+", z="+data.transform.position.z+")"
        );
    }

    /** prepares a new checkpoint */
    export function PrepareCheckpoint(data: StageCheckpointDataObject) {
        //create new checkpoint object
        const checkpoint = ParkourCheckpoint.Create({
            type: data.style,
            //position
            position: data.transform.position,
            scale: data.transform.scale,
            rotation: data.transform.rotation,
            //respawn
            respawnPos: data.settings.respawnOffset,
            respawnRot: data.settings.respawnDirection
        });

        //ensure checkpoint is set to the first checkpoint created for the stage
        if(ParkourCheckpoint.CurrentCheckpoint == undefined) ParkourCheckpoint.CurrentCheckpoint = checkpoint;

        if(isDebugging) console.log(debugTag+"added new checkpoint to stage, style="+data.style+
            "\n\tpos(x="+data.transform.position.x+", y="+data.transform.position.y+", z="+data.transform.position.z+")"
        );
    }

    /** called when a stage is completed */
    export function CompleteStage() {
        if(isDebugging) console.log(debugTag+"current stage="+curStage+" completed!");

        //push to next game stage
        curGameStage++;

        //next game stage exists
        if(curGameStage < GameStages.length) {
            if(isDebugging) console.log(debugTag+"starting next stage...");
            //call all stage completion callbacks
            for (var i: number = 0; i < stageCompletedCallbacks.size(); i++) {
                stageCompletedCallbacks.getItem(i)();
            }
            //start next stage
            SetStage(GameStages[curGameStage]);
        }
        //game is completed
        else {
            if(isDebugging) console.log(debugTag+"game has been completed!");
            //call all game completion callbacks
            for (var i: number = 0; i < gameCompletedCallbacks.size(); i++) {
                gameCompletedCallbacks.getItem(i)();
            }
            //clear stage
            DisableStageObjects();
        }
    }

    /** resets all parkour object on the current field and parkour scoring value */
    export function ResetStage() {
        SetStage(GameStages[curGameStage]);
    }

    /** disables all parkour objects from the field (objs still exist in-scene) and hides parkour scoring */
    export function DisableStageObjects() {
        if(isDebugging) console.log(debugTag+"disabling all stage objects...");
        //hide all platforms
        ParkourPlatform.DisableAll();
        //hide all collectibles
        ParkourCollectible.DisableAll();
        //hide all traps
        ParkourTrap.DisableAll();
        //hide all checkpoints
        ParkourCheckpoint.DisableAll();
        //hide scoring system
        ParkourScoring.SetDisplayState(false);
        if(isDebugging) console.log(debugTag+"disabled all stage objects!");
    }

    /** destroys all parkour objects from the field (objs are removed from scene) and hides parkour scoring */
    export function DestroyStageObjects() {
        if(isDebugging) console.log(debugTag+"destroying all stage objects...");
        //destroy all platforms
        ParkourPlatform.DestroyAll();
        //destroy all collectibles
        ParkourCollectible.DestroyAll();
        //destroy all traps
        ParkourTrap.DestroyAll();
        //destroy all checkpoints
        ParkourCheckpoint.DestroyAll();
        if(isDebugging) console.log(debugTag+"destroyed all stage objects!");
    }

    /** respawns the player at their last checkpoint */
    export function PlayerRespawn(respawnData:ParkourCheckpoint.RespawnLocationData) {
        //place player based on respawn data
        movePlayerTo({
            newRelativePosition: Vector3.create(respawnData.respawnLocation.x,respawnData.respawnLocation.y,respawnData.respawnLocation.z),
            cameraTarget: Vector3.create(respawnData.respawnLookDir.x,respawnData.respawnLookDir.y,respawnData.respawnLookDir.z),
        })
    }
}