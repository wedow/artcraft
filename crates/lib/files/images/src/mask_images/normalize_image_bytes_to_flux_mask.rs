use crate::error::ImagesError;
use image::{GenericImage, GenericImageView, ImageFormat, ImageReader, Rgba};
use std::io::Cursor;

pub struct PngBytes(pub Vec<u8>);

/// Normalize arbitrary image bytes to a PNG format image.
/// Make sure the bitmap is in the correct mask format.
pub fn normalize_image_bytes_to_flux_mask(
  arbitrary_image_bytes: &[u8],
) -> Result<PngBytes, ImagesError> {

  let reader = ImageReader::new(Cursor::new(arbitrary_image_bytes));

  let mut image = reader
      .with_guessed_format()? // NB: Can raise IoError.
      .decode()?;

  let (width, height) = image.dimensions();

  //let mut corrected_mask: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::new(width, height);

  // Iterate through each pixel
  for y in 0..height {
    for x in 0..width {
      let rgba_pixel = image.get_pixel(x, y);

      if rgba_pixel[3] == 0 {
        // Alpha pixel is transparent
        // Set to black. Mask ignore region.
        image.put_pixel(x, y, Rgba([0, 0, 0, 255]));
      } else {
        // Set to white. Mask interest region.
        image.put_pixel(x, y, Rgba([255, 255, 255, 255]));
      }

      /*match pixel.channels().get(4) {
        Some(0) => {
          // Alpha pixel is transparent
          // Set to black. Mask ignore region.
          pixel = Rgba([0, 0, 0, 255]);
        }
        _ => {
          // Set to white. Mask interest region.
          pixel = Rgba([255, 255, 255, 255]);
        },
      }

      let rgb_pixel = pixel.to_rgba(); // Convert to Rgba<u8>

      // Check if the pixel is pure black (R=0, G=0, B=0)
      if rgb_pixel[0] == 0 && rgb_pixel[1] == 0 && rgb_pixel[2] == 0 {
        // Set the pixel to white (R=255, G=255, B=255)
        corrected_mask.put_pixel(x, y, Rgba([255, 255, 255, 255]));
      } else {
        // Keep the original color for non-black pixels
        corrected_mask.put_pixel(x, y, rgb_pixel);
      }*/
    }
  }


  let mut output_bytes: Vec<u8> = Vec::new();
  image.write_to(&mut Cursor::new(&mut output_bytes), ImageFormat::Png)?;

  Ok(PngBytes(output_bytes))
}
