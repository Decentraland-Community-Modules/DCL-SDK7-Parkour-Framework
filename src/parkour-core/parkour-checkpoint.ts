import { ColliderLayer, Entity, GltfContainer, Schemas, Transform, engine } from "@dcl/sdk/ecs";
import { Vector3 } from "@dcl/sdk/math";
import * as utils from '@dcl-sdk/utils'
import { CHECKPOINT_TYPES, CheckpointData, CheckpointDataObject } from "./data/checkpoint-data";
/** defines callback blueprint that will be called upon checkpoint entry */
type ParkourCheckpointCallback = () => void;
/** component data def, this will exist attached on the object's entity as a component */
export const ParkourCheckpointData = { 
    /** true when this object is rendered in the scene */
    isActive:Schemas.Boolean,
    /** true when this object is the current checkpoint */
    isCurrent:Schemas.Boolean,
    /** offset applied to respawn */
    respawnOffset:Schemas.Vector3,
    /** look direction */
    respawnLook:Schemas.Vector3,
}
/** represents the data capsule that makes up all the required info respawn placement */
export interface RespawnLocationData {
    respawnLocation: { x: number; y: number; z: number; }; 
    respawnLookDir: { x: number; y: number; z: number; };
}
/** define component, adding it to the engine as a managed behaviour */
export const ParkourCheckpointComponent = engine.defineComponent("ParkourCheckpointData", ParkourCheckpointData);
/*      PARKOUR CHECKPOINTS
    checkpoints are objects that can be placed around your map to provide the player with
    respawn points throughout a parkour course.

    NOTE: this system handles respawn location management internally, so you dont need to hookup
    those in the callbacks. callbacks are there if you want custom functionality tho (like sounds)

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export module ParkourCheckpoint
{
    //when true debug logs are generated (toggle off when you deploy)
    const isDebugging:boolean = false;

    /** currently active checkpoint */
    var checkpointCurrent:undefined|Entity = undefined;
    /** clears the current checkpoint */
    export function ClearCurrentCheckpoint() {
        //if checkpoint does exist, allow it to be claimed again
        if(checkpointCurrent != undefined)
            ParkourCheckpointComponent.getMutable(checkpointCurrent).isCurrent = false;
        //remove reference
        checkpointCurrent = undefined;
    }
    /** returns a data capsule representing the current respawn location */
    export function GetCurrentRespawnLocation():RespawnLocationData {
        //define default data packet
        var respawnData = {
            respawnLocation: { x:0, y:0, z:0, },
            respawnLookDir: { x:0, y:0, z:0, }
        };
        //attempt to populate data packet based on current checkpoint
        if(checkpointCurrent != undefined)
        {
            const transform = Transform.get(checkpointCurrent);
            const component = ParkourCheckpointComponent.get(checkpointCurrent);
            respawnData.respawnLocation.x = component.respawnOffset.x + transform.position.x;
            respawnData.respawnLocation.y = component.respawnOffset.y + transform.position.y;
            respawnData.respawnLocation.z = component.respawnOffset.z + transform.position.z;
            respawnData.respawnLookDir = component.respawnLook;
        }
        //pass data
        return respawnData; 
    }

    /** pool of existing objects */
    var checkpointObjects:Entity[] = [];

    /** dictionary of all callbacks to be called when the player enters the checkpoint area */
    var checkpointObjectCallbacks:ParkourCheckpointCallback[] = [];
    /** registration for new callback */
    export function RegisterCallback(callback:ParkourCheckpointCallback) {
        //add callback to listing
        checkpointObjectCallbacks.push(callback);
    }

    /** creates a new checkpoint object, returning reference to its entity (this handles the creation of the entity as well so ns can handle pooling) */
    export function Create(type:CHECKPOINT_TYPES):Entity {
        //attempt to get type def
        var def:CheckpointDataObject|undefined = CheckpointData.find(item => item.id === type);
        //ensure def was found
        if(def === undefined) {
            console.error("Parkour Checkpoint: create() failed, could not find given type='"+type.toString()+"' in data, check you data IDs");
            def = CheckpointData[0];
        }

        //attempt to find an existing unused object
        for (let i = 0; i < checkpointObjects.length; i++) {
            if(!ParkourCheckpointComponent.get(checkpointObjects[i]).isActive) {   
                if(isDebugging) console.log("Parkour Checkpoint: recycled unused checkpoint object, type="+type);
                //re-enable and re-type unused object from pooling
                return SetType(checkpointObjects[i], type);
            }
        }

        //create object
        //  create entity
        const entity = engine.addEntity();
        Transform.create(entity);
        //  add custom model
        GltfContainer.create(entity, {
            src: def.path,
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });
        //MeshRenderer.setBox(entity);
        //  add component, initialized by type
        ParkourCheckpointComponent.create(entity,{
            isActive: true,
            isCurrent: false,
        });
        //  add trigger area
        utils.triggers.addTrigger(entity, 
            utils.NO_LAYERS, //object's own layer
            utils.LAYER_1, //layer that triggers object
            //placement details 
            [{
                type: 'box',
                position: Vector3.create(def.area.position.x,def.area.position.y,def.area.position.z),
                scale: Vector3.create(def.area.scale.x,def.area.scale.y,def.area.scale.z)
            }], 
            function(e) { CheckpointEntered(entity); }
        );
        
        //add entity to pooling
        checkpointObjects.push(entity);
        if(isDebugging) console.log("Parkour Checkpoint: created new checkpoint object, type="+type);
        //provide entity reference
        return entity;
    }

    /** called a checkpoint's trigger box is entered */
    function CheckpointEntered(entity:Entity) {
        //get component
        const component = ParkourCheckpointComponent.getMutable(entity);
        if(isDebugging) console.log("Parkour Checkpoint: checkpoint entered...");

        //ensure checkpoint is active (included in game)
        if(!component.isActive) return;
        //ensure checkpoint is not already set as the current checkpoint
        if(component.isCurrent) return;

        //clear previous checkpoint
        ClearCurrentCheckpoint();
        //set this entity as the new checkpoint
        checkpointCurrent = entity;
        component.isCurrent = true;

        //process all callbacks
        for (var i: number = 0; i < checkpointObjectCallbacks.length; i++) {
            checkpointObjectCallbacks[i]();
        }
        if(isDebugging) console.log("Parkour Checkpoint: checkpoint set as new active respawn location!");
    }

    /** redefines the type of the given checkpoint object */
    function SetType(entity:Entity, type:CHECKPOINT_TYPES):Entity {
        //attempt to get type def
        var def:CheckpointDataObject|undefined = CheckpointData.find(item => item.id === type);
        //ensure def was found
        if(def === undefined) {
            console.error("Parkour Checkpoint: set() failed, could not find given type='"+type.toString()+"' in data, check you data IDs");
            def = CheckpointData[0];
        }
        //  replace custom model
        GltfContainer.createOrReplace(entity, {
            src: def.path,
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });
        //resize trigger area
        utils.triggers.setAreas(entity,
            [{
                type: 'box',
                position: Vector3.create(def.area.position.x,def.area.position.y,def.area.position.z),
                scale: Vector3.create(def.area.scale.x,def.area.scale.y,def.area.scale.z)
            }]
        );
        //get component from object
        const component = ParkourCheckpointComponent.getMutable(entity);
        //prepare component
        component.isActive = true;
        component.isCurrent = false
        return entity;
    }

    /** removes all objects from the game */
    export function RemoveAll() {
        //remove current checkpoint
        ClearCurrentCheckpoint();
        //parse all objects
        for (let i = 0; i < checkpointObjects.length; i++) {
            Remove(checkpointObjects[i]);
        }
    }
    /** removes given object from game, but does not get removed from engine (remaining in pool ) */
    export function Remove(entity:Entity) {
        const component = ParkourCheckpointComponent.getMutable(entity);
        //disable via component
        component.isActive = false;
        component.isCurrent = false;
        //hide object (soft remove work-around)
        Transform.getMutable(entity).scale = { x:0, y:0, z:0 }; 
    }

    /** removes all objects from the game */
    export function DestroyAll() {
        //remove current checkpoint
        ClearCurrentCheckpoint();
        //parse all objects
        for (let i = 0; i < checkpointObjects.length; i++) {
            Destroy(checkpointObjects[i]);
        }
    }
    /** removes given object from game scene and engine */
    export function Destroy(entity:Entity) {
        Destroy(entity);
    }
}