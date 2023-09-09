import * as utils from '@dcl-sdk/utils'
import { Quaternion, Vector3 } from "@dcl/sdk/math";
import { ColliderLayer, Entity, GltfContainer, Schemas, Transform, engine } from "@dcl/sdk/ecs";
import { PLATFORM_STYLE_TYPE, PLATFORM_TYPE, PlatformStyleData, PlatformStyleDataObject } from "./data/platform-data";
/*      PARKOUR PLATFORMS
    platforms are objects that can be placed around your map to build challenges for players
    to overcome. platforms come in a few different types, including: static, blinking, rotation,
    and moving. 

    NOTE: there 3 major pieces that are managed here that make up an object
        1 - display entity, in-game object that the player sees/interacts with
        2 - component data, this is attatched to the display entity (provides access to object's id/type)
        3 - processing function, responsible for time-base mechanics, like moving/rotating objects, and are always active

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export module ParkourPlatform
{
    //when true debug logs are generated (toggle off when you deploy)
    const isDebugging:boolean = false;
    /** hard-coded tag for module, helps log search functionality */
    const debugTag:string = "Parkour Platform: ";

    /** pool of existing objects, access is per type (ex: we don't mix blinking and rotating platforms) */
    var pooledObjects:Entity[][] = [[],[],[],[]];
        
    //### STATIC
    /** object interface used to define all data required to create a new object */
    export interface ParkourPlatformStaticCreationData {
        //type
        type: PLATFORM_TYPE.STATIC;
        style: PLATFORM_STYLE_TYPE;
        //position
        position: { x:number; y:number; z:number; }; 
        scale: { x:number; y:number; z:number; };
        rotation: { x:number; y:number; z:number; };
    }
    /** component data def, this will exist attached on the object's entity as a component */
    export const ParkourPlatformStaticComponentData = { 
        /** true when this object is rendered in the scene */
        isActive:Schemas.Boolean,
    }
    /** define component, adding it to the engine as a managed behaviour */
    export const ParkourPlatformStaticComponent = engine.defineComponent("ParkourPlatformStaticComponentData", ParkourPlatformStaticComponentData);
    
    //### ROTATING NOTE: rotational processing is handled through utils perpetual motions
    /** object interface used to define all data required to create a new object */
    export interface ParkourPlatformRotatingCreationData {
        //type
        type: PLATFORM_TYPE.ROTATING;
        style: PLATFORM_STYLE_TYPE;
        //position
        position: { x:number; y:number; z:number; }; 
        scale: { x:number; y:number; z:number; };
        rotation: { x:number; y:number; z:number; };
        //settings
        speedX: number; 
        speedY: number; 
        speedZ: number;
    }
    /** component data def, this will exist attached on the object's entity as a component */
    export const ParkourPlatformRotatingComponentData = { 
        /** true when this object is rendered in the scene */
        isActive:Schemas.Boolean,
    }
    /** define component, adding it to the engine as a managed behaviour */
    export const ParkourPlatformRotatingComponent = engine.defineComponent("ParkourPlatformRotatingComponentData", ParkourPlatformRotatingComponentData);
    
    //### BLINKING
    /** object interface used to define all data required to create a new object */
    export interface ParkourPlatformBlinkingCreationData {
        //type
        type: PLATFORM_TYPE.BLINKING;
        style: PLATFORM_STYLE_TYPE;
        //position
        position: { x:number; y:number; z:number; }; 
        scale: { x:number; y:number; z:number; };
        rotation: { x:number; y:number; z:number; };
        //settings
        timeStart: number; 
        timeOn: number; 
        timeOff: number;
    }
    /** component data def, this will exist attached on the object's entity as a component */
    export const ParkourPlatformBlinkingComponentData = { 
        /** true when this object is rendered in the scene */
        isActive:Schemas.Boolean,
        /** if true object's function is being processed by system */
        isProcessing:Schemas.Boolean,
        /** settings */
        isOn:Schemas.Boolean,
        timeOn:Schemas.Number,
        timeOff:Schemas.Number,
        sizeScale:Schemas.Vector3,
        /** current time passed */
        timeDelta:Schemas.Number,
    }
    /** define component, adding it to the engine as a managed behaviour */
    export const ParkourPlatformBlinkingComponent = engine.defineComponent("ParkourPlatformBlinkingComponentData", ParkourPlatformBlinkingComponentData);
    /** timed processing for component */
    function processingPlatformBlinking(dt: number)
    {
        //process every entity that has this component
        for (const [entity] of engine.getEntitiesWith(ParkourPlatformBlinkingComponent)) 
        {
            const component = ParkourPlatformBlinkingComponent.getMutable(entity);
            //skip if not active/processing
            if(!component.isActive || !component.isProcessing) continue;
            //add time
            component.timeDelta += dt;
            //check for toggle
            if(component.isOn && component.timeDelta >= component.timeOn) {
                //toggle off
                component.isOn = false;
                component.timeDelta -= component.timeOn;
                Transform.getMutable(entity).scale = Vector3.Zero();
            }
            else if(!component.isOn && component.timeDelta >= component.timeOff) {
                //toggle on
                component.isOn = true;
                component.timeDelta -= component.timeOff;
                Transform.getMutable(entity).scale = component.sizeScale;
            }
        }
    }
    /** add system to engine */
    engine.addSystem(processingPlatformBlinking);
    
    //### MOVING
    /** object interface used to define all data required to create a new object */
    export interface ParkourPlatformMovingCreationData {
        //type
        type: PLATFORM_TYPE.MOVING;
        style: PLATFORM_STYLE_TYPE;
        //position
        position: { x:number; y:number; z:number; }; 
        scale: { x:number; y:number; z:number; };
        rotation: { x:number; y:number; z:number; };
        //settings
        speed: number; 
        waypoints:Vector3[];
    }
    /** component data def, this will exist attached on the object's entity as a component */
    export const ParkourPlatformMovingComponentData = { 
        /** true when this object is rendered in the scene */
        isActive:Schemas.Boolean,
        /** if true object's function is being processed by system */
        isProcessing:Schemas.Boolean,
        /** settings */
        speed:Schemas.Number,
        waypoints:Schemas.Array(Schemas.Vector3),
        /** processing */
        indexCur:Schemas.Number,
        normal:Schemas.Vector3,
    }
    /** define component, adding it to the engine as a managed behaviour */
    export const ParkourPlatformMovingComponent = engine.defineComponent("ParkourPlatformMovingComponentData", ParkourPlatformMovingComponentData);
    /** timed processing for component */
    function processingPlatformMoving(dt: number)
    {
        //process every entity that has this component
        for (const [entity] of engine.getEntitiesWith(ParkourPlatformMovingComponent)) 
        {
            const component = ParkourPlatformMovingComponent.getMutable(entity);
            //skip if not active/processing
            if(!component.isActive || !component.isProcessing) continue;
            //get transform
            const pos = Transform.getMutable(entity).position;
            
            //check for destination
            if (
                Math.abs(pos.x - component.waypoints[component.indexCur].x) < 0.02 &&
                Math.abs(pos.y - component.waypoints[component.indexCur].y) < 0.02 &&
                Math.abs(pos.z - component.waypoints[component.indexCur].z) < 0.02
            ) {
                //update target
                component.indexCur++;
                if(component.indexCur >= component.waypoints.length) component.indexCur = 0;
                //determine new direction that object has to move in
                const direction = {
                    x: component.waypoints[component.indexCur].x - pos.x,
                    y: component.waypoints[component.indexCur].y - pos.y,
                    z: component.waypoints[component.indexCur].z - pos.z
                };
                //recalculate norm translation
                const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
                component.normal = {
                x: direction.x / length,
                y: direction.y / length,
                z: direction.z / length
                };
            }
            //move towards target location
            pos.x += (dt*component.speed*component.normal.x);
            pos.y += (dt*component.speed*component.normal.y);
            pos.z += (dt*component.speed*component.normal.z);
        }
    }
    /** add system to engine */
    engine.addSystem(processingPlatformMoving);

    /** creates a new object based on provided type, returning reference to its entity 
     *  this handles the creation of the entity as well so ns can handle pooling
     */
    export function Create(data:ParkourPlatformStaticCreationData|ParkourPlatformBlinkingCreationData|ParkourPlatformRotatingCreationData|ParkourPlatformMovingCreationData):undefined|Entity {
        if(isDebugging) console.log(debugTag+"creating new platform object, type="+data.type+" style="+data.style);
        //attempt to get defs
        var styleDef:PlatformStyleDataObject|undefined = PlatformStyleData.find(item => item.id === data.style);
        //ensure def was found
        if(styleDef === undefined) {
            console.error(debugTag+"create() failed to find given style="+data.style.toString()+" in data, check you data IDs");
            styleDef = PlatformStyleData[0];
        }
    
        //attempt to find an existing unused object
		var entity:undefined|Entity = undefined; 
        for (let i = 0; i < pooledObjects[data.type].length; i++) {
            //process based on component type we are after 
            switch(data.type)
            {
                case PLATFORM_TYPE.STATIC:
                    if(!ParkourPlatformStaticComponent.get(pooledObjects[data.type][i]).isActive) {
                        entity = pooledObjects[data.type][i];
                    } 
                break;
                case PLATFORM_TYPE.BLINKING:
                    if(!ParkourPlatformBlinkingComponent.get(pooledObjects[data.type][i]).isActive) {
                        entity = pooledObjects[data.type][i];
                    } 
                break;
                case PLATFORM_TYPE.ROTATING:
                    if(!ParkourPlatformRotatingComponent.get(pooledObjects[data.type][i]).isActive) {
                        entity = pooledObjects[data.type][i];
                    } 
                break;
                case PLATFORM_TYPE.MOVING:
                    if(!ParkourPlatformMovingComponent.get(pooledObjects[data.type][i]).isActive) {
                        entity = pooledObjects[data.type][i];
                    } 
                break;
            }
            //halt if entity is found
            if(entity) {
                if(isDebugging) console.log(debugTag+"recycled unused object");
                break;
            } 
        }
        //if no entity 
		if(entity == undefined) {
			if(isDebugging) console.log(debugTag+"created new object");
			//create object entity
			entity = engine.addEntity();
            //  add entity to pooling of type
            pooledObjects[data.type].push(entity);
		}

        //create object
        //  transform
        const transform = Transform.getOrCreateMutable(entity);
        transform.position = data.position;
        transform.scale = data.scale;
        transform.rotation = Quaternion.fromEulerDegrees(data.rotation.x,data.rotation.y,data.rotation.z);
        //  custom model
        GltfContainer.createOrReplace(entity, {
            src: styleDef.path,
            visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
            invisibleMeshesCollisionMask: undefined
        });
        //  process requested component type, initialized by type
        var component;
        switch(data.type)
        {
            case PLATFORM_TYPE.STATIC:
                component = ParkourPlatformStaticComponent.getOrCreateMutable(entity);
                component.isActive = true;
            break;
            case PLATFORM_TYPE.BLINKING:
                component = ParkourPlatformBlinkingComponent.getOrCreateMutable(entity);
                component.isActive = true;
                component.isProcessing = true;
                component.timeDelta = data.timeStart;
                component.timeOn = data.timeOn;
                component.timeOff = data.timeOff;
            break;
            case PLATFORM_TYPE.ROTATING:
                component = ParkourPlatformRotatingComponent.getOrCreateMutable(entity);
                component.isActive = true;
                utils.perpetualMotions.startRotation(entity, Quaternion.fromEulerDegrees(data.speedX, data.speedY, data.speedZ));
            break;
            case PLATFORM_TYPE.MOVING:
                component = ParkourPlatformMovingComponent.getOrCreateMutable(entity);
                component.isActive = true;
                component.isProcessing = true;
                component.speed = data.speed;
                component.waypoints = [];
                for (let i = 0; i < data.waypoints.length; i++) {
                    component.waypoints.push({x:data.waypoints[i].x,y:data.waypoints[i].y,z:data.waypoints[i].z});
                }
            break;
        }
        
        //add entity to pooling
        pooledObjects[data.type].push(entity);
        if(isDebugging) console.log(debugTag+"created new platform object, type="+data.type+" style="+data.style);
        //provide entity reference
        return entity;
    }
    
    /** disables all pooled objects */
    export function DisableAll() {
        if(isDebugging) console.log(debugTag+"disabling all objects...");
        for (let type = 0; type < 4; type++) {
            for (let i = 0; i < pooledObjects[type].length; i++) {
                Disable(pooledObjects[type][i], type);
            }
        }
        if(isDebugging) console.log(debugTag+"disabled all objects!");
    }

    /** disables given object, remains in pooling but hidden in the game scene */
    export function Disable(entity:Entity, type: PLATFORM_TYPE) {
        var component;
        //disable via component
        switch(type)
        {
            case PLATFORM_TYPE.STATIC:
                component = ParkourPlatformStaticComponent.getMutable(entity);
                component.isActive = false;
            break;
            case PLATFORM_TYPE.BLINKING:
                component = ParkourPlatformBlinkingComponent.getMutable(entity);
                component.isActive = false;
                component.isProcessing = false;
            break;
            case PLATFORM_TYPE.ROTATING:
                component = ParkourPlatformRotatingComponent.getMutable(entity);
                component.isActive = false;
                utils.perpetualMotions.stopRotation(entity);
            break;
            case PLATFORM_TYPE.MOVING:
                component = ParkourPlatformMovingComponent.getMutable(entity);
                component.isActive = false;
                component.isProcessing = false;
            break;
        }
        //hide object (soft remove work-around)
        Transform.getMutable(entity).position = { x:8, y:-1, z:8 }; 
        Transform.getMutable(entity).scale = { x:0, y:0, z:0 }; 
    }

    /** destroys all pooled objects */
    export function DestroyAll() {
        if(isDebugging) console.log(debugTag+"destroying all objects...");
        for (let type = 0; type < 4; type++) {
            while(pooledObjects[type].length > 0) {
                const entity = pooledObjects[type].pop();
                if(entity) Destroy(entity);
            }
        }
        if(isDebugging) console.log(debugTag+"destroyed all objects!");
    }

    /** destroys given object, completely removing it from pooling & the game scene */
    export function Destroy(entity:Entity) {
        engine.removeEntity(entity);
    }
}