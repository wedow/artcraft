use anyhow::anyhow;
use candle_core::{Device, Shape, Tensor, WithDType};
use candle_transformers::models::stable_diffusion::schedulers::Scheduler;
use candle_transformers::models::stable_diffusion::utils::linspace;
use log::error;

/*
Notes on LCM implementation:

  - Robust technical comparison of samplers: https://stable-diffusion-art.com/samplers/
  - Apple Swift LCM Implementation ticket: https://github.com/apple/ml-stable-diffusion/issues/319
  - Reference Swift Implementation: https://github.com/GuernikaCore/Schedulers/blob/main/Sources/Schedulers/LCMScheduler.swift

Candle is missing several "batteries" we'll have to implement, and some we might want to upstream:

  - t[::-1] (syntax to reverse the tensor)

  - torch/numpy.cumprod :
      - https://numpy.org/doc/stable/reference/generated/numpy.cumprod.html
      - https://pytorch.org/docs/stable/generated/torch.cumprod.html

*/

struct LcmScheduler {
  //alphas: Vec<f64>,
  alphas: Tensor,
  //alphas_cumprod: Vec<f64>,
  alphas_cumprod: Tensor,
  //final_alpha_cumprod: f64,
  final_alpha_cumprod: Tensor,

  //betas: Vec<f64>,
  betas: Tensor,

  //timesteps: Vec<usize>,
  timesteps: Tensor,

  // Standard deviation of the initial noise distribution
  // NB: Only in diffusers, and seems to only hold the value "1.0". Swift implementation omits it.
  init_noise_sigma: f64,

  // TODO: This is set by the set_timesteps() method after construction in python.
  //  We might want to handle this upfront in the constructor ourselves
  num_inference_steps: Option<usize>,

  _step_index: Option<usize>,
  _begin_index: Option<usize>,
}

impl LcmScheduler {
  pub fn new(
    num_train_timestamps: i64,
    beta_start: f64,
    beta_end: f64,
    beta_schedule: &str,
    trained_betas: Option<Tensor>,
    set_alpha_to_one: bool,
    rescale_betas_zero_snr: bool,
    device: &Device,
  ) -> anyhow::Result<Self> {

    // if trained_betas is not None:
    //     self.betas = torch.tensor(trained_betas, dtype=torch.float32)
    // elif beta_schedule == "linear":
    //     self.betas = torch.linspace(beta_start, beta_end, num_train_timesteps, dtype=torch.float32)
    // elif beta_schedule == "scaled_linear":
    //     # this schedule is very specific to the latent diffusion model.
    //     self.betas = torch.linspace(beta_start**0.5, beta_end**0.5, num_train_timesteps, dtype=torch.float32) ** 2
    // elif beta_schedule == "squaredcos_cap_v2":
    //     # Glide cosine schedule
    //     self.betas = betas_for_alpha_bar(num_train_timesteps)
    // else:
    //     raise NotImplementedError(f"{beta_schedule} is not implemented for {self.__class__}")

    let mut betas;

    if let Some(trained) = trained_betas {
      betas = trained;
    } else {
      betas = match beta_schedule {
        "scaled_linear" => {
          // this schedule is very specific to the latent diffusion model.
          let t = linspace(
            beta_start.powf(0.5),
            beta_end.powf(0.5),
            num_train_timestamps as usize
          )?;
          t.to_device(device)?
        }
        "linear" => {
          //let t = linspace(beta_start, beta_end, num_train_timestamps as usize)?;
          //t.to_device(device)?
          return Err(anyhow!("linear is not used upstream"));
        },
        "squaredcos_cap_v2" => {
          return Err(anyhow!("squaredcos_cap_v2 is not used upstream"));
        }
        _ => {
          return Err(anyhow!("schedule {beta_schedule} is not implemented"))
        }
      };
    }

     // # Rescale for zero SNR
     // if rescale_betas_zero_snr:
     //     self.betas = rescale_zero_terminal_snr(self.betas)

    if rescale_betas_zero_snr {
      return Err(anyhow!("rescale_betas_zero_snr is not used upstream"));
    }

    // self.alphas = 1.0 - self.betas
    let alphas = (1.0 - &betas)?;

    // self.alphas_cumprod = torch.cumprod(self.alphas, dim=0)

    // TODO: Implement cumprod: https://github.com/huggingface/candle/issues/1646
    //  https://numpy.org/doc/stable/reference/generated/numpy.cumprod.html
    error!("THIS IS USING CUMSUM, NOT CUMPROD. WE NEED TO IMPLEMENT CUMPROD.");
    let alphas_cumprod = alphas.cumsum(0)?;

    // # At every step in ddim, we are looking into the previous alphas_cumprod
    // # For the final step, there is no previous alphas_cumprod because we are already at 0
    // # `set_alpha_to_one` decides whether we set this parameter simply to one or
    // # whether we use the final alpha of the "non-previous" one.
    // self.final_alpha_cumprod = torch.tensor(1.0) if set_alpha_to_one else self.alphas_cumprod[0]

    // TODO: Check implementation
    let final_alpha_cumprod = if set_alpha_to_one {
      initialize_scalar_tensor(1.0, device)? // NB: `set_alpha_to_one` is false in python
    } else {
      alphas_cumprod.get(0)?
    };

    // # standard deviation of the initial noise distribution
    // self.init_noise_sigma = 1.0
    let init_noise_sigma = 1.0;


    // # setable values
    // self.num_inference_steps = None
    // self.custom_timesteps = False
    //
    // self._step_index = None
    // self._begin_index = None

    // NB: This is generating a range and reversing it.
    // self.timesteps = torch.from_numpy(np.arange(0, num_train_timesteps)[::-1].copy().astype(np.int64))

    let timesteps = initialize_timesteps(num_train_timestamps, device)?;

    Ok(Self {
      alphas,
      alphas_cumprod,
      final_alpha_cumprod,
      betas,
      init_noise_sigma,
      timesteps,
      num_inference_steps: None,
      _step_index: None,
      _begin_index: None,
    })
  }

