//! Example 01. Simple scene.
//!
//! Difficulty: Easy.
//!
//! This example shows how to create simple scene with animated model.

use fyrox::{
    core::{
        algebra::{Matrix4, UnitQuaternion, Vector3},
        color::Color,
        pool::Handle,
        sstorage::ImmutableString,
    },
    engine::{
        executor::Executor, resource_manager::ResourceManager, GraphicsContextParams, GraphicsContext,
    },
    event::{ElementState, Event, VirtualKeyCode, WindowEvent},
    event_loop::ControlFlow,
    gui::{
        message::MessageDirection,
        text::{TextBuilder, TextMessage},
        widget::WidgetBuilder,
        UiNode,
    },
    material::{shader::SamplerFallback, Material, PropertyValue, SharedMaterial},
    plugin::{Plugin, PluginConstructor, PluginContext},
    scene::{
        base::BaseBuilder,
        light::{point::PointLightBuilder, BaseLightBuilder},
        mesh::{
            surface::{SurfaceBuilder, SurfaceData, SurfaceSharedData},
            MeshBuilder,
        },
        node::Node,
        transform::TransformBuilder,
        Scene, graph::Graph, camera::{SkyBoxBuilder, CameraBuilder}, sound::listener::ListenerBuilder,
    }, resource::texture::TextureWrapMode, window::WindowAttributes,
};

struct GameSceneLoader {
    scene: Scene,
    model_handle: Handle<Node>,
}

impl GameSceneLoader {
    async fn load_with(resource_manager: ResourceManager) -> Self {
        let mut scene = Scene::new();

        // Set ambient light.
        scene.ambient_lighting_color = Color::opaque(200, 200, 200);

        // Camera is our eyes in the world - you won't see anything without it.
        create_camera(
            resource_manager.clone(),
            Vector3::new(0.0, 6.0, -15.0),
            &mut scene.graph,
        )
        .await;

        // Add some light.
        PointLightBuilder::new(BaseLightBuilder::new(
            BaseBuilder::new().with_local_transform(
                TransformBuilder::new()
                    .with_local_position(Vector3::new(0.0, 12.0, 0.0))
                    .build(),
            ),
        ))
        .with_radius(20.0)
        .build(&mut scene.graph);

        // Load model and animation resource in parallel. Is does *not* adds anything to
        // our scene - it just loads a resource then can be used later on to instantiate
        // models from it on scene. Why loading of resource is separated from instantiation?
        // Because it is too inefficient to load a resource every time you trying to
        // create instance of it - much more efficient is to load it once and then make copies
        // of it. In case of models it is very efficient because single vertex and index buffer
        // can be used for all models instances, so memory footprint on GPU will be lower.
        let model_resource = resource_manager.request_model("data/Roko.fbx").await.unwrap();


        // Instantiate model on scene - but only geometry, without any animations.
        // Instantiation is a process of embedding model resource data in desired scene.
        let model_handle = model_resource.instantiate(&mut scene);

        // Now we have whole sub-graph instantiated, we can start modifying model instance.
        scene.graph[model_handle]
            .local_transform_mut()
            // Our model is too big, fix it by scale.
            .set_scale(Vector3::new(0.05, 0.05, 0.05))
            .set_rotation(UnitQuaternion::from_axis_angle(&Vector3::x_axis(), -90.0f32.to_radians()));

        let mut material = Material::standard();

        material
            .set_property(
                &ImmutableString::new("diffuseTexture"),
                PropertyValue::Sampler {
                    value: Some(resource_manager.request_texture("data/concrete2.dds")),
                    fallback: SamplerFallback::White,
                },
            )
            .unwrap();

        // Add floor.
        MeshBuilder::new(
            BaseBuilder::new().with_local_transform(
                TransformBuilder::new()
                    .with_local_position(Vector3::new(0.0, -1.25, 0.0))
                    .build(),
            ),
        )
        .with_surfaces(vec![SurfaceBuilder::new(SurfaceSharedData::new(
            SurfaceData::make_cube(Matrix4::new_nonuniform_scaling(&Vector3::new(
                25.0, 0.25, 25.0,
            ))),
        ))
        .with_material(SharedMaterial::new(material))
        .build()])
        .build(&mut scene.graph);

        Self {
            scene,
            model_handle,
        }
    }
}

