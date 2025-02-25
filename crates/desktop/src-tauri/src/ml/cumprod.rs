use candle_core::shape::Dim;
use candle_core::Tensor;

/// Tensor Cumulative Product
/// 
/// Candle doesn't implement cumprod, only cumsum.
/// This implementation is adapted from cumsum in candle-ext:
///  https://github.com/mokeyish/candle-ext/blob/main/tests/cumsum.rs
///
/// See Also: https://pytorch.org/docs/stable/generated/torch.cumprod.html
/// See Also: https://numpy.org/doc/stable/reference/generated/numpy.cumprod.html
/// See Also: https://github.com/huggingface/candle/issues/1646
///
pub fn cumprod<D: Dim>(input: &Tensor, dim: D) -> candle_core::Result<Tensor> {
  let dim = dim.to_index(input.shape(), "cumprod")?;
  let dim_size = input.dim(dim)?;
  let rank = input.rank();
  if rank == 0 {
    return Ok(input.clone());
  }

  let mut tensors = Vec::with_capacity(dim_size);

  let mut a = input.clone();
  for i in 0..dim_size {
    if i > 0 {
      a = a.narrow(dim, 1, dim_size - i)?;
      let b = input.narrow(dim, 0, dim_size - i)?;
      a = (a * b)?;
    }
    tensors.push(a.narrow(dim, 0, 1)?);
  }

  let cumsum = Tensor::cat(&tensors, dim)?;
  Ok(cumsum)
}

#[cfg(test)]
mod tests {
  use crate::ml::cumprod::cumprod;
  use candle_core::{Device, Tensor};

  mod base_cases {
    use super::*;

    #[test]
    fn zeroes_vector() -> anyhow::Result<()> {
      let a = Tensor::new(&[0i64, 0, 0, 0], &Device::Cpu)?;
      let b = cumprod(&a, 0)?;
      assert_eq!(b.to_vec1::<i64>()?, &[0, 0, 0, 0]);
      Ok(())
    }

    #[test]
    fn zeroes_tensor() -> anyhow::Result<()> {
      let a = Tensor::new(&[
        [0i64, 0, 0],
        [0i64, 0, 0],
        [0i64, 0, 0],
      ], &Device::Cpu)?;

      let b = cumprod(&a, 0)?;

      assert_eq!(b.to_vec2::<i64>()?, &[
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
      Ok(())
    }

    #[test]
    fn ones_vector() -> anyhow::Result<()> {
      let a = Tensor::new(&[1i64, 1, 1, 1], &Device::Cpu)?;
      let b = cumprod(&a, 0)?;
      assert_eq!(b.to_vec1::<i64>()?, &[1, 1, 1, 1]);
      Ok(())
    }

    #[test]
    fn ones_tensor() -> anyhow::Result<()> {
      let a = Tensor::new(&[
        [1i64, 1, 1],
        [1i64, 1, 1],
        [1i64, 1, 1],
      ], &Device::Cpu)?;

      let b = cumprod(&a, 0)?;

      assert_eq!(b.to_vec2::<i64>()?, &[
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ]);
      Ok(())
    }
  }

  mod test_cases {
    use super::*;

    #[test]
    fn vector() -> anyhow::Result<()> {
      let a = Tensor::new(&[1i64, 2, 3, 4, 5], &Device::Cpu)?;
      let b = cumprod(&a, 0)?;
      assert_eq!(b.to_vec1::<i64>()?, &[1, 2, 6, 24, 120]);

      let a = Tensor::new(&[0, 1i64, 2, 3, 4, 5], &Device::Cpu)?;
      let b = cumprod(&a, 0)?;
      assert_eq!(b.to_vec1::<i64>()?, &[0, 0, 0, 0, 0, 0]);
      Ok(())
    }

    #[test]
    fn tensor_dim_0() -> anyhow::Result<()> {
      let a = Tensor::new(&[
        [1i64, 2, 3],
        [4i64, 5, 6],
        [7i64, 8, 9],
      ], &Device::Cpu)?;

      let b = cumprod(&a, 0)?;

      assert_eq!(b.to_vec2::<i64>()?, &[
        [1, 2, 3],
        [4, 10, 18],
        [28, 80, 162],
      ]);
      Ok(())
    }

    #[test]
    fn tensor_dim_1() -> anyhow::Result<()> {
      let a = Tensor::new(&[
        [1i64, 2, 3],
        [4i64, 5, 6],
        [7i64, 8, 9],
      ], &Device::Cpu)?;

      let b = cumprod(&a, 1)?;

      assert_eq!(b.to_vec2::<i64>()?, &[
        [1, 2, 6],
        [4, 20, 120],
        [7, 56, 504],
      ]);
      Ok(())
    }
  }
}
