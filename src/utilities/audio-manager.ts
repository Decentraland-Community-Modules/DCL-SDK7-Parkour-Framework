import { AudioSource, AvatarAnchorPointType, AvatarAttach, Entity, Transform, engine } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
import Dictionary from "./collections";
/*      AUDIO MANAGER
    controls audio components in-scene

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: TheCryptoTrader69@gmail.com
*/
export class AudioManager
{
    /** access pocketing */
    private static instance:undefined|AudioManager;
    public static get Instance():AudioManager
    {
        //ensure instance is set
        if(AudioManager.instance === undefined)
        {
            AudioManager.instance = new AudioManager();
        }

        return AudioManager.instance;
    }

    /** parental object, all audio/sfx objects are children of this */
    parentEntity:Entity;

    /** registry of all audio that can be played */    
    audioDict:Dictionary<Entity>;
    
    //constructor
    constructor()
    {
        //create parental object
        //  entity
        this.parentEntity = engine.addEntity();
        Transform.create(this.parentEntity,
        ({
            position: Vector3.create(0,0,0),
            scale: Vector3.create(1,1,1),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        //  tie to player
        AvatarAttach.create(this.parentEntity,{
            anchorPointId: AvatarAnchorPointType.AAPT_NAME_TAG,
        });

        //initialize collection
        this.audioDict = new Dictionary<Entity>();
    }

    AddSound(key:string, location:string) {
        //ensure key is not empty
        if(key === '') return;
        //entity
        const soundEntity = engine.addEntity();
        Transform.create(soundEntity,
        ({
            parent: this.parentEntity,
            position: Vector3.create(0,0,0),
            scale: Vector3.create(1,1,1),
            rotation: Quaternion.fromEulerDegrees(0, 0, 0)
        }));
        //audio source
        AudioSource.create(soundEntity, {
            audioClipUrl: location,
            loop: false,
            playing: false,
            volume: 5
        });
        //add to collection
        this.audioDict.addItem(key, soundEntity);
    }

    PlaySound(key:string) {
        //ensure key exists in dict
        if(!this.audioDict.containsKey(key)) return;
        //get entity
        const entity:Entity = this.audioDict.getItem(key);
        //reset the place state to play from start
        AudioSource.getMutable(entity).playing = false;
        AudioSource.getMutable(entity).playing = true;
    }
}