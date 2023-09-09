import * as utils from '@dcl-sdk/utils'
import { ColliderLayer, Entity, GltfContainer, MeshRenderer, Schemas, Transform, engine } from "@dcl/sdk/ecs";
import { Color3, Quaternion, Vector3 } from "@dcl/sdk/math";
import { TRAP_TYPE, TrapData, TrapDataObject } from './data/trap-data';


/*      PARKOUR CHECKPOINTS
    traps are objects that can be placed around your map to act as obsticles to the player. when a player
    comes in contact with a trap's collision area they will be killed & respawned at the most recent checkpoint

    NOTE: there 2 major pieces that are managed here that make up an object
        1 - display entity, in-game object that the player sees/interacts with
        2 - component data, this is attatched to the display entity (provides access to object's id/type)
        3 - processing function, responsible for time-base mechanics, like moving/rotating objects, and are always active

    NOTE: this system handles respawn location management internally, so you dont need to hookup
        those in the callbacks. callbacks are there if you want custom functionality tho (like a life counter)

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export module ParkourTrap
{
    //when true debug logs are generated (toggle off when you deploy)
    const isDebugging:boolean = true;
    /** hard-coded tag for module, helps log search functionality */
    const debugTag:string = "Parkour Trap: ";

    /** collision entity tied to the player, acting as their hitbox */
    const playerHitbox:Entity = engine.addEntity();
    Transform.create(playerHitbox, {
        parent:engine.PlayerEntity,
        position:{x:0,y:0.15,z:0},
        scale:{x:1,y:1,z:1}
    });
    //MeshRenderer.setBox(playerHitbox);
    utils.triggers.addTrigger(playerHitbox, utils.LAYER_1, utils.LAYER_1, 
        [{type: 'box', scale:{x:0.8,y:2,z:0.8}}], 
        function(otherEntity) {
            console.log(`player hitbox collided with ${otherEntity}!`);
        },
        undefined,
        Color3.Green()
    );
    //utils.triggers.enableDebugDraw(true);
    /** pool of existing objects */
    var pooledObjects:Entity[] = [];

    /** defines callback blueprint that will be called upon trap entry */
    type ParkourTrapCallback = () => void;
    /** all callbacks to be called when the player enters a trap area */
    var trapObjectCallbacks:ParkourTrapCallback[] = [];
    /** registration for new callback */
    export function RegisterCallback(callback:ParkourTrapCallback) {
        //add callback to listing
        trapObjectCallbacks.push(callback);
    }

    /** object interface used to define all data required to create a new object */
    export interface ParkourTrapCreationData {
        //type
        type: TRAP_TYPE;
        //position
        position: { x:number; y:number; z:number; }; 
        scale: { x:number; y:number; z:number; };
        rotation: { x:number; y:number; z:number; };
    }

    /** component data def, this will exist attached on the object's entity as a component */
    export const ParkourTrapComponentData = { 
        /** true when this object is rendered in the scene */
        isActive:Schemas.Boolean,
        /** true when this object is the current checkpoint */
        isCurrent:Schemas.Boolean,
        /** amount of damage dealt when collided with */
        damage:Schemas.Number,
    }
    /** define component, adding it to the engine as a managed behaviour */
    export const ParkourTrapComponent = engine.defineComponent("ParkourTrapComponentData", ParkourTrapComponentData);

    /** creates a new object based on provided type, returning reference to its entity 
     *  this handles the creation of the entity as well so ns can handle pooling
     */
    export function Create(data:ParkourTrapCreationData):undefined|Entity {
        if(isDebugging) console.log(debugTag+"creating new collectible object, type="+data.type+"...");
        //attempt to get type def
        var def:TrapDataObject|undefined = TrapData.find(item => item.id === data.type);
        //ensure def was found
        if(def === undefined) {
            console.error(debugTag+"create() failed to find given type="+data.type.toString()+" in data, check you data IDs");
            def = TrapData[0];
        }
    
        //attempt to find an existing unused object
		var entity:undefined|Entity = undefined; 
        for (let i = 0; i < pooledObjects.length; i++) {
            //if object is unused, pull object from pool
            if(!ParkourTrapComponent.get(pooledObjects[i]).isActive) {   
                if(isDebugging) console.log(debugTag+"recycled unused object");
                //set object
                entity = pooledObjects[i];
                break;
            }
        }
        //if no entity 
		if(entity == undefined) {
			if(isDebugging) console.log(debugTag+"created new object");
			//create object entity
			entity = engine.addEntity();
            //add entity to pooling
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
            visibleMeshesCollisionMask: ColliderLayer.CL_CUSTOM1,
            invisibleMeshesCollisionMask: undefined
        });
        //  component
        const component = ParkourTrapComponent.getOrCreateMutable(entity);
        component.isActive = true;
        component.isCurrent = false;
        
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
        const component = ParkourTrapComponent.getMutable(entity);
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