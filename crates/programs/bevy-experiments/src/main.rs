use bevy::{
    prelude::*, window::{PresentMode, WindowMode},
};

//use bevy_inspector_egui::quick::WorldInspectorPlugin;

mod gizmo;
mod skybox;
mod camera;
mod animation;
mod light;
mod ui;

use bevy_mod_picking::{prelude::*, DefaultPickingPlugins};
use bevy_transform_gizmo::TransformGizmoPlugin;
use::bevy_egui::EguiPlugin;

use gizmo::{make_pickable, gizmo_system, SelectRoot, set_selection};
use light::light_setup;
use camera::{camera_setup, snap_to_render_cam, CameraControllerPlugin, SnapToRenderCam};
use animation::{animation_setup, animation_system};
use skybox::skybox_setup;
use ui::ui_system;

fn main() {
    App::new()
        .add_plugins(DefaultPlugins.set(WindowPlugin {
        primary_window: Some(Window {
            present_mode: PresentMode::AutoNoVsync, // Reduces input lag.
            fit_canvas_to_parent: true,
            //mode: WindowMode::Fullscreen,
            ..default()
        }),
        ..default()
    }))
        .add_plugin(CameraControllerPlugin)
        .add_plugins(DefaultPickingPlugins.build()
            .disable::<DebugPickingPlugin>()
            .disable::<DefaultHighlightingPlugin>()
        )
        .add_plugin(TransformGizmoPlugin::default())
        .add_plugin(EguiPlugin)
        //.add_plugin(WorldInspectorPlugin::new())
        .add_startup_system(setup)
        .add_startup_system(light_setup)
        .add_startup_system(skybox_setup)
        .add_startup_system(camera_setup)
        .add_startup_system(animation_setup)
        .add_system(gizmo_system)
        .add_system(animation_system)
        .add_system(make_pickable)
        .add_event::<SelectRoot>()
        .add_event::<SnapToRenderCam>()
        .add_system(set_selection.run_if(on_event::<SelectRoot>()))
        .add_system(ui_system)
        .add_system(snap_to_render_cam.run_if(on_event::<SnapToRenderCam>()))
    .run();
    
}

#[derive(Component)]
pub(crate) struct Roko;

fn setup(mut meshes: ResMut<Assets<Mesh>>, mut materials: ResMut<Assets<StandardMaterial>>, mut commands: Commands, asset_server: Res<AssetServer>) {
    //roko scene
    let scene = asset_server.load("Roko_nogamerig.glb#Scene0");
    commands.spawn((SceneBundle {
        scene,
        ..default()
    },
        Roko,
    ));

    //floor 
    let floor = meshes.add(shape::Plane::from_size(10.0).into());
    let floor_mat = materials.add(StandardMaterial {
        base_color_texture: Some(asset_server.load("dirt_2_1024.png")),
        emissive_texture: Some(asset_server.load("dirt_2_1024.png")),
        unlit: true,
        ..default()
    });
    commands.spawn(MaterialMeshBundle::<StandardMaterial> {
      mesh: floor,
      material: floor_mat,
      ..default()
    });
}