struct InputController {
    rotate_left: bool,
    rotate_right: bool,
}


use serde::Deserialize;
use ndarray::prelude::*;

#[derive(Deserialize, Debug)]
struct AnimationJson {
    joint_map: Vec<String>,
    thetas: Vec<Vec<Vec<Vec<f32>>>>,
    root_translation: Vec<Vec<Vec<f32>>>,
}

#[derive(Debug)]
struct AnimationNdarray {
    joint_map: Vec<String>,
    thetas: Array4<f32>,
    root_translation: Array3<f32>
}

use ndarray::s;


struct Game {
    scene: Handle<Scene>,
    model_handle: Handle<Node>,
    input_controller: InputController,
    debug_text: Handle<UiNode>,
    model_angle: f32,
    animation_frame: usize,
    animation_ndarray: AnimationNdarray,
}

impl Plugin for Game {
    fn update(&mut self, context: &mut PluginContext, _control_flow: &mut ControlFlow) {
        let scene = &mut context.scenes[self.scene];

        // Rotate model according to input controller state
        if self.input_controller.rotate_left {
            self.model_angle -= 5.0f32.to_radians();
        } else if self.input_controller.rotate_right {
            self.model_angle += 5.0f32.to_radians();
        }

        let joint_map = vec![
            "DEF-spine",
            "DEF-thigh.L",
            "DEF-thigh.R",
            "DEF-spine.001",
            "DEF-shin.L",
            "DEF-shin.R",
            "DEF-spine.002",
            "DEF-foot.L",
            "DEF-foot.R",
            "DEF-spine.003",
            "DEF-toe.L",
            "DEF-toe.R",
            "DEF-spine.004",
            "DEF-shoulder.L",
            "DEF-shoulder.R",
            "DEF-spine.006",
            "DEF-upper_arm.L",
            "DEF-upper_arm.R",
            "DEF-forearm.L",
            "DEF-forearm.R",
            "DEF-hand.L",
            "DEF-hand.R"
        ];


        for joint_index in 0..joint_map.len() {
            let bone_handle = scene.graph.find_by_name_from_root(joint_map[joint_index]).unwrap().0;
            let bone_node = &mut scene.graph[bone_handle];
            let transform = bone_node.local_transform_mut();
            let axes_rotations = self.animation_ndarray.thetas.slice(s![0, self.animation_frame, joint_index, 0..3usize]);


            // default bones - just apply the rotations raw
            transform.set_rotation(
                UnitQuaternion::from_axis_angle(&Vector3::x_axis(), axes_rotations[0usize].to_radians()) *
                UnitQuaternion::from_axis_angle(&Vector3::y_axis(), axes_rotations[1usize].to_radians()) *
                UnitQuaternion::from_axis_angle(&Vector3::z_axis(), axes_rotations[2usize].to_radians()) 
            );

            // Spine - needs an offset otherwise the model floats diagonally in the air
            if joint_index == 0 {
                transform.set_rotation(
                    UnitQuaternion::from_axis_angle(&Vector3::x_axis(), axes_rotations[0usize].to_radians()+1.5) *
                    UnitQuaternion::from_axis_angle(&Vector3::y_axis(), axes_rotations[1usize].to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::z_axis(), axes_rotations[2usize].to_radians()) 
                );
            }
            

            // Left thigh - needs offset to not be rotated toward the head, and inverted axis to move the correct
            // direction
            if joint_index == 1 {
                transform.set_rotation(
                    UnitQuaternion::from_axis_angle(&Vector3::x_axis(), axes_rotations[0usize].to_radians()+3.14) *
                    UnitQuaternion::from_axis_angle(&Vector3::y_axis(), axes_rotations[1usize].to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::z_axis(), (-1.0*(axes_rotations[2usize]+5.0)).to_radians())
                );
            }
            
            // Right thigh - needs offset to not be rotated toward the head, and inverted axis to move the correct
            // direction
            if joint_index == 2 {
                transform.set_rotation(
                    UnitQuaternion::from_axis_angle(&Vector3::x_axis(), axes_rotations[0usize].to_radians()+3.14) *
                    UnitQuaternion::from_axis_angle(&Vector3::y_axis(), axes_rotations[1usize].to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::z_axis(), (-1.0*(axes_rotations[2usize]-5.0)).to_radians())
                );
            }

            // Left Foot
            if joint_index == 7 {
                transform.set_rotation(
                    UnitQuaternion::from_axis_angle(&Vector3::x_axis(), (axes_rotations[0usize]-90.0).to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::y_axis(), (axes_rotations[1usize]-160.0).to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::z_axis(), axes_rotations[2usize].to_radians()) 
                );
            }

            // Right foot
            if joint_index == 8 {
                transform.set_rotation(
                    UnitQuaternion::from_axis_angle(&Vector3::x_axis(), (axes_rotations[0usize]-90.0).to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::y_axis(), (axes_rotations[1usize]-160.0).to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::z_axis(), axes_rotations[2usize].to_radians()) 
                );
            }

            // Left Toe
            if joint_index == 10 {
                transform.set_rotation(
                    UnitQuaternion::from_axis_angle(&Vector3::x_axis(), (axes_rotations[0usize]).to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::y_axis(), (axes_rotations[1usize]-180.0).to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::z_axis(), (axes_rotations[2usize]).to_radians()) 
                );
            }
            
            // Right Toe
            if joint_index == 11 {
                transform.set_rotation(
                    UnitQuaternion::from_axis_angle(&Vector3::x_axis(), (axes_rotations[0usize]).to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::y_axis(), (axes_rotations[1usize]+180.0).to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::z_axis(), (axes_rotations[2usize]).to_radians()) 
                );
            }


            // Left Shoulder - offset from T-pose to resting by the side
            if joint_index == 13 { 
                transform.set_rotation(
                    UnitQuaternion::from_axis_angle(&Vector3::x_axis(), axes_rotations[0usize].to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::y_axis(), axes_rotations[1usize].to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::z_axis(), (axes_rotations[2usize]-80.0).to_radians()) 
                );
            }

            // Right Shoulder - offset from T-pose to resting by the side
            if joint_index == 14 { 
                transform.set_rotation(
                    UnitQuaternion::from_axis_angle(&Vector3::x_axis(), axes_rotations[0usize].to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::y_axis(), axes_rotations[1usize].to_radians()) *
                    UnitQuaternion::from_axis_angle(&Vector3::z_axis(), (axes_rotations[2usize]+80.0).to_radians()) 
                );
            }
        }

        let root_handle = self.model_handle;
        let bone_node = &mut scene.graph[root_handle];
        let transform = bone_node.local_transform_mut();
        let xyz = self.animation_ndarray.root_translation.slice(s![0,self.animation_frame, 0..3usize]);
        transform.set_position(Vector3::new(-xyz[0usize], xyz[1usize], -xyz[2usize]));

        self.animation_frame += 1;
        if self.animation_frame >= 120 {
            self.animation_frame = 0;
        };


        scene.graph[self.model_handle]
            .local_transform_mut()
            .set_rotation(UnitQuaternion::from_axis_angle(&Vector3::x_axis(), -90.0) * UnitQuaternion::from_axis_angle(
                &Vector3::z_axis(),
                self.model_angle,
            ));

        if let GraphicsContext::Initialized(ref graphics_context) = context.graphics_context {
            context.user_interface.send_message(TextMessage::text(
                self.debug_text,
                MessageDirection::ToWidget,
                format!(
                    "Storyteller Animation Viewer\nUse [A][D] keys to rotate model.\nFPS: {}",
                    graphics_context.renderer.get_statistics().frames_per_second
                ),
            ));
        }
    }

