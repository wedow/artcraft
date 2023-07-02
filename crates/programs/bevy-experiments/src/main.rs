use bevy::{
    prelude::*, pbr::{NotShadowCaster, NotShadowReceiver},
};

use bevy_inspector_egui::quick::WorldInspectorPlugin;

mod gizmo;
mod skybox;
mod camera;
mod animation;
mod light;

use bevy_mod_picking::{prelude::*, DefaultPickingPlugins};
use bevy_transform_gizmo::{TransformGizmoPlugin};

use gizmo::{make_pickable, gizmo_system, SelectRoot, set_selection};
use light::light_setup;
use camera::{camera_setup, CameraControllerPlugin};
use animation::{animation_setup, animation_system};
use skybox::{skybox_setup, skybox_system, CubemapMaterial};

fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_plugin(CameraControllerPlugin)
        .add_plugins(DefaultPickingPlugins.build().disable::<DebugPickingPlugin>().disable::<DefaultHighlightingPlugin>())
        .add_plugin(TransformGizmoPlugin::default())
        .add_plugin(MaterialPlugin::<CubemapMaterial>::default())
        .add_plugin(WorldInspectorPlugin::new())
        .add_startup_system(setup)
        .add_startup_system(light_setup)
//        .add_startup_system(skybox_setup)
        .add_startup_system(camera_setup)
        .add_startup_system(animation_setup)
        .add_system(gizmo_system)
//        .add_system(skybox_system)
        .add_system(animation_system)
        .add_system(make_pickable)
        .add_event::<SelectRoot>()
        .add_system(set_selection.run_if(on_event::<SelectRoot>()))
        .run();
}

#[derive(Component)]
pub(crate) struct Roko;

fn setup(mut materials: ResMut<Assets<StandardMaterial>>,mut commands: Commands, asset_server: Res<AssetServer>) {
    //roko scene
    let scene = asset_server.load("Roko_nogamerig.glb#Scene0");
    commands.spawn((SceneBundle {
        scene,
        ..default()
    },
        Roko,
    ));
    let spheremap_tex = asset_server.load("spheremap2.png");
    let material = materials.add(StandardMaterial {
        //base_color: Color::BLUE,
        base_color_texture: Some(spheremap_tex.clone()),
        emissive_texture: Some(spheremap_tex),
        unlit: true,
        ..default()
    });
    let sphere = asset_server.load("Sky_Sphere.glb#Mesh0/Primitive0");
    commands.spawn((MaterialMeshBundle::<StandardMaterial> {
        mesh: sphere,
        material: material,
        transform: Transform {
            scale: Vec3::new(0.2, 0.2, 0.2),
            ..default()
        },
        ..default()
    }, NotShadowCaster, NotShadowReceiver));
}


