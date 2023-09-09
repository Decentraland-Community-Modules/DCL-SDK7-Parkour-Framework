import * as utils from '@dcl-sdk/utils'
import { CHECKPOINT_TYPES, CheckpointData, CheckpointDataObject } from "./data/checkpoint-data";
import { ColliderLayer, EngineInfo, Entity, GltfContainer, MeshRenderer, Schemas, Transform, engine } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from '@dcl/sdk/math';
/*      PARKOUR CHECKPOINTS
    checkpoints are objects that can be placed around your map to provide the player with
    respawn points throughout a parkour course.

    NOTE: there 2 major pieces that are managed here that make up an object
        1 - display entity, in-game object that the player sees/interacts with
        2 - component data, this is attatched to the display entity (provides access to object's id/type)

    NOTE: this system handles respawn location management internally, so you dont need to hookup
        those in the callbacks. callbacks are there if you want custom functionality tho (like a life counter)

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export module ParkourCheckpoint
{
    //when true debug logs are generated (toggle off when you deploy)
    const isDebugging:boolean = false;
    /** hard-coded tag for module, helps log search functionality */
    const debugTag:string = "Parkour Checkpoint: ";

    /** display entity to show which respawn is currently active */
    const respawnPreviewEntity: Entity = engine.addEntity();
    const respawnPreviewScale: Vector3 = {x:0.65,y:0.05,z:0.65};
    Transform.create(respawnPreviewEntity, {position:{x:8,y:-1,z:8},scale:{x:0,y:0,z:0}});
    MeshRenderer.setCylinder(respawnPreviewEntity);

    /** pool of existing objects */
    var pooledObjects:Entity[] = [];

    /** currently active checkpoint */
    export var CurrentCheckpoint:undefined|Entity = undefined;

    /** defines callback blueprint that will be called upon checkpoint entry */
    type ParkourCheckpointCallback = () => void;
    /** all callbacks to be called when the player enters the checkpoint area */
    var checkpointObjectCallbacks:ParkourCheckpointCallback[] = [];
    /** registration for new callback */
    export function RegisterCallback(callback:ParkourCheckpointCallback) {
        //add callback to listing
        checkpointObjectCallbacks.push(callback);
    }

    /** represents the data capsule that makes up all the required info respawn placement */
    export interface RespawnLocationData {
        respawnLocation: { x: number; y: number; z: number; }; 
        respawnLookDir: { x: number; y: number; z: number; };
    }

    /** object interface used to define all data required to create a new object */
    export interface ParkourCheckpointCreationData {
        //type
        type: CHECKPOINT_TYPES;
        //position
        position: { x:number; y:number; z:number; }; 
        scale: { x:number; y:number; z:number; };
        rotation: { x:number; y:number; z:number; };
        //respawn details
        respawnPos: { x:number; y:number; z:number; }; 
        respawnRot: { x:number; y:number; z:number; };
    }

    /** component data def, this will exist attached on the object's entity as a component */
    export const ParkourCheckpointComponentData = { 
        /** true when this object is rendered in the scene */
        isActive:Schemas.Boolean,
        /** true when this object is the current checkpoint */
        isCurrent:Schemas.Boolean,
        /** offset applied to respawn */
        respawnOffset:Schemas.Vector3,
        /** look direction */
        respawnLook:Schemas.Vector3,
    }
    /** define component, adding it to the engine as a managed behaviour */
    export const ParkourCheckpointComponent = engine.defineComponent("ParkourCheckpointComponentData", ParkourCheckpointComponentData);

    /** clears the current checkpoint */
    export function ClearCurrentCheckpoint() {
        //if checkpoint does exist, allow it to be claimed again
        if(CurrentCheckpoint != undefined)
            ParkourCheckpointComponent.getMutable(CurrentCheckpoint).isCurrent = false;
        //remove reference
        CurrentCheckpoint = undefined;
        //hide preview object
        const transform = Transform.getMutable(respawnPreviewEntity);
        transform.parent = undefined;
        transform.position = { x:8, y:-1, z:8 };
        transform.scale = { x:0, y:0, z:0 };
    }

    /** returns a data capsule representing the current respawn location */
    export function GetCurrentRespawnLocation():RespawnLocationData {
        //define default data packet
        var respawnData = {
            respawnLocation: { x:0, y:0, z:0, },
            respawnLookDir: { x:0, y:0, z:0, }
        };
        //attempt to populate data packet based on current checkpoint
        if(CurrentCheckpoint != undefined)
        {
            const transform = Transform.get(CurrentCheckpoint);
            const component = ParkourCheckpointComponent.get(CurrentCheckpoint);
            respawnData.respawnLocation.x = component.respawnOffset.x + transform.position.x;
            respawnData.respawnLocation.y = component.respawnOffset.y + transform.position.y;
            respawnData.respawnLocation.z = component.respawnOffset.z + transform.position.z;
            respawnData.respawnLookDir = component.respawnLook;
        }
        //pass data
        return respawnData; 
    }

    /** called a checkpoint's trigger box is entered */
    function CheckpointEntered(entity:Entity) {
        //get component
        const component = ParkourCheckpointComponent.getMutable(entity);
        if(isDebugging) console.log(debugTag+"checkpoint entered...");

        //ensure checkpoint is active (included in game)
        if(!component.isActive) return;
        //ensure checkpoint is not already set as the current checkpoint
        if(component.isCurrent) return;

        //clear previous checkpoint
        ClearCurrentCheckpoint();
        //set this entity as the new checkpoint
        CurrentCheckpoint = entity;
        component.isCurrent = true;
        //set preview object
        const transform = Transform.getMutable(respawnPreviewEntity);
        transform.parent = entity;
        transform.position = { x:0, y:0, z:0 };
        transform.scale = respawnPreviewScale;

        //process all callbacks
        for (var i: number = 0; i < checkpointObjectCallbacks.length; i++) {
            checkpointObjectCallbacks[i]();
        }
        if(isDebugging) console.log(debugTag+"checkpoint set as new active respawn location!");
    }

    /** creates a new object based on provided type, returning reference to its entity 
     *  this handles the creation of the entity as well so ns can handle pooling
     */
    export function Create(data:ParkourCheckpointCreationData):undefined|Entity {
        if(isDebugging) console.log(debugTag+"creating new collectible object, type="+data.type+"...");
        //attempt to get type def
        var def:CheckpointDataObject|undefined = CheckpointData.find(item => item.id === data.type);
        //ensure def was found
        if(def === undefined) {
            console.error(debugTag+"create() failed to find given type="+data.type.toString()+" in data, check you data IDs");
            def = CheckpointData[0];
        }
    
        //attempt to find an existing unused object
		var entity:undefined|Entity = undefined; 
        for (let i = 0; i < pooledObjects.length; i++) {
            //if object is unused, pull object from pool
            if(!ParkourCheckpointComponent.get(pooledObjects[i]).isActive) {   
                if(isDebugging) console.log(debugTag+"recycled unused object");
                //set object
                entity = pooledObjects[i];        
                //resize trigger area
                utils.triggers.setAreas(entity,
                    [{
                        type: 'box',
                        position: def.area.position,
                        scale: def.area.scale
                    }]
                );
                break;
            }
        }
        //if no entity 
		if(entity == undefined) {
			if(isDebugging) console.log(debugTag+"created new object");
			//create object entity
			entity = engine.addEntity();
            //  add trigger area
            const entityRef:Entity = entity;    //must assert entity ref for trigger function
            utils.triggers.addTrigger(entity, 
                utils.NO_LAYERS, //object's own layer
                utils.LAYER_1, //layer that triggers object
                //placement details 
                [{
                    type: 'box',
                    position: def.area.position,
                    scale: def.area.scale
                }], 
                function(e) { CheckpointEntered(entityRef); }
            );
            //  add entity to pooling
            pooledObjects.push(entity);
		}

        //create object
        //  transform
        const transform = Transform.getOrCreateMutable(entity);
        transform.position = data.position;
        transform.scale = data.scale;
        transform.rotation = Quaternion.fromEulerDegrees(data.rotation.x,data.rotation.y,data.rotation.z);
        //  custom model
        GltfContainer.createOrReplace(entity, {
            src: def.path,
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });
        //  component
        const component = ParkourCheckpointComponent.getOrCreateMutable(entity);
        component.isActive = true;
        component.isCurrent = false;
        component.respawnOffset = data.respawnPos;
        component.respawnLook = data.respawnRot;
        
        //provide entity reference
        if(isDebugging) console.log(debugTag+"created new checkpoint object, type="+data);
        return entity;
    }

    /** disable all pooled objects */
    export function DisableAll() {
        if(isDebugging) console.log(debugTag+"disabling all objects...");
        for (let i = 0; i < pooledObjects.length; i++) {
            Disable(pooledObjects[i]);
        }
        if(isDebugging) console.log(debugTag+"disabled all objects!");
    }

    /** disable given object, remains in pooling but hidden in the game scene */
    export function Disable(entity:Entity) {
        const component = ParkourCheckpointComponent.getMutable(entity);
        //disable via component
        component.isActive = false;
        component.isCurrent = false;
        //hide object (soft remove work-around)
        Transform.getMutable(entity).position = { x:8, y:-1, z:8 }; 
        Transform.getMutable(entity).scale = { x:0, y:0, z:0 }; 
    }

    /** destroys all pooled objects */
    export function DestroyAll() {
        if(isDebugging) console.log(debugTag+"destroying all objects...");
        while(pooledObjects.length > 0) {
            const entity = pooledObjects.pop();
            if(entity) Destroy(entity);
        }
        if(isDebugging) console.log(debugTag+"destroyed all objects!");
    }

    /** destroys given object, completely removing it from pooling & the game scene */
    export function Destroy(entity:Entity) {
        engine.removeEntity(entity);
    }
}