var FastRecorder = window.FastRecorder

describe('test recorder',function(){
    beforeAll(function(){
        this.recorder= new FastRecorder.audioRecorder()
    })

    it('recorder instance',function(){
        console.log("running test in the browser")
        expect(this.recorder).not.toBeNull()
        //expect(this.recorder.getCount()).toBe(3)
    })

    it('recorder instances',function(){
        var instance1= new FastRecorder.audioRecorder()
        var instance2= new FastRecorder.audioRecorder()

        expect(this.recorder.getCount()).toBe(3)
        expect(instance1.getCount()).toBe(3)
        expect(instance2.getCount()).toBe(3)
    })

    it('recorder silence configuration',function(){

        var silenceDetectionConfig= {
            time : 2000,
            amplitude: 0.4
        }

        this.recorder.configureSilence(silenceDetectionConfig)

        expect(this.recorder.silenceDetectionTime).toBe(2000)
        expect(this.recorder.silenceDetectionAmplitude).toBe(0.4)
    })

    it('supports speech synthesis',function(){
        expect(window.speechSynthesis).toBeTruthy()
    })

    it('playing audio',function(){
        var payload= {
            text: 'hello everyone',
            voice: 'woman'
        }

        this.recorder.speakText(payload,function(){
        })

        let synth= window.speechSynthesis
        synth.dispatchEvent(new Event('voiceschanged'))
       
        expect(this.recorder.speechSynthesisCounterPrevious).toBe(0)
        expect(this.recorder.speechSynthesisCounter).toBe(1)
        expect(window.speechSynthesisInstances).not.toBeNull()
        expect(window.speechSynthesisInstances).toBeTruthy()
        expect(window.speechSynthesisInstances).toBe(1)
    
    })
})