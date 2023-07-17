import { Color4 } from "@dcl/sdk/math";
import ReactEcs, { Button, ReactEcsRenderer, UiEntity } from "@dcl/sdk/react-ecs";
import { List } from "../utilities/collections";
import { TextAlignMode } from "@dcl/sdk/ecs";
import { openExternalUrl } from "~system/RestrictedActions";
/** defines callback blueprint that will be called upon stage competion */
type ParkourScoringCallback = () => void;
/*      PARKOUR SCORING
    contains functionality for scoring, displaying the player's current progression
    through a parkour stage. this also includes an easy interface to plug into your
    2D ui display that only provides render data when the system is active.

    Author: TheCryptoTrader69 (Alex Pazder)
    Contact: thecryptotrader69@gmail.com
*/
export module ParkourScoring
{
    //when true debug logs are generated (toggle off when you deploy)
    const isDebugging:boolean = false;

    /** if true, system will provide draw data */
    var isShown: boolean = false;
    /** sets the current state of scoring */
    export function SetDisplayState(state:boolean) {
        isShown = state;
    }

    /** if true, system will track inbound score & check win conditions */
    var isActive: boolean = false;
    /** sets the current state of scoring */
    export function SetGameState(state:boolean) {
        isActive = state;
    }

    /** current number of collectibles */
    var curCollectibles: number = 0;   
    /** total number of collectibles */
    var tarCollectibles: number = 0;

    /** current score value */
    var curScoreValue: number = 0;   
    /** total score value */
    var tarScoreValue: number = 0;

    /** all callbacks here are called when the max score is reached */
    var scoreCallbacks:List<ParkourScoringCallback> = new List<ParkourScoringCallback>();
    /** registration for new callback */
    export function RegisterCallback(callback:ParkourScoringCallback) {
        scoreCallbacks.addItem(callback);
    }

    /** resets the scoring system, setting the required score to complete the current level */
    export function ResetScore(count:number, score:number) {
        if(isDebugging) console.log("Parkour Scoring: score reset");
        //set values
        curCollectibles = 0;
        tarCollectibles = count;
        curScoreValue = 0;
        tarScoreValue = score;
        //set active
        SetDisplayState(true);
        SetGameState(true);
    }

    /** increases the number of collectibles gathered (this is split from add score to allow other types of score gains) */
    export function IncCollectible() {
        //inc collectibles
        curCollectibles++;
    }

    /** adds the given value to the current score and checks the win condition */
    export function AddScore(value:number) {
        //ensure game is on-going
        if(!isActive) return;
        //add & leash score (incase you have a stage that doesnt require 100% completion)
        curScoreValue += value;
        if(curScoreValue > tarScoreValue) curScoreValue = tarScoreValue;
        if(isDebugging) console.log("Parkour Scoring: added score value="+value+", cur="+curScoreValue+", target="+tarScoreValue);
        //check win condition
        if(curScoreValue == tarScoreValue) {
            if(isDebugging) console.log("Parkour Scoring: target score reached!");
            //disable further scoring interactions
            isActive = false;
            //process all callbacks
            for (var i: number = 0; i < scoreCallbacks.size(); i++) {
                scoreCallbacks.getItem(i)();
            }
        }
    }

    /** if system is active returns render data, providing a viewable score */
    export function GetRender() {
        //ensure scoring is active
        if(!isShown) return null;

        //provide scoring draw data
        return<UiEntity key= {"PKS-000"}
        uiTransform={{ width: 190, height: 60, position: { top:0, left:-95, }, positionType: 'absolute', }}
        uiBackground={{ color: Color4.Black() }}
        >
            <UiEntity key= {"PKS-001"}
                uiTransform={{ width: 180, height: 50, position: { top:5, left:5, }, }}
                uiBackground={{ color: Color4.White() }}
                uiText={{ 
                    color: Color4.Black(),
                    value: 'Player Score: '+curScoreValue.toString()+' ('+tarScoreValue.toString()
                            +')\nCollectibles: '+curCollectibles.toString()+'/'+tarCollectibles.toString(),
                    fontSize: 18 
                }}
            >
            
            </UiEntity>
        </UiEntity>
    }

