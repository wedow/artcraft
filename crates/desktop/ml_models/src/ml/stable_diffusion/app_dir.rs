use crate::ml::weights_registry::weight_descriptor::WeightDescriptor;
use anyhow::anyhow;
use directories::UserDirs;
use once_cell::sync::Lazy;
use std::io;
use std::path::{Path, PathBuf, MAIN_SEPARATOR};
use tempdir::TempDir;
use tempfile::{Builder, NamedTempFile};

static PREFIX: Lazy<String> = Lazy::new(|| format!("~{}", MAIN_SEPARATOR));

const DEFAULT_DATA_DIR : &str = "artcraft";
const ASSETS_SUBDIRECTORY : &str = "assets";
const WEIGHTS_SUBDIRECTORY : &str = "weights";

const TEMPORARY_SUBDIRECTORY : &str = "temp";

/// The path to the application data directory, which includes "asset" and "weights" data.
#[derive(Clone)]
pub struct AppDataRoot {
  path: PathBuf,
  assets_dir: AppAssetsDir,
  weights_dir: AppWeightsDir,
  temp_dir: TemporaryDir,
}

#[derive(Clone)]
pub struct AppAssetsDir {
  path: PathBuf,
}

#[derive(Clone)]
pub struct AppWeightsDir {
  path: PathBuf,
}

#[derive(Clone)]
pub struct TemporaryDir {
  path: PathBuf,
}

impl AppDataRoot {
  pub fn create_default() -> anyhow::Result<Self> {
    let directory = get_default_data_dir()?;
    Self::create_existing(directory)
  }

  pub fn create_existing<P: AsRef<Path>>(dir: P) -> anyhow::Result<Self> {
    let mut dir = dir.as_ref().to_path_buf();

    dir = expanduser(dir.to_str().map(|s| s.to_string()).unwrap())?;
    
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
    let temp_dir = TemporaryDir::create_existing(dir.join(TEMPORARY_SUBDIRECTORY))?;

    Ok(Self {
      path: dir,
      assets_dir,
      weights_dir,
      temp_dir,
    })
  }
  
  pub fn assets_dir(&self) -> &AppAssetsDir {
    &self.assets_dir
  }
  
  pub fn weights_dir(&self) -> &AppWeightsDir {
    &self.weights_dir
  }

  pub fn temp_dir(&self) -> &TemporaryDir {
    &self.temp_dir
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

  pub fn weight_path(&self, descriptor: &WeightDescriptor) -> PathBuf {
    self.path.join(descriptor.filename)
  }
}

impl TemporaryDir {
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

  pub fn with_prefix(&self, prefix: &str) -> anyhow::Result<TempDir> {
    let tempdir = TempDir::new_in(&self.path, prefix)?;
    Ok(tempdir)
  }

  pub fn new_named_temp_file(&self) -> anyhow::Result<NamedTempFile> {
    let tempfile = Builder::new()
      .prefix("temp_")
      .suffix(".bin")
      .tempfile_in(&self.path)?;
    Ok(tempfile)
  }
}

// eg. /home/bob/artcraft, /Users/bob/artcraft, or C:\Users\Alice\artcraft
fn get_default_data_dir() -> anyhow::Result<PathBuf> {
  Ok(UserDirs::new()
      .ok_or_else(|| anyhow!("could not determine user home directory"))?
      .home_dir()
      .join(DEFAULT_DATA_DIR))
}


/// The "expanduser" crate doesn't compile on Windows, so we replace its functionality slightly
pub fn expanduser<P: AsRef<str>>(path: P) -> io::Result<PathBuf> {

  Ok(match path.as_ref() {
    // matches an exact "~"
    s if s == "~" => {
      home_dir()?
    },
    // matches paths that start with `~/`
    s if s.starts_with(&*PREFIX) => {
      let home = home_dir()?;
      home.join(&s[2..])
    },
    // // matches paths that start with `~` but not `~/`, might be a `~username/` path
    // s if s.starts_with("~") => {
    //     let mut parts = s[1..].splitn(2, MAIN_SEPARATOR);
    //     let user = parts.next()
    //         .ok_or_else(|| io::Error::new(io::ErrorKind::Other, "malformed path"))?;
    //     let user = Passwd::from_name(&user)
    //         .map_err(|_| io::Error::new(io::ErrorKind::Other, "error searching for user"))?
    //         .ok_or_else(|| io::Error::new(io::ErrorKind::Other, format!("user '{}', does not exist", &user)))?;
    //     if let Some(ref path) = parts.next() {
    //         PathBuf::from(user.dir).join(&path)
    //     } else {
    //         PathBuf::from(user.dir)
    //     }
    // },
    // nothing to expand, just make a PathBuf
    s => PathBuf::from(s)
  })
}

pub fn home_dir() -> io::Result<PathBuf> {
  dirs::home_dir()
    .ok_or_else(|| io::Error::new(io::ErrorKind::Other, "no home directory is set"))
}
