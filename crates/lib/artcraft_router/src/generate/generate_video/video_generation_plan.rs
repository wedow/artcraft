use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;

pub enum VideoGenerationPlan<'a> {
  ArtcraftSeedance2p0(PlanArtcraftSeedance2p0<'a>),
}
