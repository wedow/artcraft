/// Requests to the "speak" endpoint.
class SpeakRequest {
  text: string
  speaker: string

  constructor(text: string, speaker: string) {
    this.text = text;
    this.speaker = speaker; 
  }
}

export { SpeakRequest };
 