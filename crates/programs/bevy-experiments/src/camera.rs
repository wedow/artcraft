use bevy::render::camera::RenderTarget;
use bevy::render::render_resource::{TextureUsages, TextureFormat, TextureDimension, Extent3d, TextureDescriptor};
use bevy::window::CursorGrabMode;
use bevy::{input::mouse::MouseMotion, prelude::*};
use bevy_mod_picking::prelude::RaycastPickCamera;
use bevy_transform_gizmo::GizmoTransformable;

use std::f32::consts::*;
use std::fmt;

pub(crate) const RADIANS_PER_DOT: f32 = 1.0 / 180.0;

const RENDER_WIDTH: u32 = 1920;
const RENDER_HEIGHT: u32 = 1080;

#[derive(Component)]
pub(crate) struct RenderCam;

#[derive(Component)]
pub(crate) struct ViewportCam;

pub(crate) fn camera_setup(
    mut commands: Commands,
    asset_server: Res<AssetServer>,
    mut images: ResMut<Assets<Image>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    // viewport camera
    commands.spawn(((
        Camera3dBundle {
            transform: Transform::from_xyz(0.3, 2.0, 5.0).looking_at(Vec3::new(0.0, 1.0, 0.0), Vec3::Y),
            camera: Camera {
                order: 0,
                ..default()
            },
            ..default()
        },
       EnvironmentMapLight {
            diffuse_map: asset_server.load("pisa_diffuse_rgb9e5_zstd.ktx2"),
            specular_map: asset_server.load("pisa_specular_rgb9e5_zstd.ktx2"),
        },
        RaycastPickCamera::default(),
        bevy_transform_gizmo::GizmoPickSource::default(),
        CameraController::default(),
    ), ViewportCam));


    
    // render cam
    

    let output_texture_handle = {
        let size = Extent3d {
            width: RENDER_WIDTH,
            height: RENDER_HEIGHT,
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


    let camera_proxy_mesh = asset_server.load("cameraProxy.glb#Mesh0/Primitive0");
    let camera_proxy_mat = materials.add(StandardMaterial {
        base_color: Color::BLACK,
        ..default()
    });
    commands.spawn(((MaterialMeshBundle::<StandardMaterial> {
        mesh: camera_proxy_mesh,
        material: camera_proxy_mat,
        transform: Transform::from_xyz(0.0, 2.0, 5.0)
            .with_rotation(Quat::from_rotation_x(TAU/2.0))
            .with_scale(Vec3::new(0.2, 0.2, 0.2)),
        ..default()
    }), GizmoTransformable))
        .with_children(|parent| {
            parent.spawn(((
                Camera3dBundle {
                    transform: Transform::from_xyz(0.0, 0.0, 2.0).with_rotation(Quat::from_rotation_x(TAU/2.0)),
                    camera: Camera {
                        order: 1,
                        target: RenderTarget::Image(output_texture_handle.clone()),
                        ..default()
                    },
                    ..default()
                },
                EnvironmentMapLight {
                    diffuse_map: asset_server.load("pisa_diffuse_rgb9e5_zstd.ktx2"),
                    specular_map: asset_server.load("pisa_specular_rgb9e5_zstd.ktx2"),
                },
            ), RenderCam));
        });

}

#[derive(Component)]
pub(crate) struct CameraController {
    pub enabled: bool,
    pub initialized: bool,
    pub sensitivity: f32,
    pub key_forward: KeyCode,
    pub key_back: KeyCode,
    pub key_left: KeyCode,
    pub key_right: KeyCode,
    pub key_up: KeyCode,
    pub key_down: KeyCode,
    pub key_run: KeyCode,
    pub mouse_key_enable_mouse: MouseButton,
    pub keyboard_key_enable_mouse: KeyCode,
    pub walk_speed: f32,
    pub run_speed: f32,
    pub friction: f32,
    pub pitch: f32,
    pub yaw: f32,
    pub velocity: Vec3,
}

impl Default for CameraController {
    fn default() -> Self {
        Self {
            enabled: true,
            initialized: false,
            sensitivity: 1.0,
            key_forward: KeyCode::W,
            key_back: KeyCode::S,
            key_left: KeyCode::A,
            key_right: KeyCode::D,
            key_up: KeyCode::E,
            key_down: KeyCode::Q,
            key_run: KeyCode::LShift,
            mouse_key_enable_mouse: MouseButton::Right,
            keyboard_key_enable_mouse: KeyCode::M,
            walk_speed: 5.0,
            run_speed: 15.0,
            friction: 0.5,
            pitch: 0.0,
            yaw: 0.0,
            velocity: Vec3::ZERO,
        }
    }
}

impl fmt::Display for CameraController {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "
Freecam Controls:
    MOUSE\t- Move camera orientation
    {:?}/{:?}\t- Enable mouse movement
    {:?}{:?}\t- forward/backward
    {:?}{:?}\t- strafe left/right
    {:?}\t- 'run'
    {:?}\t- up
    {:?}\t- down",
            self.mouse_key_enable_mouse,
            self.keyboard_key_enable_mouse,
            self.key_forward,
            self.key_back,
            self.key_left,
            self.key_right,
            self.key_run,
            self.key_up,
            self.key_down
        )
    }
}

