use iced::{executor, Application, Command, Element, Settings, Column};
use iced::widget::{Slider, slider, Button, button, Text};
use cpal::{SampleRate, BufferSize};

pub fn main() -> iced::Result {
    App::run(Settings::default())
}

struct App {
    slider_1_state: slider::State,
    slider_1_value: f32,
    slider_2_state: slider::State,
    slider_2_value: f32,
    record_state: button::State,
    recording: bool,
    record_sender: Option<std::sync::mpsc::Sender<bool>>,
    //record_receiver: std::sync::mpsc::Receiver<bool>,
}


#[derive(Clone, Debug)]
pub enum Message {
    Slider1Changed(f32),
    Slider2Changed(f32),
    RecordPressed,
}

impl Application for App {
    type Executor = executor::Default;


    type Message = crate::Message;
    type Flags = ();

    fn new(_flags: ()) -> (App, Command<Self::Message>) {

        let slider_1_state = slider::State::new();
        let slider_1_value = 50.0;
        let slider_2_state = slider::State::new();
        let slider_2_value = 50.0;
        let record_state = button::State::new();
        let recording = false;
        //let (record_sender, record_receiver) = std::sync::mpsc::channel();
        (App { slider_1_state, slider_1_value, slider_2_state, slider_2_value, record_state, recording, record_sender: None}, Command::none())


    }

    fn title(&self) -> String {
        String::from("Storyteller VC")
    }

    fn update(&mut self, msg: Self::Message) -> Command<Self::Message> {
        match msg {
            Message::Slider1Changed(new_value) => {
                self.slider_1_value = new_value;
            }
            Message::Slider2Changed(new_value) => {
                self.slider_2_value = new_value;
            }
            Message::RecordPressed => {
                if self.recording {
                    if self.record_sender.is_some()
                    {
                        self.record_sender.as_ref().unwrap().send(false).unwrap();
                    }
                } else {
                    let (record_sender, record_receiver) = std::sync::mpsc::channel();
                    self.record_sender = Some(record_sender);
                    std::thread::spawn(move || { start_recording(record_receiver) }); 
                    self.record_sender.as_ref().unwrap().send(true).unwrap();
                }

                self.recording = !self.recording;
            }
        }
        Command::none()
    }

    fn view(&mut self) -> Element<Self::Message> {
        Column::new()
            .push(
                Slider::new(&mut self.slider_1_state, 0.0..=100.0, self.slider_1_value, Message::Slider1Changed)
            )
            .push(
                Slider::new(&mut self.slider_2_state, 0.0..=100.0, self.slider_2_value, Message::Slider2Changed)
            )
            .push(
                Button::new(&mut self.record_state, Text::new("Record")).on_press(Message::RecordPressed)
            ).into()

    }

}


use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use ringbuf::RingBuffer;

fn err_fn(err: cpal::StreamError) {
    eprintln!("Error: {:?}", err);
}

fn start_recording(record_receiver: std::sync::mpsc::Receiver<bool>)  {
    let host = cpal::default_host();

    // Find devices.
    let input_device = host.default_input_device().unwrap();
    let output_device = host.default_output_device().unwrap();

    // We'll try and use the same configuration between streams to keep it simple.
    let config = cpal::StreamConfig { channels: 1, sample_rate: SampleRate(48000), buffer_size: BufferSize::Default };
    let ring = RingBuffer::new(100_0000);
    let (mut producer, mut consumer) = ring.split();

    // Create a delay in case the input and output devices aren't synced.
    let input_data_fn = move |data: &[f32], _: &cpal::InputCallbackInfo| {
        for &sample in data {
            producer.push(sample).unwrap();
        }
    };

    let output_data_fn = move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
        for sample in data {
            *sample = match consumer.pop() {
                Some(s) => s,
                None => {
                    0.0
                }
            };
        }
    };

    let input_stream = input_device.build_input_stream(&config, input_data_fn, err_fn).unwrap();
    let output_stream = output_device.build_output_stream(&config, output_data_fn, err_fn).unwrap();

    input_stream.play().unwrap();
    output_stream.play().unwrap();
    loop {
        let recording = record_receiver.recv().unwrap();
        if recording {
            std::thread::sleep(std::time::Duration::from_millis(50));
        } else {
            break
        }
    }
}
