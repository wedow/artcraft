use std::{fs::File, path::Path};

use symphonia::core::audio::{SampleBuffer, SignalSpec};
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::errors::Error;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

/// Takes a path to an audio file and returns floating point PCM data, number of channels, and sample rate
pub fn decode_audio_to_pcm_f32<P>(audio_path: P) -> (Vec<f32>, Option<SignalSpec>) 
    where P: AsRef<Path>
{
    let file = Box::new(File::open(audio_path.as_ref()).unwrap());

    let mss = MediaSourceStream::new(file, Default::default());

    // Create a hint to help the format registry guess what format reader is appropriate. In this
    // example we'll leave it empty.
    let hint = Hint::new();

    // Use the default options when reading and decoding.
    let format_opts: FormatOptions = Default::default();
    let metadata_opts: MetadataOptions = Default::default();
    let decoder_opts: DecoderOptions = Default::default();

    // Probe the media source stream for a format.
    let probed =
        symphonia::default::get_probe().format(&hint, mss, &format_opts, &metadata_opts).unwrap();

    // Get the format reader yielded by the probe operation.
    let mut format = probed.format;

    // Get the default track.
    let track = format.default_track().unwrap();

    // Create a decoder for the track.
    let mut decoder =
        symphonia::default::get_codecs().make(&track.codec_params, &decoder_opts).unwrap();

    // Store the track identifier, we'll use it to filter packets.
    let track_id = track.id;

    let mut sample_buf = None;

    let mut sample_vec: Vec<f32> = Vec::new();
    let mut sample_spec: Option<SignalSpec> = None;

    loop {
        // Get the next packet from the format reader.
        let packet = format.next_packet();
        let packet =  match packet {
            Ok(packet) => packet,
            Err(_) => { break; }
        };

        // If the packet does not belong to the selected track, skip it.
        if packet.track_id() != track_id {
            continue;
        }

        // Decode the packet into audio samples, ignoring any decode errors.
        match decoder.decode(&packet) {
            Ok(audio_buf) => {
                // The decoded audio samples may now be accessed via the audio buffer if per-channel
                // slices of samples in their native decoded format is desired. Use-cases where
                // the samples need to be accessed in an interleaved order or converted into
                // another sample format, or a byte buffer is required, are covered by copying the
                // audio buffer into a sample buffer or raw sample buffer, respectively. In the
                // example below, we will copy the audio buffer into a sample buffer in an
                // interleaved order while also converting to a f32 sample format.

                // If this is the *first* decoded packet, create a sample buffer matching the
                // decoded audio buffer format.
                if sample_buf.is_none() {
                    // Get the audio buffer specification.
                    sample_spec = Some(*audio_buf.spec());

                    // Get the capacity of the decoded buffer. Note: This is capacity, not length!
                    let duration = audio_buf.capacity() as u64;

                    // Create the f32 sample buffer.
                    sample_buf = Some(SampleBuffer::<f32>::new(duration, sample_spec.unwrap()));
                }

                // Copy the decoded audio buffer into the sample buffer in an interleaved format.
                if let Some(buf) = &mut sample_buf {
                    buf.copy_interleaved_ref(audio_buf);
                    sample_vec.extend_from_slice(buf.samples());
                }
            }
            Err(Error::DecodeError(_)) => (),
            Err(_) => break,
        }
    }
    (sample_vec, sample_spec)
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;
    use super::decode_audio_to_pcm_f32;

    fn test_file(path_from_repo_root: &str) -> PathBuf {
        // https://doc.rust-lang.org/cargo/reference/environment-variables.html
        let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        path.push(format!("../../../{}", path_from_repo_root));
        path
    }

    #[test]
    fn test_flac_decode() {
        let path = test_file("test_data/audio/flac/zelda_ocarina_small_item.flac");
        let (buf, spec) = decode_audio_to_pcm_f32(path);
        assert_eq!(buf.len(), 451584);
        assert_eq!(spec.unwrap().channels.count(), 2);
        assert_eq!(spec.unwrap().rate, 44100);
    }

    #[test]
    fn test_ogg_decode() {
        let path = test_file("test_data/audio/ogg/banjo-kazooie_jiggy_appearance.ogg");
        let (buf, spec) = decode_audio_to_pcm_f32(path);
        // disagrees with audacity but I guess ogg is just weird like that
        assert_eq!(buf.len(), 432512);
        assert_eq!(spec.unwrap().channels.count(), 2);
        assert_eq!(spec.unwrap().rate, 44100);
    }
}