pub(crate) struct CameraControllerPlugin;

impl Plugin for CameraControllerPlugin {
    fn build(&self, app: &mut App) {
        app.add_system(camera_controller);
    }
}

fn camera_controller(
    time: Res<Time>,
    mut windows: Query<&mut Window>,
    mut mouse_events: EventReader<MouseMotion>,
    mouse_button_input: Res<Input<MouseButton>>,
    key_input: Res<Input<KeyCode>>,
    mut move_toggled: Local<bool>,
    mut query: Query<(&mut Transform, &mut CameraController), With<Camera>>,
) {
    let dt = time.delta_seconds();

    if let Ok((mut transform, mut options)) = query.get_single_mut() {
        if !options.initialized {
            let (yaw, pitch, _roll) = transform.rotation.to_euler(EulerRot::YXZ);
            options.yaw = yaw;
            options.pitch = pitch;
            options.initialized = true;
        }
        if !options.enabled {
            return;
        }

        // Handle key input
        let mut axis_input = Vec3::ZERO;
        if key_input.pressed(options.key_forward) {
            axis_input.z += 1.0;
        }
        if key_input.pressed(options.key_back) {
            axis_input.z -= 1.0;
        }
        if key_input.pressed(options.key_right) {
            axis_input.x += 1.0;
        }
        if key_input.pressed(options.key_left) {
            axis_input.x -= 1.0;
        }
        if key_input.pressed(options.key_up) {
            axis_input.y += 1.0;
        }
        if key_input.pressed(options.key_down) {
            axis_input.y -= 1.0;
        }
        if key_input.just_pressed(options.keyboard_key_enable_mouse) {
            *move_toggled = !*move_toggled;
        }

        // Apply movement update
        if axis_input != Vec3::ZERO {
            let max_speed = if key_input.pressed(options.key_run) {
                options.run_speed
            } else {
                options.walk_speed
            };
            options.velocity = axis_input.normalize() * max_speed;
        } else {
            let friction = options.friction.clamp(0.0, 1.0);
            options.velocity *= 1.0 - friction;
            if options.velocity.length_squared() < 1e-6 {
                options.velocity = Vec3::ZERO;
            }
        }
        let forward = transform.forward();
        let right = transform.right();
        transform.translation += options.velocity.x * dt * right
            + options.velocity.y * dt * Vec3::Y
            + options.velocity.z * dt * forward;

        // Handle mouse input
        let mut mouse_delta = Vec2::ZERO;
        if mouse_button_input.pressed(options.mouse_key_enable_mouse) || *move_toggled {
            for mut window in &mut windows {
                if !window.focused {
                    continue;
                }

                window.cursor.grab_mode = CursorGrabMode::Locked;
                window.cursor.visible = false;
            }

            for mouse_event in mouse_events.iter() {
                mouse_delta += mouse_event.delta;
            }
        }
        if mouse_button_input.just_released(options.mouse_key_enable_mouse) {
            for mut window in &mut windows {
                window.cursor.grab_mode = CursorGrabMode::None;
                window.cursor.visible = true;
            }
        }

        if mouse_delta != Vec2::ZERO {
            // Apply look update
            options.pitch = (options.pitch - mouse_delta.y * RADIANS_PER_DOT * options.sensitivity)
                .clamp(-PI / 2., PI / 2.);
            options.yaw -= mouse_delta.x * RADIANS_PER_DOT * options.sensitivity;
            transform.rotation = Quat::from_euler(EulerRot::ZYX, 0.0, options.yaw, options.pitch);
        }
    }
}

pub(crate) struct SnapToRenderCam;

pub(crate) fn snap_to_render_cam(mut viewport_query: Query<&mut Transform, (With<ViewportCam>, Without<RenderCam>)>, mut render_query: Query<&GlobalTransform, (With<RenderCam>, Without<ViewportCam>)>) {
    let view_tran: &mut Transform = &mut viewport_query.get_single_mut().unwrap();
    let rend_tran: &GlobalTransform  = render_query.get_single_mut().unwrap();
    *view_tran = (*rend_tran).into(); 
}

