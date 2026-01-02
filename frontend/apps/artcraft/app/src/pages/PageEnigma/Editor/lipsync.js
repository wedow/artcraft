const BoundingFrequencyMasc = [0, 400, 560, 2400, 4800];
const BoundingFrequencyFem = [0, 500, 700, 3000, 6000];
const IndicesFrequencyFemale = [];
const IndicesFrequencyMale = [];
const FFT_SIZE = 1024;
const samplingFrequency = 44100;

for (let m = 0; m < BoundingFrequencyMasc.length; m++) {
  IndicesFrequencyMale[m] = Math.round(
    ((2 * FFT_SIZE) / samplingFrequency) * BoundingFrequencyMasc[m],
  );
}

for (let m = 0; m < BoundingFrequencyFem.length; m++) {
  IndicesFrequencyFemale[m] = Math.round(
    ((2 * FFT_SIZE) / samplingFrequency) * BoundingFrequencyFem[m],
  );
}

export class LipSync {
  constructor(face) {
    this.face = face;
    this.buffer = null;
    this.last_frame = 0;

    // WE NEED THIS TO be run at RUNTIME
    // we have to modify this for our
    // this.ee = this.face.morphTargetDictionary["E"];
    // this.oh = this.face.morphTargetDictionary["O"];
    // this.ah = this.face.morphTargetDictionary["aa"];
  }

  // for streaming sound?
  start(stream) {
    this.audioContext = new AudioContext();
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    this.meter = LipSync.createAudioMeter(this.audioContext);
    this.mediaStreamSource.connect(this.meter);
  }

  // testing only
  startFromAudioFile(file) {
    if (!this.audioContext) this.audioContext = new AudioContext();

    if (!this.userSpeechAnalyzer)
      this.userSpeechAnalyzer = this.audioContext.createAnalyser();
    this.userSpeechAnalyzer.smoothingTimeConstant = 0.5;
    this.userSpeechAnalyzer.fftSize = FFT_SIZE;

    if (this.mediaStreamSource) this.mediaStreamSource.stop();

    this.audioContext.decodeAudioData(file).then((buffer) => {
      this.mediaStreamSource = this.audioContext.createBufferSource();
      this.mediaStreamSource.buffer = buffer;
      this.meter = LipSync.createAudioMeter(this.audioContext);
      this.mediaStreamSource.connect(this.meter);
      this.mediaStreamSource.connect(this.audioContext.destination);
      this.mediaStreamSource.start();

      // connect the output of mediaStreamSource to the input of userSpeechAnalyzer
      this.mediaStreamSource.connect(this.userSpeechAnalyzer);
    });
  }

  startLipSyncFromAudioBuffer(buffer) {
    if (!this.audioContext) this.audioContext = new AudioContext();
    if (!this.userSpeechAnalyzer)
      this.userSpeechAnalyzer = this.audioContext.createAnalyser();
    this.userSpeechAnalyzer.smoothingTimeConstant = 0.5;
    this.userSpeechAnalyzer.fftSize = FFT_SIZE;

    if (this.mediaStreamSource) this.mediaStreamSource.stop();

    this.buffer = buffer;
  }

  destroy() {
    this.meter?.shutdown();
    this.meter = null;
    this.mediaStreamSource?.disconnect();
    return this.audioContext?.close().catch(() => {}) || Promise.resolve();
  }

  update(frame, offset, rendering) {
    const frameBuffer = 12;

    let pos = frame - offset;

    if (Math.floor(pos) <= 1){
      this.last_frame = 0;
    }

    let doPlay = true;
    if (
      Math.abs(this.last_frame - frame) < frameBuffer - 1 &&
      this.last_frame !== 0
    ) {
      doPlay = false;
    }

    if (doPlay) {
      const startTime = pos / 60.0;
      const endTime = frameBuffer / 60.0;
      this.mediaStreamSource = this.audioContext.createBufferSource();
      this.mediaStreamSource.buffer = this.buffer;
      this.meter = LipSync.createAudioMeter(this.audioContext);
      this.mediaStreamSource.connect(this.meter);
      this.mediaStreamSource.connect(this.audioContext.destination);
      this.mediaStreamSource.start(0, startTime, endTime);
      this.mediaStreamSource.connect(this.userSpeechAnalyzer);
      this.last_frame = frame;
    }

    if (this.meter) {
      const { volume } = this.meter;
      let { ah, oh, ee } = this.update2();
      if (volume < 0.01) {
        ah = 0;
        oh = 0;
        ee = 0;
      }
      return { ah: ah, oh: oh, ee: ee };
    }
    return { ah: 0, oh: 0, ee: 0 };
  }