  pub fn set_begin_index(&mut self, begin_index: usize) {
    self._begin_index = Some(begin_index);
  }

  pub fn init_step_index(&mut self, timestep: usize) -> candle_core::Result<()> {
    match self._begin_index {
      None => {
        todo!("implement begin index none branch")
      }
      Some(begin_index) => {
        self._step_index = Some(begin_index);
      }
    }
    Ok(())
  }

}

impl Scheduler for LcmScheduler {
  fn timesteps(&self) -> &[usize] {
    // TODO: We can't use the implementation from DDIM. This method requires
    //  (1) an infallible response and (2) a reference we can't dynamically allocate. We must
    //  cache this somewhere.
    &[]
  }

  fn add_noise(&self, original_samples: &Tensor, noise: Tensor, timestep: usize) -> candle_core::Result<Tensor> {
    /*
    # NB: This is from scheduling_lcm.py:

    # Copied from diffusers.schedulers.scheduling_ddpm.DDPMScheduler.add_noise
    def add_noise(
        self,
        original_samples: torch.Tensor,
        noise: torch.Tensor,
        timesteps: torch.IntTensor,
    ) -> torch.Tensor:
        # Make sure alphas_cumprod and timestep have same device and dtype as original_samples
        # Move the self.alphas_cumprod to device to avoid redundant CPU to GPU data movement
        # for the subsequent add_noise calls
        self.alphas_cumprod = self.alphas_cumprod.to(device=original_samples.device)
        alphas_cumprod = self.alphas_cumprod.to(dtype=original_samples.dtype)
        timesteps = timesteps.to(original_samples.device)

        sqrt_alpha_prod = alphas_cumprod[timesteps] ** 0.5
        sqrt_alpha_prod = sqrt_alpha_prod.flatten()
        while len(sqrt_alpha_prod.shape) < len(original_samples.shape):
            sqrt_alpha_prod = sqrt_alpha_prod.unsqueeze(-1)

        sqrt_one_minus_alpha_prod = (1 - alphas_cumprod[timesteps]) ** 0.5
        sqrt_one_minus_alpha_prod = sqrt_one_minus_alpha_prod.flatten()
        while len(sqrt_one_minus_alpha_prod.shape) < len(original_samples.shape):
            sqrt_one_minus_alpha_prod = sqrt_one_minus_alpha_prod.unsqueeze(-1)

        noisy_samples = sqrt_alpha_prod * original_samples + sqrt_one_minus_alpha_prod * noise
        return noisy_samples
     */
     // TODO: Type errors
      // (original_samples * self.alphas_cumprod[timestep].sqrt())?
      // + noise * (1. - self.alphas_cumprod[timestep]).sqrt()

    // TODO: Make sure alphas_cumprod and timestep have same device and dtype as original_samples
    //  Move the self.alphas_cumprod to device to avoid redundant CPU to GPU data movement
    //  for the subsequent add_noise calls
    let mut alphas_cumprod = self.alphas_cumprod.to_device(original_samples.device())?;
    alphas_cumprod = alphas_cumprod.to_dtype(original_samples.dtype())?;
    //let timesteps = timesteps.to_device(original_samples.device())?;

    let sqrt_alpha_prod = alphas_cumprod.get(timestep)?.powf(0.5)?;
    let mut sqrt_alpha_prod = sqrt_alpha_prod.flatten_all()?; // TODO: Verify that flatten_all works here


    while sqrt_alpha_prod.dims().len() < original_samples.dims().len() {
      // TODO: Verify that this works for `unsqueeze(-1)`
      sqrt_alpha_prod = sqrt_alpha_prod.unsqueeze(sqrt_alpha_prod.dims().len())?;
    }

    let sqrt_one_minus_alpha_prod = (1.0 - alphas_cumprod.get(timestep)?)?.powf(0.5)?;
    let mut sqrt_one_minus_alpha_prod = sqrt_one_minus_alpha_prod.flatten_all()?; // TODO: Verify flatten all works here.

    while sqrt_one_minus_alpha_prod.dims().len() < original_samples.dims().len() {
      // TODO: Verify that this works for `unsqueeze(-1)`
      sqrt_one_minus_alpha_prod = sqrt_one_minus_alpha_prod.unsqueeze(sqrt_one_minus_alpha_prod.dims().len())?;
    }

    let noisy_samples = ((sqrt_alpha_prod * original_samples)? + (sqrt_one_minus_alpha_prod * noise)?)?;

    Ok(noisy_samples)
  }

