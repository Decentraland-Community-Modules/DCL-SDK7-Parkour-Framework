import { ColliderLayer, Entity, GltfContainer, Schemas, Transform, engine } from "@dcl/sdk/ecs";
import { PLATFORM_STYLE_TYPE, PLATFORM_TYPE, PlatformStyleData, PlatformStyleDataObject } from "./data/platform-data";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
import Dictionary from "../utilities/collections";
    
//### STATIC
/** component data def, this will exist attached on the object's entity as a component */
export const ParkourPlatformStaticData = { 
    /** true when this object is rendered in the scene */
    isActive:Schemas.Boolean,
}
/** define component, adding it to the engine as a managed behaviour */
export const ParkourPlatformStaticComponent = engine.defineComponent("ParkourPlatformStaticData", ParkourPlatformStaticData);
//### BLINKING
/** component data def, this will exist attached on the object's entity as a component */
export const ParkourPlatformBlinkingData = { 
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
export const ParkourPlatformBlinkingComponent = engine.defineComponent("ParkourPlatformBlinkingData", ParkourPlatformBlinkingData);
/** timed processing for component */
const platformProcessingBlinking = function BlinkingTimer(dt: number)
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
engine.addSystem(platformProcessingBlinking);
//### ROTATING
/** component data def, this will exist attached on the object's entity as a component */
export const ParkourPlatformRotatingData = { 
    /** true when this object is rendered in the scene */
    isActive:Schemas.Boolean,
    /** if true object's function is being processed by system */
    isProcessing:Schemas.Boolean,
    /** settings */
    speedX:Schemas.Number,
    speedY:Schemas.Number,
    speedZ:Schemas.Number,
}
/** define component, adding it to the engine as a managed behaviour */
export const ParkourPlatformRotatingComponent = engine.defineComponent("ParkourPlatformRotatingData", ParkourPlatformRotatingData);
/** timed processing for component */
const platformProcessingRotating = function RotatingTimer(dt: number)
{
    //NOTE: this is set up for testing if the SDK has been fixed yet...
    //  try a full rotation on x axis -.-
    //process every entity that has this component
    for (const [entity] of engine.getEntitiesWith(ParkourPlatformRotatingComponent)) 
    {
        const component = ParkourPlatformRotatingComponent.getMutable(entity);
        //skip if not active/processing
        if(!component.isActive || !component.isProcessing) continue;
        //get old rotation
        const rotationOldQ = Transform.get(entity).rotation;
        const rotationOldE = quaternionToEuler(rotationOldQ);
        //const rotationOldE = Quaternion.toEulerAngles(rotationOldQ); //broken
        /*//create new values*/
        rotationOldE.x += (dt*component.speedX);
        rotationOldE.y += (dt*component.speedY);
        rotationOldE.z += (dt*component.speedZ);
        //create new rotation
        const rotAr = eulerToQuaternion(rotationOldE);
        //const rotAr = Quaternion.fromEulerDegrees(rotationOldE.x, rotationOldE.y, rotationOldE.z); //broken
        const rotationNewQ = Quaternion.create(rotAr.x, rotAr.y, rotAr.z, rotAr.w);
        Transform.getMutable(entity).rotation = rotationNewQ;

        //console.log("oldQ="+rotationNewQ.x+"\t newQ"+rotationNewQ.x);
    }
}

//NOTE: currently DCL's SDK7 eular-quart translation calcs (x axis) are scuffed, so I just packed my own solution 
function eulerToQuaternion(euler: { x: number; y: number; z: number }): { x: number; y: number; z: number; w: number } {
    const { x, y, z } = euler;
  
    // Convert Euler angles to radians
    const roll = (x * Math.PI) / 180;
    const pitch = (y * Math.PI) / 180;
    const yaw = (z * Math.PI) / 180;
  
    // Calculate quaternion conversion from Euler angles
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);
  
    const qw = cr * cp * cy + sr * sp * sy;
    const qx = sr * cp * cy - cr * sp * sy;
    const qy = cr * sp * cy + sr * cp * sy;
    const qz = cr * cp * sy - sr * sp * cy;
  
    // Return quaternion
    return { x: qx, y: qy, z: qz, w: qw };
  }
  function quaternionToEuler(q: { x: number; y: number; z: number; w: number }): { x: number; y: number; z: number } {
    const { x, y, z, w } = q;
  
    // Calculate quaternion conversion to Euler angles
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);
  
    const sinp = 2 * (w * y - z * x);
    let pitch: number;
    if (Math.abs(sinp) >= 1) {
      pitch = Math.sign(sinp) * (Math.PI / 2); // Use 90 degrees if out of range
    } else {
      pitch = Math.asin(sinp);
    }
  
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);
  
    // Return Euler angles in degrees
    return {
      x: roll * (180 / Math.PI),
      y: pitch * (180 / Math.PI),
      z: yaw * (180 / Math.PI),
    };
  }
  
