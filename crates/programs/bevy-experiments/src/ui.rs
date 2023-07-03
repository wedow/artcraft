use bevy::prelude::*;
use bevy_egui::{egui, EguiContexts};
use crate::camera::SnapToRenderCam;

pub(crate) fn ui_system(mut ev: EventWriter::<SnapToRenderCam>, mut contexts: EguiContexts) {
        egui::Area::new("")
        .fixed_pos(egui::pos2(5.0, 5.0))
        .show(contexts.ctx_mut(), |ui| {
            if ui.button("Snap To Render Camera").clicked() {
                ev.send(SnapToRenderCam);
            }
        }
    );
}