    //EVERYTHING BELOW THIS POINT IS FOR THE 'ABOUT THIS MODEL' DISPLAY, YOU CAN DELETE THIS
    var infoEnabled:boolean = false;
    export function toggleDisplay() { infoEnabled = !infoEnabled; console.log("state:"+infoEnabled)}
    /** starts rendering the 2UI, if you want to bundle this ui with your own draw method, get the parkour ui via 'GetRender' method  */
    export function StartRender() {
        //starts rendering, just places the parkour hud at the center top of the player's screen
        ReactEcsRenderer.setUiRenderer(() => (
            <UiEntity key={'info-000'}
                uiTransform={{
                    //wide order
                    width: '100%', height: 0,
                    position: { top:'0%', left:'50%' },
                    //height order
                    /*width: 1, height: '100%',
                    position: { top:'0%', bottom:'0%', left:'50%', right:'0%' },*/
                    positionType: 'absolute',
                    alignContent: 'center',
                    justifyContent: 'center',
                }}
                uiBackground={{ color: Color4.create(1.0, 1.0, 1.0, 0.5) }}
            >
                {GetRender()}
                {GetInfoButton()}
                {GetInfoPanel()}
                
            </UiEntity>
        ));
                //<UiEntity key={'info-001'}>{GetRender()}</UiEntity>{GetInfoPanel()}
    }
    export function GetInfoButton() {
        return<UiEntity key= {"PKS-010"}
        uiTransform={{ width: 60, height: 60, position: { top:0, left:90, }, positionType: 'absolute', }}
        uiBackground={{ color: Color4.Black() }}
        >
            <Button key= {"PKS-011"}
                uiTransform={{ width: 50, height: 50, position: { top:5, left:5, }, }}
                uiBackground={{ color: Color4.White() }}
                value = "?"
                onMouseDown={() => {toggleDisplay()}}
            />
            <UiEntity key= {"PKS-012"}
                uiTransform={{ width: 0, height: 0, position: { top:22.5, left:-22.5, }, }}
                uiBackground={{ color: Color4.Gray() }}
                uiText={{ 
                    color: Color4.Black(),
                    value: '?',
                    fontSize: 50, 
                    textAlign: 'middle-center',
                }}
            />
        </UiEntity>
    }
    export function GetInfoPanel() {
        if(!infoEnabled) return null;
        return<UiEntity key= {"PKS-020"}
        uiTransform={{ width: 480, height: 360, position: { top:180, left:-240, }, positionType: 'absolute', }}
        uiBackground={{ color: Color4.Black() }}
        >
            <UiEntity key= {"PKS-021"}
                uiTransform={{ width: 470, height: 350, position: { top:5, left:5, }, }}
                uiBackground={{ color: Color4.White() }}
            >
                <UiEntity key= {"PKS-022"}
                    uiTransform={{ width: 360, height: 60, position: { top:-30, left:55, }, positionType: 'absolute', }}
                    uiBackground={{ color: Color4.Black() }}
                    >
                    <UiEntity key= {"PKS-023"}
                        uiTransform={{ width: 350, height: 50, position: { top:5, left:5, }, }}
                        uiBackground={{ color: Color4.White() }}
                        uiText={{ 
                            color: Color4.Black(),
                            value: 'ABOUT THIS SCENE:',
                            fontSize: 32 
                        }}
                    />
                </UiEntity>
                <UiEntity key= {"PKS-024"}
                    uiTransform={{ width: 460, height: 310, position: { top:35, left:5, }, }}
                    uiBackground={{ color: Color4.White() }}
                    uiText={{ 
                        color: Color4.Black(),
                        value: about,
                        fontSize: 16, 
                        textAlign: 'top-left',
                  
                    }}
                />
                <UiEntity key= {"PKS-025"}
                    uiTransform={{
                        width: 180, height: 180,
                        position: { top:177, left:298 },
                        positionType: 'absolute',
                    }}
                    uiBackground={{ 
                        //color: whi,
                        textureMode: "stretch",
                        texture: { src: "images/logo-dao-funded.png", filterMode: "point", wrapMode:"repeat" }
                    }}
                />
                <UiEntity key= {"PKS-026"}
                    uiTransform={{ width: 120, height: 60, position: { top:280, left:10, }, positionType: 'absolute', }}
                    uiBackground={{ color: Color4.Black() }}
                >
                    <Button key= {"PKS-027"}
                        uiTransform={{ width: 110, height: 50, position: { top:5, left:5, }, }}
                        uiBackground={{ color: Color4.White() }}
                        value = "?"
                        onMouseDown={() => {OpenLinkRepo();}}
                    />
                    <UiEntity key= {"PKS-028"}
                        uiTransform={{ width: 0, height: 0, position: { top:22.5, left:-52.5, }, }}
                        uiBackground={{ color: Color4.Gray() }}
                        uiText={{ 
                            color: Color4.Black(),
                            value: "GitHub\nRepo",
                            fontSize: 18, 
                            textAlign: 'middle-center',
                        }}
                    />
                </UiEntity>
            </UiEntity>
        </UiEntity>
    }

    function OpenLinkRepo() {
        console.log("opening link")
        openExternalUrl({url: "https://github.com/TheCryptoTrader69/DCL-SDK7-Parkour-Kit"})
    }

    const about = 
    'This scene was built to demonstrate how to set up a basic\n'+
    'parkour course with the Community Parkour Module. This\n'+
    'example includes 3 game stages that can be completed by\n'+
    'picking up coins; a new stage begin after the previous\n'+
    'stage has been completed, the game ends after all stages\n'+
    'have been completed.\n\n'+

    'If you have any feedback, feature requests,\n'+
    'or find any bugs you can reach me via:'+
    '\n\ndiscord: The_Shadow_Wizard'+
    '\ne-mail: thecryptotrader69@gmail.com\n\n'
}