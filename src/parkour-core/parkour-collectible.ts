import { ColliderLayer, Entity, GltfContainer, MeshCollider, MeshRenderer, Schemas, Transform, engine, removeEntityWithChildren } from "@dcl/sdk/ecs";
import { Vector3 } from "@dcl/sdk/math";
import { COLLECTIBLE_TYPE, CollectibleData, CollectibleDataObject } from "./data/collectible-data";
import Dictionary, { List } from "../utilities/collections";
import * as utils from '@dcl-sdk/utils'
/** defines callback blueprint that will be called upon collectible gather */
type ParkourCollectibleCallback = () => void;
/** component data def, this will exist attached on the object's entity as a component */
export const ParkourCollectibleData = { 
    /** true when this object is rendered in the scene */
    isActive:Schemas.Boolean, 
    /** true when this object has been collected by the local player */
    isCollected:Schemas.Boolean, 
    /** defines the type of collectible */
    type:Schemas.String,
}
/** define component, adding it to the engine as a managed behaviour */
export const ParkourCollectibleComponent = engine.defineComponent("ParkourCollectibleData", ParkourCollectibleData);
/*      PARKOUR COLLECTIBLE
    collictables are objects that can be placed around your map, they use the same
    set logic as platforms: only shown when their linked set is active. sets can be
    defined either in their repsective config file or during runtime.

    NOTE: audio is not handled here (we dont want EVERY collectible to have an audio
        source), instead audio is handled by the parkour stage manager.

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export module ParkourCollectible
{
    //when true debug logs are generated (toggle off when you deploy)
    const isDebugging:boolean = false;

    /** pool of existing objects */
    var collectibleObjects:Entity[] = [];

    /** dictionary of all callbacks to be called when a collectible is picked up, key'd by collectible id */
    var collectibleObjectCallbacks:Dictionary<List<ParkourCollectibleCallback>> = new Dictionary<List<ParkourCollectibleCallback>>();
    /** registration for new callback */
    export function RegisterCallback(type:string, callback:ParkourCollectibleCallback) {
        //ensure target list exists
        if(!collectibleObjectCallbacks.containsKey(type)) 
            collectibleObjectCallbacks.addItem(type, new List<ParkourCollectibleCallback>());
        //add callback to listing
        collectibleObjectCallbacks.getItem(type).addItem(callback);
    }

    /** creates a new collectible object, returning reference to its entity (this handles the creation of the entity as well so ns can handle pooling) */
    export function Create(type:COLLECTIBLE_TYPE):Entity {
        //attempt to get type def
        var def:CollectibleDataObject|undefined = CollectibleData.find(item => item.id === type);
        //ensure def was found
        if(def === undefined) {
            console.error("Parkour Collectible: create() failed, could not find given type='"+type.toString()+"' in data, check you data IDs");
            def = CollectibleData[0];
        }

        //attempt to find an existing unused object
        for (let i = 0; i < collectibleObjects.length; i++) {
            if(!ParkourCollectibleComponent.get(collectibleObjects[i]).isActive) {   
                if(isDebugging) console.log("Parkour Collectible: recycled unused collectible object, type="+type);
                //re-enable and re-type unused object from pooling
                return SetType(collectibleObjects[i], type);
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
        ParkourCollectibleComponent.create(entity,{
            isActive: true,
            isCollected: false,
            type: type
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
            function(e) { CollectibleGathered(entity); }
        );
        
        //add entity to pooling
        collectibleObjects.push(entity);
        if(isDebugging) console.log("Parkour Collectible: created new collectible object, type="+type);
        //provide entity reference
        return entity;
    }

    /** called a collectible's trigger box is entered/collection attempt is made */
    function CollectibleGathered(entity:Entity) {
        //get component
        const component = ParkourCollectibleComponent.getMutable(entity);
        if(isDebugging) console.log("Parkour Collectible: attempting to gather collectible type="+component.type);

        //ensure collectible is active (included in game)
        if(!component.isActive) return;
        //ensure collectible is not already gathered
        if(component.isCollected) return;

        //gather collectible
        component.isCollected = true;
        //hide object (soft remove work-around)
        Transform.getMutable(entity).scale = { x:0, y:0, z:0 }; 

        //process all callbacks
        for (var i: number = 0; i < collectibleObjectCallbacks.getItem(component.type).size(); i++) {
            collectibleObjectCallbacks.getItem(component.type).getItem(i)();
        }
    }

    /** redefines the type of the given collectible object */
    function SetType(entity:Entity, type:COLLECTIBLE_TYPE):Entity {
        //attempt to get type def
        var def:CollectibleDataObject|undefined = CollectibleData.find(item => item.id === type);
        //ensure def was found
        if(def === undefined) {
            console.error("Parkour Collectible: set() failed, could not find given type='"+type.toString()+"' in data, check you data IDs");
            def = CollectibleData[0];
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
        const component = ParkourCollectibleComponent.getMutable(entity);
        //prepare component
        component.isActive = true;
        component.isCollected = false;
        component.type = type;
        return entity;
    }

    /** removes all objects from the game */
    export function RemoveAll() {
        for (let i = 0; i < collectibleObjects.length; i++) {
            Remove(collectibleObjects[i]);
        }
    }
    /** removes given object from game, but does not get removed from engine (remaining in pool ) */
    export function Remove(entity:Entity) {
        const component = ParkourCollectibleComponent.getMutable(entity);
        //disable via component
        component.isActive = false;
        component.isCollected = true;
        //hide object (soft remove work-around)
        Transform.getMutable(entity).scale = { x:0, y:0, z:0 }; 
    }

    /** removes all objects from the game */
    export function DestroyAll() {
        for (let i = 0; i < collectibleObjects.length; i++) {
            Destroy(collectibleObjects[i]);
        }
    }
    /** removes given object from game scene and engine */
    export function Destroy(entity:Entity) {
        Destroy(entity);
    }
}