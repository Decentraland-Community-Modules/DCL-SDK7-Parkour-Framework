import { ParkourStageManager } from './parkour-core/parkour-stage-manager';
import { STAGE_TYPE } from './parkour-core/config/stage-config';
import { CollectibleData } from './parkour-core/data/collectible-data';
import { ParkourCollectible } from './parkour-core/parkour-collectible';
import { ParkourScoring } from './parkour-core/parkour-scoring.ui';
import { AudioManager } from './utilities/audio-manager';
import { engine, Transform, MeshRenderer, MeshCollider, ColliderLayer, pointerEventsSystem, InputAction } from '@dcl/sdk/ecs';
import { Vector3, Quaternion } from '@dcl/sdk/math';

/**
 * main function that initializes scene and prepares it for play
 */
export function main() 
{
  //load in audio
  //  pick-ups (you can set these per-type so fancier coins make fancier noices)
  for (const collectible of CollectibleData) {
    AudioManager.Instance.AddSound(collectible.id, collectible.sound);
  }



  //callback linking
  //  NOTE: this could be relegated to another file/hidden in an initializer function, but I up them here for
  //  for the sake of modularity & so you can see how everything is hooked up without having to dive into each
  //  individual file to find out how to link your events up. I've noticed a LOT of people struggle with tackling
  //  cylindrical deps: this is one of the better ways to ensure your design remains modular/plug-and-play
  //collectible callbacks are assigned per type
  for (const collectible of CollectibleData) {
    //adds a callback to the collectible's callback registry for the current collectible that will add that collectible's score to the score manager
    ParkourCollectible.RegisterCallback(collectible.id, () => {ParkourScoring.IncCollectible();ParkourScoring.AddScore(collectible.value);} );
    //play the collectible's gather sfx
    ParkourCollectible.RegisterCallback(collectible.id, () => {AudioManager.Instance.PlaySound(collectible.id);} );
  }
  //scoring callbacks
  //  when the score manager reaches the required score, it will call 
  ParkourScoring.RegisterCallback(ParkourStageManager.CompleteStage);

  //define game stages
  //  NOTE: the game is set up to process all game stages that are pushed into this array, iterating through them
  //  in an as-ordered basis. this is dynamic, so you can have multiple multi-stage games within your scene.
  //in this case we are creating a new array and just adding every stage to the game
  ParkourStageManager.GameStages = [];
  for (const stageName of Object.values(STAGE_TYPE)) {
    ParkourStageManager.GameStages.push(stageName);
  }

  //create start game button
  const entity = engine.addEntity();
  Transform.create(entity,
  ({
      position: Vector3.create(2, 0.6, 2),
      scale: Vector3.create(0.1, 1.2, 0.1),
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
  }));
  //set up renderer
  MeshRenderer.setBox(entity);
  MeshCollider.setBox(entity, ColliderLayer.CL_POINTER);
  //primary action -> interact with key
  pointerEventsSystem.onPointerDown({entity: entity,
    opts: {
        hoverText: "[E] - Start Game",
        button: InputAction.IA_ANY,
        maxDistance: 12
    }},
    (e) => {
        if(e.button == InputAction.IA_PRIMARY || e.button == InputAction.IA_POINTER) ParkourStageManager.StartGame();
    }
  );

  //start ui draw
  //  NOTE: the scoring draw comes bundled in a single entity container, just append and place as needed in your UI 
  ParkourScoring.StartRender();
}