  fn init_noise_sigma(&self) -> f64 {
    self.init_noise_sigma
  }

  /// Ensures interchangeability with schedulers that need to scale the denoising model input
  /// depending on the current timestep. (For LCM, this is a pass through no-op!)
  fn scale_model_input(&self, sample: Tensor, _timestep: usize) -> candle_core::Result<Tensor> {
    Ok(sample) // NB: The diffusers scheduling_lcm.py implementation is a pass through no-op !
  }

  /// Predict the sample from the previous timestep by reversing the SDE. This function
  /// propagates the diffusion process from the learned model outputs (most often the
  /// predicted noise).
  fn step(&mut self, model_output: &Tensor, timestep: usize, sample: &Tensor) -> candle_core::Result<Tensor> {

    if self.num_inference_steps.is_none() {
      return Err(candle_core::Error::Msg(
        "Number of inference steps is 'None', you need to run 'set_timesteps' after creating the scheduler"
          .to_string()));
    }

    if self._step_index.is_none() {
      self.init_step_index(timestep)?;
    }

    let step_index = self._step_index.clone().expect("unsafe unwrap; should exist per above");

    // 1. Get previous step value
    let prev_step_index = step_index + 1;
    let prev_timestep;

    if prev_step_index < self.timesteps.elem_count() {
      prev_timestep = self.timesteps.get(timestep)?.to_scalar::<i64>()? as usize;
    } else {
      prev_timestep = timestep;
    }

    // 2. Compute alphas, betas
    let alpha_prod_t = self.alphas_cumprod.get(timestep)?;
    let alpha_prod_t_prev = if prev_timestep >= 0 {
      self.alphas_cumprod.get(prev_timestep)?
    } else {
      self.final_alpha_cumprod.clone()
    };

    let beta_prod_t = (1. - &alpha_prod_t)?;
    let beta_prod_t_prev = (1. - &alpha_prod_t_prev)?;

    // 3. Get scaling for boundary conditions
    // NB: timestep_scaling seems to be always set to 10.0 in diffusers examples, but it is passed
    // via a config object. Hardcoding this for now until we need to change it.
    const TIMESTEP_SCALING : f64 = 10.0;
    let (c_skip, c_out) = get_scalings_for_boundary_condition_discrete(timestep, TIMESTEP_SCALING);
    
    // 4. Compute the predicted original sample x_0 based on the model parameterization
    // NB: Prediction type is "epsilon" in the diffusers examples, but that is configurable.
    // This is the only one we'll implement for now.
    let predicted_original_sample = ((sample - (beta_prod_t.sqrt()? * model_output)?)? / &alpha_prod_t.sqrt()?)?;
    
    // 5. (skip clip/threshold - not used in diffusers example)
    
    // 6. Denoise model output using boundary conditions
    let denoised = ((c_out * predicted_original_sample)? + (c_skip * sample)?)?;
    
    // TODO: Step 7. We have to return the previous example somehow.
    //  Diffusers tolerates it not being sent back, but the quality degrades as if one step is absent.
    Ok(denoised)
  }
}

