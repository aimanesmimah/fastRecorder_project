<a name="README">[<img src="https://firebasestorage.googleapis.com/v0/b/github-833f9.appspot.com/o/fastlogo.png?alt=media&token=abe70d26-bc91-40c3-a982-dae919c8c462" height="100px" width="400px" />](#)</a>

# Fast Recorder JS

[![npm version](https://badge.fury.io/js/fastrecorder.svg)](https://badge.fury.io/js/fastrecorder)

Fast Recorder is a simple, easy to use library built on top of javascript browser api whose purpose is to provide developers with ready to consume functions allowing them to perform recording tasks quickly 
without the need of the browser api messing up, one of the perks of that one is that it makes audio processing 
to detect silence within the stream 


## Features

* starting/stopping Recording Audio

* restarting recording if needed

* pausing/resuming record

* convert text to woman/man voice

* detecting silence while recording

* exporting output to mp3/ogg file

* resampling the recorded track to fit your software requirement

* playing record


## Installation & Usage

- Include the pre-compiled javascript production bundle

```html
<script type="text/javascript" src="./dist/fast-recorder.min.js"></script>
```

- Or, include the library CDN

```html
<script type="text/javascript" src="https://unpkg.com/fastrecorder@0.0.2/dist/fast-recorder.min.js"></script>
```

- Next you can instantiate the library constructor this way 

```javascript
 var recorder= new FastRecorder.audioRecoder()   
```


## API

### Library methods

* recorder.startRecording(onStart,onSilence,onHappening)

* recorder.stopRecording(onStop)

* recorder.restart(onRestart,onSilence,onHappening)

* recorder.exportResampledAudio(reSampleRate,onComplete)

* recorder.exportAsMP3(filename)

* recorder.pause(onPause)

* recorder.resume(onResume)

* recorder.playAudio(url)

* recorder.speakText(payload,onStart,onFinish)


## Tests

- to run the demo locally, you need first to do 

```
bower install && run the index.html file locally 
```



## License

FastRecorder.js is freely distributable under the terms of the [MIT LICENSE](https://github.com/cloudstrife9494/fastRecorder_project/blob/master/LICENSE)






