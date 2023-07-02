use bevy::{
    prelude::*,
    animation::{AnimationClip, AnimationPlayer}, 
};

#[derive(Resource)]
pub(crate) struct Animations(Vec<Handle<AnimationClip>>);

pub(crate) fn animation_setup(
    mut commands: Commands,
    asset_server: Res<AssetServer>,
) {
    commands.insert_resource(Animations(vec![
        asset_server.load("Roko_Anim_Wave_noOptimization.glb#Animation0"),
    ]));
}

pub(crate) fn animation_system(
    mut animation_player: Query<&mut AnimationPlayer>,
    animations: Res<Animations>,
    mut done: Local<bool>,
) {
    if !*done {
        if let Ok(mut player) = animation_player.get_single_mut() {
            player.play(animations.0[0].clone_weak()).repeat();
            *done = true;
        }
    }
}