fn initialize_scalar_tensor<D: WithDType>(value: D, device: &Device) -> anyhow::Result<Tensor> {
  let scalar = Tensor::from_vec(vec![value], Shape::from(vec![]), device)?;
  Ok(scalar)
}

// TODO(bt,2025-02-23): Use native implementations
fn initialize_timesteps(num_train_timesteps: i64, device: &Device) -> anyhow::Result<Tensor> {
  // Testing LCM scheduler assumptions:
  // [::-1] is shorthand for reversing a numpy vector, eg. [0, 1,2,3,4] -> [4, 3, 2, 1, 0]
  // self.timesteps = torch.from_numpy(np.arange(0, num_train_timesteps)[::-1].copy().astype(np.int64))
  //let tensor = Tensor::arange::<i64>(0, 5, &Device::Cpu)?; // This works, but we can't reverse/flip it!

  // https://github.com/tracel-ai/burn/pull/1468 flip impl? Will this work in place?
  // https://github.com/huggingface/candle/issues/1875

  let data = (0..num_train_timesteps)
    .map(i64::from)
    .rev()
    .collect();

  let shape = Shape::from_dims(&[num_train_timesteps as usize]);

  let tensor = Tensor::from_vec(data, shape, device)?;

  Ok(tensor)
}

fn get_scalings_for_boundary_condition_discrete(timestep: usize, timestep_scaling: f64) -> (f64, f64) {
  let sigma_data = 0.5f64; // Default 0.5
  let scaled_timestep = timestep as f64 * timestep_scaling;

  let c_skip = sigma_data.powf(2.0) / (scaled_timestep.powf(2.0) + sigma_data.powf(2.0));
  let c_out = scaled_timestep / (scaled_timestep.powf(2.0) + sigma_data.powf(2.0)).powf(0.5);

  (c_skip, c_out)
}

// The Candle sources, and moreover, the Candle tests, are a great source of information for how the library works.
//assert_eq!(t.i(..-1)?, 1.0);
#[cfg(test)]
mod tests {
  use crate::ml::lcm_scheduler::{initialize_scalar_tensor, initialize_timesteps};
  use crate::ml::lcm_scheduler::tests::test_helper_fn::*;
  use candle_core::Device;

  mod helper_function_unit_tests {
    use crate::ml::lcm_scheduler::get_scalings_for_boundary_condition_discrete;
    use super::*;

