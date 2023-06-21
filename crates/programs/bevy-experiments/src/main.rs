use core::time::Duration;

use bevy::{
    pbr::{CascadeShadowConfigBuilder, DirectionalLightShadowMap},
    prelude::*,
    animation::{AnimationClip, AnimationPlayer},
};

use bevy::{
    render::{
        camera::RenderTarget,
        render_resource::{
            Extent3d, TextureDescriptor, TextureDimension, TextureFormat, TextureUsages,
        },
    },
};

use bevy_image_export::{ImageExportPlugin, ImageExportSource, ImageExportBundle};
use bevy::winit::WinitPlugin;
use bevy::app::ScheduleRunnerSettings;
use bevy::app::ScheduleRunnerPlugin;
use bevy::app::AppExit;

// number of frames after which the application exits
const DESIRED_FRAME_COUNT: u32 = 120;

fn main() {
    let export_plugin = ImageExportPlugin::default();
    let export_threads = export_plugin.threads.clone();
    App::new()
        .insert_resource(AmbientLight {
            color: Color::WHITE,
            brightness: 1.0 / 5.0f32,
        })
        .insert_resource(DirectionalLightShadowMap { size: 4096 })
        .insert_resource(ScheduleRunnerSettings::run_loop(Duration::from_secs_f64(0.0)))
        .add_plugins(DefaultPlugins.build().disable::<WinitPlugin>())
        .add_plugin(ScheduleRunnerPlugin)
        .add_plugin(export_plugin)
        .add_startup_system(setup)
        .add_system(update)
        .run();
    export_threads.finish();
}

#[derive(Resource)]
struct Animations(Vec<Handle<AnimationClip>>);

fn setup(mut commands: Commands, asset_server: Res<AssetServer>) {
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
            translation: Vec3::new(0.0, 0.0, 0.0),
            rotation: Quat::from_xyzw(-0.5, 0.0, 0.0, 0.8517),
            scale: Vec3::ONE,
        },
        ..default()
    });

    commands.spawn((
        SceneBundle {
            scene: asset_server.load("Roko_nogamerig.glb#Scene0"),
            transform: Transform::from_xyz(0.0, 0.0, 0.0),
            ..default()
        }, 
        Roko
    ));

}


#[derive(Component)]
struct Roko;

#[derive(Component)]
struct ExportBundleMarker;

fn update(
    mut commands: Commands,
    export_bundles: Query<Entity, With<ExportBundleMarker>>,
    _roko: Query<Entity, With<Roko>>,
    mut frame: Local<u32>,
    mut exit: EventWriter<AppExit>,
	mut animation_player: Query<&mut AnimationPlayer>,
	animations: Res<Animations>,
	mut anim_started: Local<bool>,
	mut img_exp_started: Local<bool>,
    mut images: ResMut<Assets<Image>>,
    mut export_sources: ResMut<Assets<ImageExportSource>>

) {
    if !*anim_started {
		if let Ok(mut player) = animation_player.get_single_mut() {
			player.play(animations.0[0].clone_weak());//.repeat();
			*anim_started = true;
		}
	}

    // wait for the animation to start before we start exporting images
    // (tryna avoid t-pose frames)
    if let Ok(player) = animation_player.get_single() {
      if *anim_started && !*img_exp_started && player.elapsed() >= 1.0 / 24.0 {
        let output_texture_handle = {
            let size = Extent3d {
                width: 1920,
                height: 1080,
                ..default()
            };
            let mut export_texture = Image {
                texture_descriptor: TextureDescriptor {
                    label: None,
                    size,
                    dimension: TextureDimension::D2,
                    format: TextureFormat::Rgba8UnormSrgb,
                    mip_level_count: 1,
                    sample_count: 1,
                    usage: TextureUsages::COPY_DST
                        | TextureUsages::COPY_SRC
                        | TextureUsages::RENDER_ATTACHMENT,
                    view_formats: &[],
                },
                ..default()
            };
            export_texture.resize(size);

            images.add(export_texture)
        };


            commands.spawn(Camera3dBundle {
                transform: Transform::from_xyz(0.0, 1.5, 1.5),
                camera: Camera {
                    target: RenderTarget::Image(output_texture_handle.clone()),
                    ..default()
                },
                ..default()
            });

            commands.spawn((
                ImageExportBundle {
                    source: export_sources.add(bevy_image_export::ImageExportSource(output_texture_handle)),
                    ..default()
                },
                ExportBundleMarker,
            ));
            *img_exp_started = true;
        }


        if *frame == DESIRED_FRAME_COUNT {
            commands.entity(export_bundles.single()).despawn();
            exit.send(AppExit);
        } 


        if *img_exp_started  {
            *frame += 1;
        }    
    }
}