/** add system to engine */
engine.addSystem(platformProcessingRotating);
//### MOVING
/** component data def, this will exist attached on the object's entity as a component */
export const ParkourPlatformMovingData = { 
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
export const ParkourPlatformMovingComponent = engine.defineComponent("ParkourPlatformMovingData", ParkourPlatformMovingData);
/** timed processing for component */
const platformProcessingMoving = function MovingTimer(dt: number)
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
engine.addSystem(platformProcessingMoving);

/*      PARKOUR PLATFORMS
    platforms are objects that can be placed around your map to build challenges for them
    to overcome. platforms come in a few different types, including: static, blinking, rotation,
    and moving.

    IDEAS/TODO:
        maybe automate stacking components on the same object

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export module ParkourPlatform
{
    //when true debug logs are generated (toggle off when you deploy)
    const isDebugging:boolean = false;

    /** pool of existing objects, access is per type (ex: we don't mix blinking and rotating platforms) */
    var platformObjects:Entity[][] = [[],[],[],[]];

    /** creates a new platform object, returning reference to its entity (this handles the creation of the entity as well so ns can handle pooling) */
    export function Create(type:PLATFORM_TYPE, style:PLATFORM_STYLE_TYPE):Entity {
        if(isDebugging) console.log("Parkour Platform: attempting to create platform object, type="+type+" style="+style);
        //attempt to get type def
        var def:PlatformStyleDataObject|undefined = PlatformStyleData.find(item => item.id === style);
        //ensure def was found
        if(def === undefined) {
            console.error("Parkour Platform: create() failed, could not find given style='"+type.toString()+"' in data, check you data IDs");
            def = PlatformStyleData[0];
        }

        //attempt to find pre-existing component
        for (let i = 0; i < platformObjects[type].length; i++) {
            //process based on component type we are after 
            switch(type)
            {
                case PLATFORM_TYPE.STATIC:
                    if(!ParkourPlatformStaticComponent.get(platformObjects[type][i]).isActive) return SetType(platformObjects[type][i], type, style);
                break;
                case PLATFORM_TYPE.BLINKING:
                    if(!ParkourPlatformBlinkingComponent.get(platformObjects[type][i]).isActive) return SetType(platformObjects[type][i], type, style);
                break;
                case PLATFORM_TYPE.ROTATING:
                    if(!ParkourPlatformRotatingComponent.get(platformObjects[type][i]).isActive) return SetType(platformObjects[type][i], type, style);
                break;
                case PLATFORM_TYPE.MOVING:
                    if(!ParkourPlatformMovingComponent.get(platformObjects[type][i]).isActive) return SetType(platformObjects[type][i], type, style);
                break;
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
        //  add requested component type, initialized by type
        switch(type)
        {
            case PLATFORM_TYPE.STATIC:
                ParkourPlatformStaticComponent.create(entity,{ isActive: true });
            break;
            case PLATFORM_TYPE.BLINKING:
                ParkourPlatformBlinkingComponent.create(entity,{ isActive: true, isProcessing: false});
            break;
            case PLATFORM_TYPE.ROTATING:
                ParkourPlatformRotatingComponent.create(entity,{ isActive: true, isProcessing: false });
            break;
            case PLATFORM_TYPE.MOVING:
                ParkourPlatformMovingComponent.create(entity,{ isActive: true, isProcessing: false });
            break;
        }
        
        //add entity to pooling
        platformObjects[type].push(entity);
        if(isDebugging) console.log("Parkour Platform: created new platform object, type="+type+" style="+style);
        //provide entity reference
        return entity;
    }

    /** redefines the type of the given collectible object */
    function SetType(entity:Entity, type:PLATFORM_TYPE, style:PLATFORM_STYLE_TYPE):Entity {
        if(isDebugging) console.log("Parkour Platform: setting type of platform object, type="+type+" style="+style);
        //attempt to get type def
        var def:PlatformStyleDataObject|undefined = PlatformStyleData.find(item => item.id === style);
        //ensure def was found
        if(def === undefined) {
            console.error("Parkour Platform: set() failed, could not find given type='"+type.toString()+"' in data, check you data IDs");
            def = PlatformStyleData[0];
        }
        //  replace custom model
        GltfContainer.createOrReplace(entity, {
            src: def.path,
        });
        //  reactivate requested component, initialized by type
        switch(type)
        {
            case PLATFORM_TYPE.STATIC:
                ParkourPlatformStaticComponent.getMutable(entity).isActive = true;
            break;
            case PLATFORM_TYPE.BLINKING:
                ParkourPlatformBlinkingComponent.getMutable(entity).isActive = true;
            break;
            case PLATFORM_TYPE.ROTATING:
                ParkourPlatformRotatingComponent.getMutable(entity).isActive = true;
            break;
            case PLATFORM_TYPE.MOVING:
                ParkourPlatformMovingComponent.getMutable(entity).isActive = true;
            break;
        }
        
        if(isDebugging) console.log("Parkour Platform: type of platform object has been set, type="+type+" style="+style);
        return entity;
    }

    /** removes all objects from the game */
    export function RemoveAll() {
        if(isDebugging) console.log("Parkour Platform: removing all platforms...");
        //process every platform, per type
        for (let type = 0; type < 4; type++) {
            for (let i = 0; i < platformObjects[type].length; i++) {
                Remove(platformObjects[type][i], type);
            }
        }
    }
    /** removes given object from game, but does not get removed from engine (remaining in pool ) */
    export function Remove(entity:Entity, type:PLATFORM_TYPE) {
        //  reactivate requested component, initialized by type
        switch(type)
        {
            case PLATFORM_TYPE.STATIC:
                ParkourPlatformStaticComponent.getMutable(entity).isActive = false;
            break;
            case PLATFORM_TYPE.BLINKING:
                ParkourPlatformBlinkingComponent.getMutable(entity).isActive = false;
                ParkourPlatformBlinkingComponent.getMutable(entity).isProcessing = false;
            break;
            case PLATFORM_TYPE.ROTATING:
                ParkourPlatformRotatingComponent.getMutable(entity).isActive = false;
                ParkourPlatformRotatingComponent.getMutable(entity).isProcessing = false;
            break;
            case PLATFORM_TYPE.MOVING:
                ParkourPlatformMovingComponent.getMutable(entity).isActive = false;
                ParkourPlatformMovingComponent.getMutable(entity).isProcessing = false;
            break;
        }
        //hide object (soft remove work-around)
        Transform.getMutable(entity).scale = { x:0, y:0, z:0 }; 
    }

    /** removes all objects from the game */
    export function DestroyAll() {
        if(isDebugging) console.log("Parkour Platform: destroying all platforms...");
        //process every platform, per type
        for (let type = 0; type < 4; type++) {
            for (let i = 0; i < platformObjects[type].length; i++) {
                Destroy(platformObjects[type][i]);
            }
        }
    }
    /** removes given object from game scene and engine */
    export function Destroy(entity:Entity) {
        Destroy(entity);
    }
}