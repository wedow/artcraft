use bevy::{
    prelude::*,
    pbr::{CascadeShadowConfigBuilder, DirectionalLightShadowMap},
};

pub(crate) fn light_setup(mut commands: Commands) {
    commands.insert_resource(AmbientLight {
            color: Color::YELLOW,
            brightness: 1.0 / 5.0f32,
    });
    commands.insert_resource(DirectionalLightShadowMap { size: 4096 });
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
}