  update2() {
    function getSensitivityMap(spectrum) {
      const sensitivity_threshold = 0.5;
      const stPSD = new Float32Array(spectrum.length);
      for (let i = 0; i < spectrum.length; i++) {
        stPSD[i] = sensitivity_threshold + (spectrum[i] + 20) / 140;
      }
      return stPSD;
    }

    const spectrum = new Float32Array(
      this.userSpeechAnalyzer.frequencyBinCount,
    );
    // Populate frequency data for computing frequency intensities
    this.userSpeechAnalyzer.getFloatFrequencyData(spectrum); // getByteTimeDomainData gets volumes over the sample time
    // Populate time domain for calculating RMS
    // userSpeechAnalyzer.getFloatTimeDomainData(spectrum);
    // RMS (root mean square) is a better approximation of current input level than peak (just sampling this frame)
    // spectrumRMS = getRMS(spectrum);

    const sensitivityPerPole = getSensitivityMap(spectrum);

    // Lower and higher voices have different frequency domains, so we'll separate and max them
    const EnergyBinMasc = new Float32Array(BoundingFrequencyMasc.length);
    const EnergyBinFem = new Float32Array(BoundingFrequencyFem.length);

    // Masc energy bins (groups of frequency-depending energy)
    for (let m = 0; m < BoundingFrequencyMasc.length - 1; m++) {
      for (
        let j = IndicesFrequencyMale[m];
        j <= IndicesFrequencyMale[m + 1];
        j++
      )
        if (sensitivityPerPole[j] > 0)
          EnergyBinMasc[m] += sensitivityPerPole[j];
      EnergyBinMasc[m] /= IndicesFrequencyMale[m + 1] - IndicesFrequencyMale[m];
    }

    // Fem energy bin
    for (let m = 0; m < BoundingFrequencyFem.length - 1; m++) {
      for (
        let j = IndicesFrequencyMale[m];
        j <= IndicesFrequencyMale[m + 1];
        j++
      )
        if (sensitivityPerPole[j] > 0) EnergyBinFem[m] += sensitivityPerPole[j];
      EnergyBinMasc[m] /= IndicesFrequencyMale[m + 1] - IndicesFrequencyMale[m];
      EnergyBinFem[m] =
        EnergyBinFem[m] /
        (IndicesFrequencyFemale[m + 1] - IndicesFrequencyFemale[m]);
    }
    const oh =
      Math.max(EnergyBinFem[1], EnergyBinMasc[1]) > 0.2
        ? 1 - 2 * Math.max(EnergyBinMasc[2], EnergyBinFem[2])
        : (1 - 2 * Math.max(EnergyBinMasc[2], EnergyBinFem[2])) *
          5 *
          Math.max(EnergyBinMasc[1], EnergyBinFem[1]);

    const ah = 3 * Math.max(EnergyBinMasc[3], EnergyBinFem[3]);
    const ee =
      0.8 *
      (Math.max(EnergyBinMasc[1], EnergyBinFem[1]) -
        Math.max(EnergyBinMasc[3], EnergyBinFem[3]));
    return { oh, ee, ah };
  }

  static createAudioMeter(audioContext) {
    const processor = audioContext.createScriptProcessor(512);
    processor.onaudioprocess = (event) => {
      const buf = event.inputBuffer.getChannelData(0);
      const bufLength = buf.length;
      let sum = 0;
      let x;

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < bufLength; i++) {
        x = buf[i];
        if (Math.abs(x) >= processor.clipLevel) {
          processor.clipping = true;
          processor.lastClip = window.performance.now();
        }
        sum += x * x;
      }
      const rms = Math.sqrt(sum / bufLength);
      processor.volume = Math.max(rms, processor.volume * processor.averaging);
    };
    processor.clipping = false;
    processor.lastClip = 0;
    processor.volume = 0;
    processor.clipLevel = 0.98;
    processor.averaging = 0.95;
    processor.clipLag = 750;

    processor.connect(audioContext.destination);

    processor.checkClipping = () => {
      if (!processor.clipping) {
        return false;
      }
      if (processor.lastClip + processor.clipLag < window.performance.now()) {
        processor.clipping = false;
      }
      return processor.clipping;
    };

    processor.shutdown = () => {
      processor.disconnect();
      processor.onaudioprocess = null;
    };

    return processor;
  }
}