    #[test]
    fn test_initialize_scalar_tensor() -> anyhow::Result<()> {
      let t = initialize_scalar_tensor(1.0, &Device::Cpu)?;
      let empty: [usize; 0] = [];
      assert_eq!(t.dims(), &empty);
      assert_eq!(t.to_vec0::<f64>()?, 1.0);
      Ok(())
    }

    #[test]
    fn test_initialize_timesteps() -> anyhow::Result<()> {
      let tensor = initialize_timesteps(5, &Device::Cpu)?;
      assert_eq!(tensor.to_vec1::<i64>()?, &[4, 3, 2, 1,0]);
      Ok(())
    }

    #[test]
    fn test_get_scalings_for_boundary_condition_discrete() -> anyhow::Result<()> {
      // Base cases
      let v = get_scalings_for_boundary_condition_discrete(0, 0.0);
      assert_eq!(v, (1.0, 0.0));
      let v = get_scalings_for_boundary_condition_discrete(1, 0.0);
      assert_eq!(v, (1.0, 0.0));
      let v = get_scalings_for_boundary_condition_discrete(0, 1.0);
      assert_eq!(v, (1.0, 0.0));

      // Production code has "timestep_scaling" = 10.0
      let v = get_scalings_for_boundary_condition_discrete(0, 10.0);
      assert_eq!(v, (1.0, 0.0));

      // Production code has "timestep_scaling" = 10.0
      let v = get_scalings_for_boundary_condition_discrete(1, 10.0);
      assert!((v.0 - 0.0024937655860349127).abs() < 0.01);
      assert!((v.1 - 0.9987523388778445).abs() < 0.01);

      // TODO: More test cases - 
      //let v = get_scalings_for_boundary_condition_discrete(10, 10.0);
      //let v = get_scalings_for_boundary_condition_discrete(100, 10.0);

      Ok(())
    }
  }

  mod confirm_various_pytorch_behaviors {
    use super::*;

    // NB: Non-unit tests, just to test understanding while porting code

    #[test]
    fn unsqueeze_zero() -> anyhow::Result<()> {
      let t = tensor_1234()?;
      let x = t.unsqueeze(0)?;
      assert_eq!(x.to_vec2::<i64>()?, &[&[1, 2, 3, 4]]);
      Ok(())
    }

    #[test]
    fn unsqueeze_simulating_negative_one() -> anyhow::Result<()> {
      let t = tensor_1234()?;
      // NB: It looks like this matches the behavior of unsqueeze(-1)
      // Per: https://pytorch.org/docs/stable/generated/torch.unsqueeze.html
      let x = t.unsqueeze(t.dims().len())?;
      assert_eq!(x.to_vec2::<i64>()?, &[&[1],&[2],&[3],&[4]]);
      Ok(())
    }

    #[test]
    fn one_minus_vector() -> anyhow::Result<()> {
      let t = tensor_01234()?;
      let x = (1. - t)?;
      assert_eq!(x.rank(), 1); // NB: 1-dimensional output
      assert_eq!(x.to_vec1::<i64>()?, &[1, 0, -1, -2, -3]);
      Ok(())
    }
  }

  pub mod test_helper_fn {
    use candle_core::{Device, Shape, Tensor};

    pub fn tensor_1234() -> anyhow::Result<Tensor> {
      // Return an example tensor
      let data: Vec<i64> = vec![1, 2, 3, 4];
      let t = Tensor::from_vec(data, Shape::from(vec![4]), &Device::Cpu)?;
      assert_eq!(t.to_vec1::<i64>()?, &[1, 2, 3, 4]);
      Ok(t)
    }

    pub fn tensor_01234() -> anyhow::Result<Tensor> {
      // Return an example tensor
      let data: Vec<i64> = vec![0, 1, 2, 3, 4];
      let t = Tensor::from_vec(data, Shape::from(vec![5]), &Device::Cpu)?;
      assert_eq!(t.to_vec1::<i64>()?, &[0, 1, 2, 3, 4]);
      Ok(t)
    }
  }
}