    fn on_os_event(
        &mut self,
        event: &Event<()>,
        _context: PluginContext,
        _control_flow: &mut ControlFlow,
    ) {
        if let Event::WindowEvent {
            event: WindowEvent::KeyboardInput { input, .. },
            ..
        } = event
        {
            if let Some(key_code) = input.virtual_keycode {
                match key_code {
                    VirtualKeyCode::A => {
                        self.input_controller.rotate_left = input.state == ElementState::Pressed
                    }
                    VirtualKeyCode::D => {
                        self.input_controller.rotate_right = input.state == ElementState::Pressed
                    }
                    _ => (),
                }
            }
        }
    }
}

struct GameConstructor;

impl PluginConstructor for GameConstructor {
    fn create_instance(
        &self,
        _override_scene: Handle<Scene>,
        context: PluginContext,
    ) -> Box<dyn Plugin> {
        let scene = fyrox::core::futures::executor::block_on(GameSceneLoader::load_with(
            context.resource_manager.clone(),
        ));


        let json = std::fs::read_to_string("data/jumping-jacks.json").unwrap();
        let v: AnimationJson = serde_json::from_str(&json).unwrap();
        let thetas_shape = [v.thetas.len(), v.thetas[0].len(), v.thetas[0][0].len(), v.thetas[0][0][0].len()];
        let thetas_flat = v.thetas.iter().flatten().flatten().flatten().map(|f| *f).collect();
        let thetas_ndarray = Array4::from_shape_vec(thetas_shape, thetas_flat).unwrap();
        let translations_shape = [v.root_translation.len(), v.root_translation[0].len(), v.root_translation[0][0].len()];
        let translations_flat = v.root_translation.iter().flatten().flatten().map(|f| *f).collect();
        let translations_ndarray = Array3::from_shape_vec(translations_shape, translations_flat).unwrap();
        
        let animation_ndarray = AnimationNdarray {
            joint_map: v.joint_map,
            thetas: thetas_ndarray,
            root_translation: translations_ndarray
        };

        Box::new(Game {
            debug_text: TextBuilder::new(WidgetBuilder::new())
                .build(&mut context.user_interface.build_ctx()),
            scene: context.scenes.add(scene.scene),
            model_handle: scene.model_handle,
            // Create input controller - it will hold information about needed actions.
            input_controller: InputController {
                rotate_left: false,
                rotate_right: false,
            },
            // We will rotate model using keyboard input.
            model_angle: 180.0f32.to_radians(),
            animation_frame: 0,
            animation_ndarray,
        })
    }
}

