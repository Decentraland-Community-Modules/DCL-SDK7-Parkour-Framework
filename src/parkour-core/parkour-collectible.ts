import * as utils from '@dcl-sdk/utils'
import { Dictionary, List } from "../utilities/collections";
import { COLLECTIBLE_TYPE, CollectibleData, CollectibleDataObject } from "./data/collectible-data";
import { ColliderLayer, Entity, GltfContainer, Schemas, Transform, engine } from "@dcl/sdk/ecs";
import { Quaternion } from '@dcl/sdk/math';
/*      PARKOUR COLLECTIBLE
    collictables are objects that can be placed around your map, they use the same
    set logic as platforms: only shown when their linked set is active. sets can be
    defined either in their repsective config file or during runtime.

    NOTE: there 2 major pieces that are managed here that make up an object
        1 - display entity, in-game object that the player sees/interacts with
        2 - component data, this is attatched to the display entity (provides access to object's id/type)
        3 - processing function, responsible for time-base mechanics, like moving/rotating objects, and are always active

    NOTE: audio is not handled here (we dont want EVERY collectible to have an audio
        source), instead audio is handled by the parkour stage manager.

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export module ParkourCollectible
{
    //when true debug logs are generated (toggle off when you deploy)
    const isDebugging:boolean = false;
    /** hard-coded tag for module, helps log search functionality */
    const debugTag:string = "Parkour Collectible: ";

    /** pool of all existing objects */
    var pooledObjects:Entity[] = [];

    /** defines callback blueprint that will be called upon collectible gather */
    type ParkourCollectibleCallback = () => void;
    /** dictionary of all callbacks to be called when a collectible is picked up, key'd by collectible id */
    var collectibleObjectCallbacks:Dictionary<List<ParkourCollectibleCallback>> = new Dictionary<List<ParkourCollectibleCallback>>();
    /** registers a new callback under the given name */
    export function RegisterCallback(name:string, callback:ParkourCollectibleCallback) {
        //ensure target list exists
        if(!collectibleObjectCallbacks.containsKey(name)) 
            collectibleObjectCallbacks.addItem(name, new List<ParkourCollectibleCallback>());
        //add callback to listing
        collectibleObjectCallbacks.getItem(name).addItem(callback);
    }

    /** object interface used to define all data required to create a new object */
    export interface ParkourCollectibleCreationData {
        //type
        type: COLLECTIBLE_TYPE;
        //position
        position: { x:number; y:number; z:number; }; 
        scale: { x:number; y:number; z:number; };
        rotation: { x:number; y:number; z:number; };
    }

    /** component data def, this will exist attached on the object's entity as a component */
    export const ParkourCollectibleComponentData = { 
        /** true when this object is rendered in the scene, allows pooling/re-use */
        isActive:Schemas.Boolean, 
        /** true when this object has been collected by the local player, halts ghost collections */
        isCollected:Schemas.Boolean, 
        /** defines the type of collectible */
        type:Schemas.String,
    }
    /** define component, adding it to the engine as a managed behaviour */
    export const ParkourCollectibleComponent = engine.defineComponent("ParkourCollectibleComponentData", ParkourCollectibleComponentData);

    /** called a collectible's trigger box is entered/collection attempt is made */
    function CollectibleGathered(entity:Entity) {
        //get component
        const component = ParkourCollectibleComponent.getMutable(entity);
        if(isDebugging) console.log(debugTag+"attempting to gather collectible type="+component.type+"...");

        //ensure collectible is active (included in game)
        if(!component.isActive) return;
        //ensure collectible is not already gathered
        if(component.isCollected) return;

        //hide object
        Disable(entity);

        //process all callbacks
        for (var i: number = 0; i < collectibleObjectCallbacks.getItem(component.type).size(); i++) {
            collectibleObjectCallbacks.getItem(component.type).getItem(i)();
        }
        if(isDebugging) console.log(debugTag+"gathered collectible type="+component.type+"!");
    }

    /** creates a new object based on provided type, returning reference to its entity 
     *  this handles the creation of the entity as well so ns can handle pooling
     */
    export function Create(data:ParkourCollectibleCreationData):undefined|Entity {
        if(isDebugging) console.log(debugTag+"creating new collectible object, type="+data.type+"...");
        //attempt to get type def
        var def:CollectibleDataObject|undefined = CollectibleData.find(item => item.id === data.type);
        //ensure def was found
        if(def === undefined) {
            console.error(debugTag+"create() failed to find given type="+data.type.toString()+" in data, check you data IDs");
            def = CollectibleData[0];
        }
    
        //attempt to find an existing unused object
		var entity:undefined|Entity = undefined; 
        for (let i = 0; i < pooledObjects.length; i++) {
            //if object is unused, pull object from pool
            if(!ParkourCollectibleComponent.get(pooledObjects[i]).isActive) { 
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
                function(e) { CollectibleGathered(entityRef); }
            );
            //  add entity to pooling
            pooledObjects.push(entity);
		}
        
        //prepare object pieces
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
        const component = ParkourCollectibleComponent.getOrCreateMutable(entity);
        component.isActive = true;
        component.isCollected = false;
        component.type = data.type;

        //provide entity reference
        if(isDebugging) console.log(debugTag+"created new collectible object, type="+data+"!");
        return entity;
    }

    /** disables all pooled objects */
    export function DisableAll() {
        if(isDebugging) console.log(debugTag+"disabling all objects...");
        for (let i = 0; i < pooledObjects.length; i++) {
            Disable(pooledObjects[i]);
        }
        if(isDebugging) console.log(debugTag+"disabled all objects!");
    }
    
    /** disables given object, remains in pooling but hidden in the game scene */
    export function Disable(entity:Entity) {
        const component = ParkourCollectibleComponent.getMutable(entity);
        //disable via component
        component.isActive = false;
        component.isCollected = true;
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