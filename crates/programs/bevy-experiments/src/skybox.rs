use std::f32::consts::TAU;

use bevy::{
    prelude::*,
    pbr::{NotShadowCaster, NotShadowReceiver},
    math::EulerRot::XYZ
};

pub(crate) fn skybox_setup(mut meshes: ResMut<Assets<Mesh>>, mut materials: ResMut<Assets<StandardMaterial>>, mut commands: Commands, asset_server: Res<AssetServer>) {
    let spheremap_tex = asset_server.load("spheremap.png");
    let material = materials.add(StandardMaterial {
        base_color_texture: Some(spheremap_tex.clone()),
        emissive_texture: Some(spheremap_tex),
        double_sided:true,
        unlit: true,
        cull_mode: None,
        ..default()
    });
    let sphere = meshes.add(shape::UVSphere {
        radius: 6.0, 
        ..default()
    }.into());
    
    commands.spawn((MaterialMeshBundle::<StandardMaterial> {
        mesh: sphere,
        material,
        transform: Transform::from_rotation(Quat::from_euler(XYZ, -TAU / 4.0, 0.0, TAU / 2.0)).with_translation(Vec3::new(0.0, 3.0, 0.0)),
        ..default()
    }, NotShadowCaster, NotShadowReceiver));
}
