"use strict";

(function () {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) {
                    var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
                }var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
                    var n = e[i][1][r];return o(n || r);
                }, p, p.exports, r, e, n, t);
            }return n[i].exports;
        }for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
            o(t[i]);
        }return o;
    }return r;
})()({ 1: [function (require, module, exports) {
        (function () {
            //'use strict';

            var audioBuffer = require('./audioBuffer')();

            module.exports = function (options) {
                var options = options || {};
                var ctx,
                    source,
                    node,
                    analyser,
                    recording = true;
                var silenceStart,
                    iterator = 0;

                function getaudioContext() {
                    if (window.AudioContext || window.webkitAudioContext) {
                        return new AudioContext();
                    }
                    throw new Error('audio context unavailable within this browser...');
                }

                function stopAnalysing() {
                    recording = false;
                    analyser.disconnect();
                    node.disconnect();
                }

                function resumeAnalysing() {
                    recording = true;
                    iterator = 0;
                    analyser.connect(node);
                    node.connect(source.context.destination);
                }

                function beginAnalyse(stream, silenceConfig, onSilence) {
                    var onSilence = onSilence || function () {/* nothing to do*/};

                    try {
                        ctx = getaudioContext();
                    } catch (err) {

                        console.log(err.toString());
                        return;
                    }

                    source = ctx.createMediaStreamSource(stream);
                    node = source.context.createScriptProcessor(4096, 1, 1);
                    analyser = source.context.createAnalyser();
                    analyser.minDecibels = -90;
                    analyser.maxDecibels = -10;
                    analyser.smoothingTimeConstant = 0.85;

                    source.connect(analyser);
                    analyser.connect(node);
                    node.connect(source.context.destination);

                    console.log('source.context.sampleRate= ' + source.context.sampleRate);
                    audioBuffer.initSampleRate(source.context.sampleRate);

                    console.log('analyse audio...');
                    node.addEventListener('audioprocess', function (audioProcessingEvent) {
                        console.log('process');
                        /*if(!recording){
                            analyser.disconnect()
                            node.disconnect()
                            return;
                        }*/

                        console.info('processing audio...');
                        //console.log(audioProcessingEvent)

                        audioBuffer.whileRecording(audioProcessingEvent.inputBuffer.getChannelData(0));

                        analyse(silenceConfig, onSilence, audioProcessingEvent.playbackTime);
                    });
                }

                function analyse(silenceConfig, onSilence, playbackTime) {
                    // write analyse function
                    analyser.fftSize = 2048;
                    var bufferLength = analyser.fftSize;
                    var dataArray = new Uint8Array(bufferLength);
                    var amplitude = silenceConfig.amplitude;
                    var time = silenceConfig.time;

                    //console.log(dataArray)
                    analyser.getByteTimeDomainData(dataArray);
                    //console.log(dataArray)

                    for (var i = 0; i < bufferLength; i++) {
                        // Normalize between -1 and 1.
                        var curr_value_time = dataArray[i] / 128 - 1.0;
                        //console.log(curr_value_time)
                        if (curr_value_time > amplitude || curr_value_time < -1 * amplitude) {
                            silenceStart = Date.now();
                        }
                    }

                    //console.log(Date.now())
                    var current = Date.now();
                    if (iterator === 0) silenceStart = current;

                    var elapsedTime = current - silenceStart;
                    /*console.log(elapsedTime)
                    console.log(current)
                    console.log(silenceStart)
                    console.log(time)*/
                    console.log('elapsed time: ' + elapsedTime);
                    console.log('time: ' + time);
                    console.log(iterator);

                    if (elapsedTime > time) {
                        // handle detected silence
                        //console.log('silence detected...')
                        //console.log('elapsed time: '+ elapsedTime)

                        // reinitialise iterator for eventual upcoming recordings
                        iterator = 0;
                        // call the callback 
                        onSilence(true, playbackTime);
                        return;
                    }

                    // to define how much silences were detected we could reset iterator to 0 
                    // and start counting once a new silence is detected

                    iterator++;
                }

                return {
                    beginAnalyse: beginAnalyse,
                    stopAnalysing: stopAnalysing,
                    resumeAnalysing: resumeAnalysing
                };
            };
        })();
    }, { "./audioBuffer": 2 }], 2: [function (require, module, exports) {
        //(function(){

        var buffer = [],
            bufferLength = 0,
            recordSampleRate;

        module.exports = function (options) {
            'use strict';

            options = options || {};

            function whileRecording(inputBuffer) {
                //console.log(inputBuffer)
                buffer.push(inputBuffer);
                bufferLength += inputBuffer.length;
                //console.log(bufferLength)
            }

            function initSampleRate(rate) {
                recordSampleRate = rate;
            }

            function clean() {
                bufferLength = 0;
                buffer = [];
            }

            function floatTo16BitPCM(output, offset, input) {
                for (var i = 0; i < input.length; i++, offset += 2) {
                    var s = Math.max(-1, Math.min(1, input[i]));
                    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
            }

            function writeString(view, offset, string) {
                for (var i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            function exportBuffer(exportSampleRate) {
                var mergedBuffers = mergeBuffers(buffer, bufferLength);
                console.log('merged buffers: ' + mergeBuffers);
                var downsampledBuffer = downsampleBuffer(mergedBuffers, exportSampleRate);
                console.log(downsampleBuffer);
                var encodedWav = encodeWAV(downsampledBuffer);
                //return encodedWav;
                var audioBlob = new Blob([encodedWav], { type: 'application/octet-stream' });
                return audioBlob;
            }

            function mergeBuffers(bufferArray, bufferLength) {
                // TO DO
                console.log('bbb length: ' + bufferLength);
                var result = new Float32Array(bufferLength);
                var offset = 0;
                for (var i = 0; i < bufferArray.length; i++) {
                    result.set(bufferArray[i], offset);
                    offset += bufferArray[i].length;
                }
                return result;
            }

            function downsampleBuffer(buffer, exportSampleRate) {
                // TO DO   
                if (exportSampleRate === recordSampleRate) {
                    return buffer;
                }
                var sampleRateRatio = recordSampleRate / exportSampleRate;
                var newLength = Math.round(buffer.length / sampleRateRatio);
                var result = new Float32Array(newLength);
                var offsetResult = 0;
                var offsetBuffer = 0;
                while (offsetResult < result.length) {
                    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
                    var accum = 0,
                        count = 0;
                    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
                        accum += buffer[i];
                        count++;
                    }
                    result[offsetResult] = accum / count;
                    offsetResult++;
                    offsetBuffer = nextOffsetBuffer;
                }

                console.log('res: ' + result);
                return result;
            }

            function encodeWAV(samples) {
                // TO DO
                var buffer = new ArrayBuffer(44 + samples.length * 2);
                var view = new DataView(buffer);

                writeString(view, 0, 'RIFF');
                view.setUint32(4, 32 + samples.length * 2, true);
                writeString(view, 8, 'WAVE');
                writeString(view, 12, 'fmt ');
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true);
                view.setUint16(22, 1, true);
                view.setUint32(24, recordSampleRate, true);
                view.setUint32(28, recordSampleRate * 2, true);
                view.setUint16(32, 2, true);
                view.setUint16(34, 16, true);
                writeString(view, 36, 'data');
                view.setUint32(40, samples.length * 2, true);
                floatTo16BitPCM(view, 44, samples);

                return view;
            }

            return {
                whileRecording: whileRecording,
                initSampleRate: initSampleRate,
                exportBufferAsBlob: exportBuffer
            };
        };
        //})();
    }, {}], 3: [function (require, module, exports) {
        (function () {
            'use strict';

            exports.checkMediaDevice = function () {
                return new Promise(function (resolve, reject) {
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
                            resolve(stream);
                        }).catch(function (err) {
                            console.info('error get user media: ' + err);
                            reject('err: ' + err);
                        });
                    } else reject('no existing media device in this browser');
                });
            };
        })();
    }, {}], 4: [function (require, module, exports) {
        (function (global) {
            /**
             * @module main
             * @description The global namespace for the audio recorder
             */

            global.FastRecorder = global.FastRecorder || {};
            global.FastRecorder.audioRecorder = require('./recorder');
            //global.FastRecorder.firebaseStorage= require('./platforms/firebaseStore')
            module.exports = global.FastRecorder;
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, { "./recorder": 5 }], 5: [function (require, module, exports) {
        'use strict';

        var helpers = require('./helpers');
        var Analyser = require('./analyser')();
        var audioBuffer = require('./audioBuffer')();
        var sampleAudio = require('./sampleAudio')();

        // to trim recorded audio from silent parts we should detect within which parts while the recording the silence was
        // detected and how much it  lasted, then we can remove the chunks contained in that part of the recording


        function AudioRecorder(options) {
            var options = {} || options;
            this.context = new AudioContext();
            this.Chunks = [];
            this.Blob = options.blob || null;
            this.Url = options.Url || null;
            this.Audio = options.Audio || null;
            this.AudioLength = 0;
            this.mediaRecorder = null;
            this.recordStopped = false;
            this.elapsedTime = 0;
            this.isPaused = false;
            this.test = 'test prototype';
            this.silenceDetectionTime = 3000;
            this.silenceDetectionAmplitude = 0.2;
            this.reSampleRate = 16000;
            this.speechSynthesisCounter = 0;
            this.speechSynthesisCounterPrevious = 0;

            AudioRecorder.speechSynthesisInstances++;
        }

        AudioRecorder.speechSynthesisInstances = 0;

        AudioRecorder.prototype.getCount = function () {
            return AudioRecorder.speechSynthesisInstances;
        };

        AudioRecorder.prototype.configureSilence = function (silenceDetectionConfig) {
            var self = this;
            silenceDetectionConfig = silenceDetectionConfig || {};
            this.silenceDetectionTime = silenceDetectionConfig.hasOwnProperty('time') ? silenceDetectionConfig.time : this.silenceDetectionTime;
            this.silenceDetectionAmplitude = silenceDetectionConfig.hasOwnProperty('amplitude') ? silenceDetectionConfig.amplitude : this.silenceDetectionAmplitude;
        };

        AudioRecorder.prototype.startRecording = function (onStart, onSilence, onHappening) {
            var self = this;
            console.log(this.test);
            helpers.checkMediaDevice().then(function (stream) {
                console.log(stream);
                self.mediaRecorder = new MediaRecorder(stream);
                self.mediaRecorder.start();
                console.log(JSON.stringify(self.mediaRecorder));

                // media recorder events
                self.mediaRecorder.addEventListener('start', function (event) {
                    console.info('beginning recording...');
                    if (typeof onStart === 'function') onStart();

                    Analyser.beginAnalyse(stream, {
                        time: self.silenceDetectionTime,
                        amplitude: self.silenceDetectionAmplitude
                    }, function (silenceDetected, playbackTime) {
                        if (silenceDetected) {
                            if (typeof onSilence === 'function') {
                                playbackTime = parseFloat(playbackTime.toFixed(2));
                                onSilence(playbackTime);
                            }
                        }
                    });
                });

                self.mediaRecorder.addEventListener('dataavailable', function (event) {
                    console.log(JSON.stringify(event));
                    console.log(event.data);
                    self.Chunks.push(event.data);
                    console.info('recorder collecting data...');
                    self.elapsedTime = self.elapsedTime + 100;
                    self.AudioLength = self.elapsedTime;
                    onHappening((self.elapsedTime / 1000).toFixed(2));
                });

                var interval = setInterval(function () {
                    try {
                        if (!self.isPaused) {
                            var capturedData = self.mediaRecorder.requestData();
                        }
                    } catch (err) {
                        clearInterval(interval);
                    }
                }, 100);
            }).catch(function () {
                console.error(err);
            });
        };

        AudioRecorder.prototype.stopRecording = function (onStop) {
            console.log(this.test);
            var self = this;
            if (self.mediaRecorder) {
                self.mediaRecorder.stop();
                self.mediaRecorder.addEventListener("stop", function () {
                    Analyser.stopAnalysing();
                    //self.Blob = audioBuffer.exportBufferAsBlob(16000)
                    self.mediaRecorder = null;
                    self.Blob = new Blob(self.Chunks, { type: 'audio/x-l16' });
                    self.Url = URL.createObjectURL(self.Blob);

                    // reinitialize counter
                    self.AudioLength = 0;
                    self.elapsedTime = 0;

                    console.info('recorder stopped');
                    if (onStop && typeof onStop === 'function') {
                        onStop(null, self.Blob, self.Url);
                        self.Chunks = [];
                        return;
                    }

                    // reinitialize data chunks on stopping
                    self.Chunks = [];
                });
            } else {
                onStop('media recorder isn\'t started yet or it is already stopped');
            }
        };

        AudioRecorder.prototype.restart = function (onRestart, onSilence, onHappening) {
            var _this = this;

            if (this.mediaRecorder) {
                this.stopRecording(function () {
                    _this.startRecording(onRestart, onSilence, onHappening);
                });
            } else {
                onRestart('no recording started yet');
            }
        };

        AudioRecorder.prototype.isSilentAudio = function (fileUrl, onSilence) {
            //TO DO
            var self = this;

            self.Audio = new Audio(self.Url);
            //var stream= new MediaStream()
            console.log(self.Audio);
            self.Audio.play();
            console.log(self.Audio.duration);
            self.Audio.addEventListener('play', function () {
                console.log('paly play');
                var stream = self.Audio.captureStream();
                Analyser.beginAnalyse(stream, {
                    time: 5000,
                    amplitude: self.silenceDetectionAmplitude
                }, function (silenceDetected, playbackTime) {
                    if (silenceDetected) {
                        if (typeof onSilence === 'function') onSilence(playbackTime);
                    }
                });
            });
        };

        AudioRecorder.prototype.exportAsBlob = function () {
            return audioBuffer.exportBufferAsBlob(16000);
        };

        AudioRecorder.prototype.exportResampledAudio = function (reSampleRate, onComplete) {
            var self = this;
            if (!self.mediaRecorder) {
                var reader = new FileReader();
                reader.addEventListener('load', function () {
                    console.log('loading...');
                    self.context.decodeAudioData(reader.result, function (buffer) {
                        var samplingRate = reSampleRate && typeof reSampleRate === 'number' && reSampleRate >= 10000 && reSampleRate <= 20000 ? reSampleRate : self.reSampleRate;
                        sampleAudio.reSampleBuffer(buffer, samplingRate, function (newBuffer) {
                            var arrayBuffer = sampleAudio.convertFloat32ToInt16(newBuffer.getChannelData(0));
                            if (typeof onComplete === 'function') onComplete(null, arrayBuffer);else {
                                throw new Error('type provided as a callback is not a function');
                            }
                        });
                    });
                });

                reader.readAsArrayBuffer(self.Blob);
            } else {
                onComplete('recording isn\'t stopped yet');
            }
        };

        AudioRecorder.prototype.exportAsMP3 = function () {
            var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'test';

            //TO DO
            var self = this;
            if (self.Blob) {
                var file = new File([self.Blob], name + ".mp3", {
                    type: 'audio/mpeg'
                });

                return file;
            } else {
                return null;
            }
        };

        AudioRecorder.prototype.pause = function (onPause) {
            var self = this;
            if (self.mediaRecorder && self.isPaused === false) {
                self.mediaRecorder.pause();
                self.mediaRecorder.addEventListener('pause', function () {
                    self.Blob = new Blob(self.Chunks);
                    self.Url = URL.createObjectURL(self.Blob);
                    self.isPaused = true;

                    // stop analyser
                    Analyser.stopAnalysing();

                    if (typeof onPause === 'function') {
                        onPause(null, self.Url, self.elapsedTime);
                        return;
                    } else {
                        throw new Error('callback isn\'t a function');
                        return;
                    }
                });
            } else if (self.isPaused === true) {
                onPause('media recorder is already paused');
            } else {
                onPause('media recorder isn\'t started yet');
            }
        };

        AudioRecorder.prototype.resume = function (onResume) {
            var self = this;
            if (self.mediaRecorder && self.isPaused === true) {
                self.mediaRecorder.resume();
                self.mediaRecorder.addEventListener('resume', function () {
                    self.isPaused = false;

                    // resume analyser
                    Analyser.resumeAnalysing();

                    if (typeof onResume === 'function') {
                        onResume(null, 'resumed');
                        return;
                    } else {
                        throw new Error('callback isn\'t a function');
                        return;
                    }
                });
            } else if (self.isPaused === false) {
                onResume('media recorder isn\'t paused');
            } else {
                onResume('media recorder isn\'t started yet');
            }
        };

        AudioRecorder.prototype.playAudio = function (url) {
            var self = this;
            if (url) {
                self.Audio = new Audio(url);
                self.Audio.play();
                return;
            }

            if (self.Url) {
                self.Audio = new Audio(self.Url);
                self.Audio.play();
                return;
            }

            if (self.Blob) {
                self.Audio = new Audio(self.Blob);
                self.Audio.play();
                return;
            }

            console.info('audio isn\'t ready yet');
        };

        AudioRecorder.prototype.speakText = function (payload, onStart, onFinish) {
            var self = this;
            if (payload.text && payload.text !== undefined) {
                if (window && window.speechSynthesis) {
                    var synth = window.speechSynthesis;
                    var utterance = new SpeechSynthesisUtterance(payload.text);
                    utterance.volume = 1;
                    utterance.lang = 'en-US';
                    utterance.pitch = payload.pitch && payload.pitch >= 0 && payload.pitch <= 10 ? payload.pitch : 1;
                    utterance.rate = payload.rate && payload.rate >= 0 && payload.rate <= 2 ? payload.rate : 1.2;

                    if (speechSynthesis.onvoiceschanged !== undefined) {
                        synth.onvoiceschanged = function () {
                            // mark window.speechSynthesisInstances as a prototype static property
                            if (window.speechSynthesisInstances) {
                                if (self.speechSynthesisCounterPrevious === self.speechSynthesisCounter) window.speechSynthesisInstances++;
                            } else {
                                window.speechSynthesisInstances = 1;
                            }

                            self.speechSynthesisCounterPrevious = self.speechSynthesisCounter++;

                            var voices = synth.getVoices && typeof synth.getVoices === 'function' ? synth.getVoices() : [];

                            utterance.voice = payload.voice && payload.voice === 'woman' ? voices.filter(function (voice) {
                                return voice.name === 'Samantha';
                            })[0] : voices.filter(function (voice) {
                                return voice.name === 'Alex';
                            })[0];

                            synth.speak(utterance);
                        };

                        //synth.speak(utterance);
                        if (self.speechSynthesisCounter > 0 || window.speechSynthesisInstances > 0) synth.dispatchEvent(new Event('voiceschanged'));
                    } else {
                        synth.speak(utterance);
                    }

                    utterance.addEventListener('start', function (event) {
                        console.log('speech has started');
                        if (typeof onStart === 'function') onStart();
                    });

                    utterance.addEventListener('end', function (event) {
                        console.log('end speaking...');
                        synth.cancel();
                        if (typeof onFinish === 'function') onFinish();
                    });
                } else {
                    throw new Error('not supported here');
                }
            } else {
                throw new Error('no text provided');
            }
        };

        module.exports = AudioRecorder;
    }, { "./analyser": 1, "./audioBuffer": 2, "./helpers": 3, "./sampleAudio": 6 }], 6: [function (require, module, exports) {
        (function () {
            'use strict';

            module.exports = function (self) {

                function reSample(audioBuffer, targetSampleRate, onComplete) {
                    var channel = audioBuffer.numberOfChannels;
                    var samples = audioBuffer.length * targetSampleRate / audioBuffer.sampleRate;

                    var offlineContext = new OfflineAudioContext(channel, samples, targetSampleRate);
                    var bufferSource = offlineContext.createBufferSource();
                    bufferSource.buffer = audioBuffer;

                    bufferSource.connect(offlineContext.destination);
                    bufferSource.start(0);
                    offlineContext.startRendering().then(function (renderedBuffer) {
                        onComplete(renderedBuffer);
                    });
                }

                function convertFloat32ToInt16(buffer) {
                    var l = buffer.length;
                    console.log('buffer length: ' + l);
                    var buf = new Int16Array(l);
                    while (l--) {
                        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
                    }
                    return buf.buffer;
                }

                return {
                    reSampleBuffer: reSample,
                    convertFloat32ToInt16: convertFloat32ToInt16
                };
            };
        })();
    }, {}] }, {}, [4]);
//# sourceMappingURL=fast-recorder-transpiled.js.map
