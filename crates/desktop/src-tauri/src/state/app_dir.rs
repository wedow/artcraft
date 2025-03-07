use crate::state::os_platform::OsPlatform;
use expanduser::expanduser;
use std::path::{Path, PathBuf};
use crate::ml::model_type::ModelType;

const ASSETS_SUBDIRECTORY : &str = "assets";
const WEIGHTS_SUBDIRECTORY : &str = "weights";

/// The path to the application data directory, which includes "asset" and "weights" data.
#[derive(Clone)]
pub struct AppDataRoot {
  path: PathBuf,
  assets_dir: AppAssetsDir,
  weights_dir: AppWeightsDir,
}

#[derive(Clone)]
pub struct AppAssetsDir {
  path: PathBuf,
}

#[derive(Clone)]
pub struct AppWeightsDir {
  path: PathBuf,
}

impl AppDataRoot {
  pub fn create_existing<P: AsRef<Path>>(dir: P) -> anyhow::Result<Self> {
    let mut dir = dir.as_ref().to_path_buf();
    
    match OsPlatform::get() {
      OsPlatform::Linux | OsPlatform::MacOs => {
        if let Some(d) = dir.as_os_str().to_str() {
          dir = expanduser(d)?;
        }
      },
      OsPlatform::Windows => {}
    }
    
    if !dir.is_dir() {
      println!("Creating directory {:?}", dir);
      std::fs::create_dir_all(&dir)?;
    }

    match dir.canonicalize() {
      Ok(d) => dir = d,
      Err(err) => {
        println!("Error canonicalizing {:?}: {}", dir, err);
      }
    }
    
    let assets_dir = AppAssetsDir::create_existing(dir.join(ASSETS_SUBDIRECTORY))?;
    let weights_dir = AppWeightsDir::create_existing(dir.join(WEIGHTS_SUBDIRECTORY))?;
    
    Ok(Self {
      path: dir,
      assets_dir,
      weights_dir,
    })
  }
  
  pub fn assets_dir(&self) -> &AppAssetsDir {
    &self.assets_dir
  }
  
  pub fn weights_dir(&self) -> &AppWeightsDir {
    &self.weights_dir
  }
  
  pub fn path(&self) -> &Path {
    &self.path
  }
}

impl AppAssetsDir {
  pub fn create_existing<P: AsRef<Path>>(dir: P) -> anyhow::Result<Self> {
    let mut dir = dir.as_ref().to_path_buf();
    match dir.canonicalize() {
      Ok(d) => dir = d,
      Err(err) => {
        println!("Error canonicalizing {:?}: {}", dir, err);
      }
    }
    if !dir.exists() {
      println!("Creating directory {:?}", dir);
      std::fs::create_dir(&dir)?;
    }
    Ok(Self {
      path: dir,
    })
  }

  pub fn path(&self) -> &Path {
    &self.path
  }
}

impl AppWeightsDir {
  pub fn create_existing<P: AsRef<Path>>(dir: P) -> anyhow::Result<Self> {
    let mut dir = dir.as_ref().to_path_buf();
    match dir.canonicalize() {
      Ok(d) => dir = d,
      Err(err) => {
        println!("Error canonicalizing {:?}: {}", dir, err);
      }
    }
    if !dir.exists() {
      println!("Creating directory {:?}", dir);
      std::fs::create_dir(&dir)?;
    }
    Ok(Self {
      path: dir,
    })
  }

  pub fn path(&self) -> &Path {
    &self.path
  }
  
  pub fn model_path(&self, model_registry: &ModelType) -> PathBuf {
    self.path.join(model_registry.get_filename())
  }
}
