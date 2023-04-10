// Symphonia
// Copyright (c) 2019-2022 The Project Symphonia Developers.
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

use symphonia::core::audio::{ SignalSpec};
use symphonia::core::conv::{FromSample, IntoSample};
use symphonia::core::sample::Sample;

pub struct Resampler<T> {
    resampler: rubato::FftFixedIn<f32>,
    input: Vec<Vec<f32>>,
    output: Vec<Vec<f32>>,
    interleaved: Vec<T>,
    chunk_size: usize,
}

impl<T> Resampler<T>
where
    T: Sample + FromSample<f32> + IntoSample<f32>,
{
    fn resample_inner(&mut self) -> &[T] {
        {
            let mut input: arrayvec::ArrayVec<&[f32], 32> = Default::default();

            for channel in self.input.iter() {
                input.push(&channel[..self.chunk_size]);
            }

            // Resample.
            rubato::Resampler::process_into_buffer(
                &mut self.resampler,
                &input,
                &mut self.output,
                None,
            )
            .unwrap();
        }

        // Remove consumed samples from the input buffer.
        for channel in self.input.iter_mut() {
            channel.drain(0..self.chunk_size);
        }

        // Interleave the planar samples from Rubato.
        let num_channels = self.output.len();
        self.interleaved.resize(num_channels * self.output[0].len(), T::MID);

        for (i, frame) in self.interleaved.chunks_exact_mut(num_channels).enumerate() {
            for (ch, s) in frame.iter_mut().enumerate() {
                *s = self.output[ch][i].into_sample();
            }
        }

        &self.interleaved
    }


    /// Resamples a planar/non-interleaved input.
    ///
    /// Returns the resampled samples in an interleaved format.
    pub fn resample(&mut self, input: Vec<Vec<f32>>) -> Option<&[T]> 
    where
    {
        // Copy samples into input buffer.
        self.input = input.clone();

        // Check if more samples are required.
        if self.input[0].len() < self.chunk_size {
            return None;
        }

        Some(self.resample_inner())
    }


    /// Resample any remaining samples in the resample buffer.
    pub fn flush(&mut self) -> Option<&[T]> {
        let len = self.input[0].len();

        if len == 0 {
            return None;
        }

        let partial_len = len % self.chunk_size;

        if partial_len != 0 {
            //Fill each input channel buffer with silence to the next multiple of the resampler
            //duration.
            for channel in self.input.iter_mut() {
                channel.resize(len + (self.chunk_size- partial_len), f32::MID);
            }
        }

        Some(self.resample_inner())
    }
}

impl<T> Resampler<T>
where
    T: Sample + FromSample<f32> + IntoSample<f32>,
{
    pub fn new(spec: SignalSpec, to_sample_rate: usize, chunk_size: usize) -> Self {
        let num_channels = spec.channels.count();

        let resampler = rubato::FftFixedIn::<f32>::new(
            spec.rate as usize,
            to_sample_rate,
            chunk_size,
            2,
            num_channels,
        )
        .unwrap();

        let output = rubato::Resampler::output_buffer_allocate(&resampler);

        let input = vec![Vec::with_capacity(chunk_size); num_channels];

        Self { resampler, input, output, chunk_size, interleaved: Default::default() }
    }
}

pub fn copy_planar(src: &[f32], dest: &mut Vec<Vec<f32>>, n_channels: usize) {
    let n_samples = src.len();
    let n_frames = n_samples / n_channels;

    dest.resize(n_channels, Vec::new());
    for k in 0..n_channels {
        dest[k].resize(n_frames, 0.0);
    };

    let mut src_pos = 0;
    for j in 0..n_frames {
        for i in 0..n_channels {
            dest[i][j] = src[src_pos];
            src_pos += 1;
        }
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::super::decode::decode_audio_to_pcm_f32::decode_audio_to_pcm_f32;
    use super::Resampler;
    use super::copy_planar;

    fn test_file(path_from_repo_root: &str) -> PathBuf {
        // https://doc.rust-lang.org/cargo/reference/environment-variables.html
        let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        path.push(format!("../../../{}", path_from_repo_root));
        path
    }

    #[test]
    fn test_flac_resample_16k() {
        let path = test_file("test_data/audio/flac/zelda_ocarina_small_item.flac");
        let (buf, spec) = decode_audio_to_pcm_f32(path);
        assert_eq!(buf.len(), 451584);
        let spec = spec.unwrap();
        let chunk_size = 96000;
        let mut resampler: Resampler<f32> = Resampler::new(spec, 16000, chunk_size);
        let mut planar_buf = Vec::new();
        copy_planar(&buf, &mut planar_buf, 2); 
        let resampled = {resampler.resample(planar_buf).unwrap()};
        let mut output = resampled.to_vec();
        loop {
            let new_chunk = resampler.flush();
            if new_chunk.is_none() {
                break; 
            }
            else {
                output.extend_from_slice(new_chunk.unwrap());
            }
        }
        // should be slightly larger than this due to padding
        assert!(output.len() > 163840);
        // but less than a whole new chunk
        assert!(output.len() < 163840 + (96000 / (44100 / 16000)))
    }

}
