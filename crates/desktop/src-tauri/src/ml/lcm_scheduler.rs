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
}

impl LcmScheduler {
  /*
        # Python __init__ CTOR args
        # (Other args removed for not being used)

        num_train_timesteps: int = 1000,
        beta_start: float = 0.00085,
        beta_end: float = 0.012,
        beta_schedule: str = "scaled_linear",
        trained_betas: Optional[Union[np.ndarray, List[float]]] = None,
        set_alpha_to_one: bool = True,
        rescale_betas_zero_snr: bool = False,
   */
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
        "linear" => {
          let t = linspace(beta_start, beta_end, num_train_timestamps as usize)?;
          t.to_device(device)?
        },
        "scaled_linear" => {
          // this schedule is very specific to the latent diffusion model.
          let t = linspace(beta_start.powf(0.5), beta_end.powf(0.5), num_train_timestamps as usize)?;
          t.to_device(device)?
        }
        "squaredcos_cap_v2" => {
          todo!("TODO: Need to implement squaredcos_cap_v2 beta schedule")
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
      todo!("TODO: implement rescale_betas_zero_snr")
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
      initialize_scalar_tensor(1.0, device)?
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

    /*
        ##### All instance variables: ####

        # Python

        [ ] self._begin_index
        [ ] self._step_index
        [x] self.alphas
        [x] self.alphas_cumprod
        [x] self.betas
        [ ] self.custom_timesteps
        [x] self.final_alpha_cumprod
        [ ] self.init_noise_sigma
        [ ] self.num_inference_steps
        [x] self.timesteps = None

        # Swift Implementation
        # https://github.com/GuernikaCore/Schedulers/blob/main/Sources/Schedulers/LCMScheduler.swift

        [ ] public let trainStepCount: Int
        [ ] public let inferenceStepCount: Int
        [x] public let betas: [Float]
        [x] public let alphas: [Float]
        [x] public let alphasCumProd: [Float]
        [x] public let finalAlphaCumProd: Float
        [x] public let timeSteps: [Double]
        [ ] public let predictionType: PredictionType
        [ ] public private(set) var modelOutputs: [MLShapedArray<Float32>] = []
     */

    Ok(Self {
      alphas,
      alphas_cumprod,
      final_alpha_cumprod,
      betas,
      init_noise_sigma,
      timesteps,
    })
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

  fn scale_model_input(&self, sample: Tensor, _timestep: usize) -> candle_core::Result<Tensor> {
    /*
        """
        Ensures interchangeability with schedulers that need to scale the denoising model input depending on the
        current timestep.

        Args:
            sample (`torch.Tensor`):
                The input sample.
            timestep (`int`, *optional*):
                The current timestep in the diffusion chain.
        Returns:
            `torch.Tensor`:
                A scaled input sample.
        """
        return sample
     */

    Ok(sample)
  }

  fn step(&mut self, model_output: &Tensor, timestep: usize, sample: &Tensor) -> candle_core::Result<Tensor> {
    /*
    # NB: This is from scheduling_lcm.py:

    def step(
        self,
        model_output: torch.Tensor,
        timestep: int,
        sample: torch.Tensor,
        generator: Optional[torch.Generator] = None,
        return_dict: bool = True,
    ) -> Union[LCMSchedulerOutput, Tuple]:
        """
        Predict the sample from the previous timestep by reversing the SDE. This function propagates the diffusion
        process from the learned model outputs (most often the predicted noise).

        Args:
            model_output (`torch.Tensor`):
                The direct output from learned diffusion model.
            timestep (`float`):
                The current discrete timestep in the diffusion chain.
            sample (`torch.Tensor`):
                A current instance of a sample created by the diffusion process.
            generator (`torch.Generator`, *optional*):
                A random number generator.
            return_dict (`bool`, *optional*, defaults to `True`):
                Whether or not to return a [`~schedulers.scheduling_lcm.LCMSchedulerOutput`] or `tuple`.
        Returns:
            [`~schedulers.scheduling_utils.LCMSchedulerOutput`] or `tuple`:
                If return_dict is `True`, [`~schedulers.scheduling_lcm.LCMSchedulerOutput`] is returned, otherwise a
                tuple is returned where the first element is the sample tensor.
        """
        if self.num_inference_steps is None:
            raise ValueError(
                "Number of inference steps is 'None', you need to run 'set_timesteps' after creating the scheduler"
            )

        if self.step_index is None:
            self._init_step_index(timestep)

        # 1. get previous step value
        prev_step_index = self.step_index + 1
        if prev_step_index < len(self.timesteps):
            prev_timestep = self.timesteps[prev_step_index]
        else:
            prev_timestep = timestep

        # 2. compute alphas, betas
        alpha_prod_t = self.alphas_cumprod[timestep]
        alpha_prod_t_prev = self.alphas_cumprod[prev_timestep] if prev_timestep >= 0 else self.final_alpha_cumprod

        beta_prod_t = 1 - alpha_prod_t
        beta_prod_t_prev = 1 - alpha_prod_t_prev

        # 3. Get scalings for boundary conditions
        c_skip, c_out = self.get_scalings_for_boundary_condition_discrete(timestep)

        # 4. Compute the predicted original sample x_0 based on the model parameterization
        if self.config.prediction_type == "epsilon":  # noise-prediction
            predicted_original_sample = (sample - beta_prod_t.sqrt() * model_output) / alpha_prod_t.sqrt()
        elif self.config.prediction_type == "sample":  # x-prediction
            predicted_original_sample = model_output
        elif self.config.prediction_type == "v_prediction":  # v-prediction
            predicted_original_sample = alpha_prod_t.sqrt() * sample - beta_prod_t.sqrt() * model_output
        else:
            raise ValueError(
                f"prediction_type given as {self.config.prediction_type} must be one of `epsilon`, `sample` or"
                " `v_prediction` for `LCMScheduler`."
            )

        # 5. Clip or threshold "predicted x_0"
        if self.config.thresholding:
            predicted_original_sample = self._threshold_sample(predicted_original_sample)
        elif self.config.clip_sample:
            predicted_original_sample = predicted_original_sample.clamp(
                -self.config.clip_sample_range, self.config.clip_sample_range
            )

        # 6. Denoise model output using boundary conditions
        denoised = c_out * predicted_original_sample + c_skip * sample

        # 7. Sample and inject noise z ~ N(0, I) for MultiStep Inference
        # Noise is not used on the final timestep of the timestep schedule.
        # This also means that noise is not used for one-step sampling.
        if self.step_index != self.num_inference_steps - 1:
            noise = randn_tensor(
                model_output.shape, generator=generator, device=model_output.device, dtype=denoised.dtype
            )
            prev_sample = alpha_prod_t_prev.sqrt() * denoised + beta_prod_t_prev.sqrt() * noise
        else:
            prev_sample = denoised

        # upon completion increase step index by one
        self._step_index += 1

        if not return_dict:
            return (prev_sample, denoised)

        return LCMSchedulerOutput(prev_sample=prev_sample, denoised=denoised)
     */
    todo!()
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

// The Candle sources, and moreover, the Candle tests, are a great source of information for how the library works.
//assert_eq!(t.i(..-1)?, 1.0);
#[cfg(test)]
mod tests {
  use crate::ml::lcm_scheduler::{initialize_scalar_tensor, initialize_timesteps};
  use crate::ml::lcm_scheduler::tests::helper_fn::*;
  use candle_core::Device;

  #[test]
  fn test_scalar_tensor() -> anyhow::Result<()> {
    let t = initialize_scalar_tensor(1.0, &Device::Cpu)?;
    let empty : [usize; 0] = [];
    assert_eq!(t.dims(), &empty);
    assert_eq!(t.to_vec0::<f64>()?, 1.0);
    Ok(())
  }

  #[test]
  fn test_implementation_of_reverse() -> anyhow::Result<()> {
    let tensor = initialize_timesteps(5, &Device::Cpu)?;
    assert_eq!(tensor.to_vec1::<i64>()?, &[4,3,2,1,0]);
    Ok(())
  }

  mod various_pytorch_behaviors {
    use candle_core::{Shape, Tensor};
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
  
  pub mod helper_fn {
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