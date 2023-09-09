import { AudioSource, AvatarAnchorPointType, AvatarAttach, Entity, Transform, engine } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
import Dictionary from "./collections";

const AUDIO_ENTITY_POOL_SIZE:number = 3;

/** represents a single audio listing, managing a set of audio sounds  */
class AudioManagerPiece {
    private index:number = 0;
    private audioEntities:Entity[] = [];

    constructor(par:Entity, soundSrc:string) {
        //create required sound objects
        for(let i=0; i<AUDIO_ENTITY_POOL_SIZE; i++) {
            //  entity
            const entity = engine.addEntity();
            Transform.create(entity,
            ({
                parent: par,
                position: Vector3.create(0,0,0),
                scale: Vector3.create(1,1,1),
                rotation: Quaternion.fromEulerDegrees(0, 0, 0)
            }));
            //  audio source
            AudioSource.create(entity, {
                audioClipUrl: soundSrc,
                loop: false,
                playing: false,
                volume: 5
            });
            //  add to pooling
            this.audioEntities.push(entity);
        }
    }

    public PlaySound() {
        //get next audio source
        this.index++;
        if(this.index >= this.audioEntities.length) this.index = 0;
        //play sound
        AudioSource.getMutable(this.audioEntities[this.index]).playing = true;
    }
}
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
    audioDict:Dictionary<AudioManagerPiece>;
    
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
        this.audioDict = new Dictionary<AudioManagerPiece>();
    }

    AddSound(key:string, location:string) {
        //ensure key is not empty
        if(key === '') return;
        //create audio piece
        const piece =  new AudioManagerPiece(this.parentEntity, location);
        //add to collection
        this.audioDict.addItem(  key, piece);
    }

    PlaySound(key:string) {
        //ensure key exists in dict
        if(!this.audioDict.containsKey(key)) return;
        //send sound request
        this.audioDict.getItem(key).PlaySound();
    }
}