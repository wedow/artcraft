use std::{path::Path, collections::VecDeque};

use clap::Parser;
use log::info;
use ndarray::{Dim, IxDynImpl, Ix3};
use onnxruntime::{environment::Environment, LoggingLevel, GraphOptimizationLevel, tensor::OrtOwnedTensor, TypedArray};
use rand::Fill;
use rsworld::{dio, stonemask};
use rsworld_sys::DioOption;
use media::{decode::decode_audio_to_pcm_f32::decode_audio_to_pcm_f32, resample::{Resampler, copy_planar}};
use symphonia::core::audio::{SignalSpec, Channels};
use webrtc_vad::{Vad, SampleRate, VadMode};


#[derive(Parser, Debug)]
struct Args {
    /// Path to an onnx so-vits-svc 4.0 model
    model_path: String,
    /// Path to an onnx hubert model
    hubert_path: String,
    /// Path to the audio source (supports flac, ogg, mp3, wav, alac, aac)
    audio_input_path: String,
    /// Path to create for the audio output file (Mono WAV PCM F32 @ 44100 Hz)
    audio_output_path: String,
    /// For changing the pitch of the output
    pitch_multiplier: Option<f32>
}

fn main() {
    let args = Args::parse();
    so_vits_svc_pipeline(args.model_path, args.hubert_path, args.audio_input_path, args.audio_output_path, args.pitch_multiplier).unwrap();
}

fn so_vits_svc_pipeline<P>(model_path: P, hubert_path: P, audio_input_path: P, audio_output_path: P, pitch_multiplier: Option<f32>) -> Result<(), onnxruntime::error::OrtError>
    where P: AsRef<Path>
{
    let environment = Environment::builder()
    .with_log_level(LoggingLevel::Verbose)
    .build()?;


    let mut hubert =  environment
        .new_session_builder()?
        .with_optimization_level(GraphOptimizationLevel::All)?
        .with_model_from_file(hubert_path)?;


    let mut so_vits_svc = environment.new_session_builder()?
        .with_optimization_level(GraphOptimizationLevel::All)?
        .with_model_from_file(model_path)?;

    let (audio, spec) = decode_audio_to_pcm_f32(audio_input_path.as_ref()); 
    let spec = if spec.is_none() {
        panic!("Decoding error");
    } else {
        spec.unwrap()
    };
    
    let mut audio_441;
    if spec.rate != 44100 {
        let mut resampler = Resampler::new(spec, 44100, 88200);
        audio_441 = Vec::new();
        let mut planar = Vec::new();
        copy_planar(&audio, &mut planar, spec.channels.count());
        let chunk1 = resampler.resample(planar).unwrap();
        audio_441.extend_from_slice(chunk1);
        loop {
            if let Some(data) = resampler.flush() {
                audio_441.extend_from_slice(data);
            } else {
                break;
            }
        }
    } else {
        audio_441 = audio;
    }
    audio_441 = mix_n_channels(spec.channels.count(), &mut audio_441.into());

    let spec = SignalSpec::new(44100, Channels::FRONT_CENTRE);
    let mut resampler = Resampler::new(spec, 16000, 32000);
    let mut audio_16k = Vec::new();
    let chunk1 = resampler.resample(vec![audio_441.clone()]).unwrap();
    audio_16k.extend_from_slice(chunk1);
    loop {
        if let Some(data) = resampler.flush() {
            audio_16k.extend_from_slice(data);
        } else {
            break;
        }
    }


    let mut vad = Vad::new_with_rate_and_mode(SampleRate::Rate16kHz, VadMode::Aggressive);
    let vad_bools = compute_vad(&mut vad, &audio_16k);
    let audio16k_len = audio_16k.len();
    let tensor16k = vec![ndarray::arr1(&audio_16k).into_shape([1, 1, audio16k_len]).unwrap()];

    let hubert_output: Vec<OrtOwnedTensor<f32, Dim<IxDynImpl>>> = hubert.run(tensor16k)?;
    let hubert_shape = hubert_output[0].shape();
    println!("hubert_shape: {:?}", hubert_shape);
    let hubert_output = hubert_output[0].clone().into_owned().into_dimensionality::<Ix3>().unwrap();

    let double_audio441: Vec<f64> = audio_441.iter().map(|float| (*float).into()).collect();


    let (t, f0) = dio(&double_audio441, 44100, &DioOption { f0_floor: 50.0, f0_ceil:1100.0, channels_in_octave:2.0, frame_period: 1000.0*512.0/44100.0, speed: 1, allowed_range: 0.1});
    let f0_vec = stonemask(&double_audio441, 44100, &t, &f0);
    let f0_vec: Vec<f32> = f0_vec.iter().map(|d| *d as f32 * pitch_multiplier.unwrap_or(1.0)).collect();
    info!("Average F0: {}", f0_vec.iter().sum::<f32>() / f0_vec.len() as f32);
    let f0_len = f0_vec.len();
    info!("f0_len: {}", f0.len());

    let uv = ndarray::arr1(&f0_vec.clone().iter().map(|f0| if *f0 == 0.0 { 0.0 } else { 1.0 }).collect::<Vec<f32>>()).into_shape((1, f0_len)).unwrap().into_dyn();

    let pitch = ndarray::Array::from_shape_vec(Dim([1, f0_len]), f0_vec).unwrap().into_dyn();

    let hubert12 = hubert_output.into_shape([hubert_shape[1], hubert_shape[2]]).unwrap();
    let hubert_expanded = repeat_expand_2d(hubert12, f0_len);
    let hubert012 = hubert_expanded.into_shape([1, f0_len, hubert_shape[2]]).unwrap().into_dyn();

    let mel2ph = (0..f0_len as i64).into_iter().collect::<ndarray::Array1<i64>>().into_shape([1, f0_len]).unwrap().into_dyn();

    let mut rng = rand::thread_rng();
    let mut random = vec![0.0f32; f0_len*192];
    random.try_fill(&mut rng).unwrap();
    let noise = ndarray::Array::from_shape_vec([1, 192, f0_len], random).unwrap().into_dyn();

    let speaker = ndarray::arr1(&[0]).into_dyn();


    let svc_inputs = vec![TypedArray::F32(hubert012), TypedArray::F32(pitch), TypedArray::I64(mel2ph), TypedArray::F32(uv), TypedArray::F32(noise), TypedArray::I64(speaker)];

    let outputs = so_vits_svc.run_mixed::<f32, Dim<IxDynImpl>>(svc_inputs).unwrap();

     let f = std::fs::File::create(audio_output_path).unwrap();
     let spec = hound::WavSpec {
        channels: 1,
        sample_rate: 44100 as u32,
        bits_per_sample: 32,
        sample_format: hound::SampleFormat::Float,
    };


    let mut output_wav = outputs[0].as_slice().unwrap().to_vec();
    replace_inactivity_with_silence_rate(&vad_bools, &mut output_wav, 2.75625);

    let mut writer = hound::WavWriter::new(f, spec).unwrap();
    for sample in output_wav.iter() {
        writer.write_sample(*sample).unwrap();
    }
    writer.finalize().unwrap();


    Ok(())
}

