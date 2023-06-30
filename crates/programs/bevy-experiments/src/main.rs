use bevy::{
    pbr::{CascadeShadowConfigBuilder, DirectionalLightShadowMap},
    prelude::*,
    animation::{AnimationClip, AnimationPlayer}, 
};

use bevy_mod_picking::prelude::*;
//use bevy_inspector_egui::quick::WorldInspectorPlugin;
use bevy_transform_gizmo::GizmoTransformable;


fn main() {
    App::new()
        .insert_resource(AmbientLight {
            color: Color::YELLOW,
            brightness: 1.0 / 5.0f32,
        })
        .insert_resource(DirectionalLightShadowMap { size: 4096 })
        .add_plugins(DefaultPlugins)
        .add_plugins(DefaultPickingPlugins.build().disable::<DebugPickingPlugin>().disable::<DefaultHighlightingPlugin>())
        .add_plugin(bevy_transform_gizmo::TransformGizmoPlugin::default())
        //.add_plugin(WorldInspectorPlugin::new())
        .add_startup_system(setup)
        .add_system(add_root_gizmo)
        .add_system(make_pickable)
        .add_event::<SelectRoot>()
        .add_system(set_selection.run_if(on_event::<SelectRoot>()))
        .add_system(play_animation)
        .run();
}

#[derive(Resource)]
struct Animations(Vec<Handle<AnimationClip>>);

#[derive(Component)]
struct MainCamera;

#[derive(Component)]
struct Roko;

fn setup(mut commands: Commands, asset_server: Res<AssetServer>,

    ) {

    // camera
    commands.spawn((
        Camera3dBundle {
            transform: Transform::from_xyz(2.0, 2.5, 5.0).looking_at(Vec3::ZERO, Vec3::Y),
            ..default()
        },
        RaycastPickCamera::default(),
        bevy_transform_gizmo::GizmoPickSource::default(),
    ));
        
    commands.insert_resource(Animations(vec![
        asset_server.load("Roko_Anim_Wave_noOptimization.glb#Animation0"),
    ]));

    commands.spawn(DirectionalLightBundle {
        directional_light: DirectionalLight {
            shadows_enabled: true,
            ..default()
        },
        cascade_shadow_config: CascadeShadowConfigBuilder {
            num_cascades: 1,
            maximum_distance: 1.6,
            ..default()
        }
        .into(),
        transform: Transform {
            translation: Vec3::new(-5.0, 1.0, 5.0),
            rotation: Quat::from_xyzw(0.6, 0.0, -0.6, -0.5),
            scale: Vec3::ONE,
        },
        ..default()
    });

    //roko scene
    let scene = asset_server.load("Roko_nogamerig.glb#Scene0");
    commands.spawn((SceneBundle {
        scene,
        ..default()
    },
        Roko,
    ));
}

fn add_root_gizmo(
    mut commands: Commands,
    query: Query<Entity, With<Roko>>,
    mut done: Local<bool>,
)
{
    if !*done {
        for entity in query.iter() {
            commands.entity(entity).insert(PickableBundle::default()); 
            commands.entity(entity).insert(GizmoTransformable);
            commands.entity(entity).insert(RaycastPickTarget::default());
            commands.entity(entity).insert(
                // When any mesh in the scene is selected, select the root entity's gizmo
                OnPointer::<Click>::send_event::<SelectRoot>(),
            );

            *done = true;
        }
    }
}


/// Makes everything in the scene with a mesh pickable
fn make_pickable(
    mut commands: Commands,
    meshes: Query<Entity, (With<Handle<Mesh>>, Without<RaycastPickTarget>)>,
) {
    for entity in meshes.iter() {
        commands.entity(entity).insert((
            PickableBundle::default(),
            RaycastPickTarget::default(),
        ));
    }
}

/// When any mesh in the scene is selected, select the root entity's gizmo
struct SelectRoot(Entity);

impl From<ListenedEvent<Click>> for SelectRoot {
    fn from(event: ListenedEvent<Click>) -> Self {
        SelectRoot(event.listener)
    }
}


/// When any mesh in the scene is selected, select the root entity's gizmo
fn set_selection(mut events: EventReader<SelectRoot>, mut query: Query<(Entity, &mut PickSelection)> ) {
    for event in events.iter() {
        let (_entity, mut selection) = query.get_mut(event.0).unwrap();
        selection.is_selected = true;
    }
}

fn play_animation(
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
