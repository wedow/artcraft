use bevy::{
    prelude::*,
};

use bevy_mod_picking::prelude::*;
use bevy_transform_gizmo::GizmoTransformable;

use crate::Roko;

/// Add gizmo components to the entity with the ZST Roko marker struct
pub(crate) fn gizmo_system(
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
pub(crate) fn make_pickable(
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


/// When any mesh in the scene is selected, select Roko's gizmo
pub(crate) struct SelectRoot(Entity);

impl From<ListenedEvent<Click>> for SelectRoot {
    fn from(event: ListenedEvent<Click>) -> Self {
        SelectRoot(event.listener)
    }
}


/// When any mesh in the scene is selected, select Roko's gizmo
pub (crate) fn set_selection(mut events: EventReader<SelectRoot>, mut query: Query<(Entity, &mut PickSelection)> ) {
    for event in events.iter() {
        let (_entity, mut selection) = query.get_mut(event.0).unwrap();
        selection.is_selected = true;
    }
}

