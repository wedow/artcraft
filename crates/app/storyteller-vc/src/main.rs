use iced::{executor, Application, Command, Element, Settings, Column, Row};
use iced::widget::{Slider, slider, Button, button, Text, pick_list, PickList};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleRate, BufferSize, Device};
use ringbuf::RingBuffer;

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
    input_device_list_state: pick_list::State<String>,
    input_device_list_options: Vec<String>,
    input_device_list_selected: Option<String>,
    output_device_list_state: pick_list::State<String>,
    output_device_list_options: Vec<String>,
    output_device_list_selected: Option<String>,
}


#[derive(Clone, Debug)]
enum Message {
    Slider1Changed(f32),
    Slider2Changed(f32),
    RecordPressed,
    InputDeviceChanged(String),
    OutputDeviceChanged(String),
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
        let record_sender = None;
        let input_device_list_state = pick_list::State::new();
        let input_device_list_options = cpal::default_host().input_devices().unwrap().map(|d|d.name().unwrap()).collect();
        let input_device_list_selected = None;
        let output_device_list_state = pick_list::State::new();
        let output_device_list_options = cpal::default_host().output_devices().unwrap().map(|d| d.name().unwrap()).collect();
        let output_device_list_selected = None;

        (
            App {
                slider_1_state,
                slider_1_value,
                slider_2_state,
                slider_2_value,
                record_state,
                recording,
                record_sender,
                input_device_list_state,
                input_device_list_options,
                input_device_list_selected,
                output_device_list_state,
                output_device_list_options,
                output_device_list_selected,

            },
            Command::none()
        )
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
                    let input_device_name = self.input_device_list_selected.clone();
                    let output_device_name = self.output_device_list_selected.clone();
                    std::thread::spawn(move || { start_recording(record_receiver, input_device_name, output_device_name) }); 
                    self.record_sender.as_ref().unwrap().send(true).unwrap();
                }

                self.recording = !self.recording;
            }
            Message::InputDeviceChanged(new_device) => {
                self.input_device_list_selected = Some(new_device);
            }
            Message::OutputDeviceChanged(new_device) => {
                self.output_device_list_selected = Some(new_device);
            }
        }
        Command::none()
    }

    fn view(&mut self) -> Element<Self::Message> {
        Column::new()
            .push(
                Row::new()
                .push(Text::new("Input Device: "))
                .push(
                    PickList::new(
                        &mut self.input_device_list_state,
                        &self.input_device_list_options,
                        self.input_device_list_selected.clone(),
                        Message::InputDeviceChanged,
                    )
                )
                .push(Text::new("Output Device: "))
                .push(
                    PickList::new(
                        &mut self.output_device_list_state,
                        &self.output_device_list_options,
                        self.output_device_list_selected.clone(),
                        Message::OutputDeviceChanged,
                    )
                )
            )
            .push(
                Row::new()
                .push(Text::new("Input Volume: "))
                .push(
                    Slider::new(&mut self.slider_1_state, 0.0..=100.0, self.slider_1_value, Message::Slider1Changed)
                )
                .push(Text::new("Output Volume: "))
                .push(
                    Slider::new(&mut self.slider_2_state, 0.0..=100.0, self.slider_2_value, Message::Slider2Changed)
                )
            )
            .push(
                Button::new(&mut self.record_state, if self.recording { Text::new("Stop") } else  {Text::new("Record")} ).on_press(Message::RecordPressed)
            ).into()
    }
}

fn start_recording(record_receiver: std::sync::mpsc::Receiver<bool>, input_device_name: Option<String>, output_device_name: Option<String>)  {
    let host = cpal::default_host();

    //FIXME better unique identifier than the name of the device
    let input_device: cpal::Device;
    match input_device_name {
        Some(input_device_name) => { input_device = host.input_devices().unwrap().filter(|d| d.name().unwrap() == input_device_name).next().unwrap(); }
        None => { input_device = host.default_input_device().unwrap(); }
    }
    let output_device: cpal::Device;
    match output_device_name {
        Some(output_device_name) => { output_device = host.output_devices().unwrap().filter(|d| d.name().unwrap() == output_device_name).next().unwrap(); }
        None => { output_device = host.default_output_device().unwrap(); }
    }

    let config = cpal::StreamConfig { channels: 1, sample_rate: SampleRate(48000), buffer_size: BufferSize::Default };
    let ring = RingBuffer::new(100_0000);
    let (mut producer, mut consumer) = ring.split();

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

fn err_fn(err: cpal::StreamError) {
    eprintln!("Error: {:?}", err);
}