fn main() {
    let mut executor = Executor::from_params(
        Default::default(),
        GraphicsContextParams {
            window_attributes: WindowAttributes {
                title: "Storyteller Animation Viewer".to_string(),
                ..Default::default()
            },
            vsync: true,
        },
    );
    executor.add_plugin_constructor(GameConstructor);
    executor.set_desired_update_rate(24.0);
    executor.run()
}

/// Creates a camera at given position with a skybox.
pub async fn create_camera(
    resource_manager: ResourceManager,
    position: Vector3<f32>,
    graph: &mut Graph,
) -> Handle<Node> {
    // Load skybox textures in parallel.
    let (front, back, left, right, top, bottom) = fyrox::core::futures::join!(
        resource_manager
            .request_texture("data/skyboxes/DarkStormy/DarkStormyFront2048.png"),
        resource_manager
            .request_texture("data/skyboxes/DarkStormy/DarkStormyBack2048.png"),
        resource_manager
            .request_texture("data/skyboxes/DarkStormy/DarkStormyLeft2048.png"),
        resource_manager
            .request_texture("data/skyboxes/DarkStormy/DarkStormyRight2048.png"),
        resource_manager.request_texture("data/skyboxes/DarkStormy/DarkStormyUp2048.png"),
        resource_manager
            .request_texture("data/skyboxes/DarkStormy/DarkStormyDown2048.png")
    );

    // Unwrap everything.
    let skybox = SkyBoxBuilder {
        front: Some(front.unwrap()),
        back: Some(back.unwrap()),
        left: Some(left.unwrap()),
        right: Some(right.unwrap()),
        top: Some(top.unwrap()),
        bottom: Some(bottom.unwrap()),
    }
    .build()
    .unwrap();

    // Set S and T coordinate wrap mode, ClampToEdge will remove any possible seams on edges
    // of the skybox.
    if let Some(cubemap) = skybox.cubemap() {
        let mut data = cubemap.data_ref();
        data.set_s_wrap_mode(TextureWrapMode::ClampToEdge);
        data.set_t_wrap_mode(TextureWrapMode::ClampToEdge);
    }

    // Camera is our eyes in the world - you won't see anything without it.
    CameraBuilder::new(
        BaseBuilder::new()
            .with_local_transform(
                TransformBuilder::new()
                    .with_local_position(position)
                    .build(),
            )
            .with_children(&[
                // Create sound listener, otherwise we'd heat sound as if we'd be in (0,0,0)
                ListenerBuilder::new(BaseBuilder::new()).build(graph),
            ]),
    )
    .with_skybox(skybox)
    .build(graph)
}