// some kind of janky repeat/copy/interpolate function I stole from so_vits_svc_fork
// could probably be implemented cleaner
fn repeat_expand_2d(content: ndarray::Array2<f32>, target_len: usize) -> ndarray::Array2<f32> {
    let src_len =  content.shape()[0];
    let dim0 = content.shape()[1];
    let mut target = ndarray::Array::zeros((target_len, dim0));
    let temp = ndarray::Array1::linspace(0.0, (src_len+1) as f32, src_len+1);
    let temp = temp * (target_len as f64 / src_len as f64) as f32;
    let mut current_pos = 0;
    for i in 0..target_len {
        if (i as f32) < temp[current_pos + 1] {
            target.slice_mut(ndarray::s!(i, ..)).assign(&content.slice(ndarray::s!(current_pos, ..)));
        } else {
            current_pos += 1;
            target.slice_mut(ndarray::s!(i, ..)).assign(&content.slice(ndarray::s!(current_pos, ..)));
        }
    }
    target
}

pub fn mix_n_channels<'a>(n_channels: usize, input: &mut VecDeque<f32>) -> Vec<f32> {
    let mut output = Vec::new();
    for _ in  0..input.len() / n_channels {
        let mut mixed: f32 = 0.0;
        for _ in 0..n_channels {
            // not sure whether this reverses the input or not, take note!
            mixed += input.pop_front().unwrap_or(0.0);
        }
        output.push(mixed);
    }
    output
}

pub fn compute_vad<'a>(vad: &'a mut Vad, buf: &'a [f32]) -> Vec<bool> {
    let mut vad_bools = Vec::new();

    buf.chunks(VAD_SIZE).for_each(|vad_chunk| {
        vad_bools.push(
            vad.is_voice_segment(
                &vad_chunk.iter().map(|a: &f32| float_to_pcm_s16(*a)).collect::<Vec<i16>>()
            ).unwrap_or(false)
        )
    });
    vad_bools
}

pub fn replace_inactivity_with_silence_rate<'a>(vad_bools: &'a Vec<bool>, buf: &'a mut [f32], rate: f32) {
    for (i, chunk) in buf.chunks_mut((VAD_SIZE as f32 * rate) as usize).enumerate() {
        if i >= vad_bools.len() { break };
        for sample in chunk {
            if !vad_bools[i] {
                *sample = 0.0
            }
        }
    }
}

pub fn float_to_pcm_s16(float: f32) -> i16 {
    (float * 32768.0) as i16
}

const VAD_SIZE: usize = 160;
