// Audio Reverse Application
class AudioReverseApp {
    constructor() {
        // DOM Elements
        this.recordButton = document.getElementById('recordButton');
        this.playButton = document.getElementById('playButton');
        this.reverseButton = document.getElementById('reverseButton');
        this.menuButton = document.getElementById('menuButton');
        this.closeMenuButton = document.getElementById('closeMenuButton');
        this.menuOverlay = document.getElementById('menuOverlay');
        this.loopToggle = document.getElementById('loopToggle');
        this.speedControl = document.getElementById('speedControl');
        this.pitchControl = document.getElementById('pitchControl');
        this.echoControl = document.getElementById('echoControl');
        this.bassControl = document.getElementById('bassControl');
        this.speedValue = document.getElementById('speedValue');
        this.pitchValue = document.getElementById('pitchValue');
        this.echoValue = document.getElementById('echoValue');
        this.bassValue = document.getElementById('bassValue');
        this.permissionPopup = document.getElementById('permissionPopup');
        this.grantPermissionBtn = document.getElementById('grantPermissionBtn');

        // Audio properties
        this.mediaRecorder = null;
        this.recordedStream = null;
        this.audioChunks = [];
        this.audioBuffer = null;
        this.audioContext = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.delayNode = null;
        this.bassFilter = null;
        this.isPlaying = false;
        this.isRecording = false;
        this.isReversed = false;
        this.microphoneAccessGranted = false;

        // Initialize
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSpeedDisplay();
        this.updatePitchDisplay();
        // Show popup by default, check permission only when button is clicked
        this.permissionPopup.classList.remove('hidden');
    }

    setupEventListeners() {
        // Block context menu on desktop
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Click outside menu to close
        this.menuOverlay.addEventListener('click', (e) => {
            if (e.target === this.menuOverlay) {
                this.closeMenu();
            }
        });

        // Record button - toggle recording, stop playback if playing
        this.recordButton.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stopPlayback();
            }
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });

        // Play button - toggle normal playback
        this.playButton.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
                this.playNormal();
            } else if (this.isReversed) {
                this.stopPlayback();
                this.playNormal();
            } else if (this.isPlaying && !this.isReversed) {
                this.stopPlayback();
            } else {
                this.playNormal();
            }
        });

        // Reverse button - toggle reverse playback
        this.reverseButton.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
                this.playReversed();
            } else if (this.isPlaying && !this.isReversed) {
                this.stopPlayback();
                this.playReversed();
            } else if (this.isReversed) {
                this.stopPlayback();
            } else {
                this.playReversed();
            }
        });

        // Menu buttons
        this.menuButton.addEventListener('click', () => {
            this.openMenu();
        });

        this.closeMenuButton.addEventListener('click', () => {
            this.closeMenu();
        });

        // Settings controls
        this.speedControl.addEventListener('input', () => {
            this.updateSpeedDisplay();
        });

        this.pitchControl.addEventListener('input', () => {
            this.updatePitchDisplay();
        });

        this.echoControl.addEventListener('input', () => {
            this.updateEchoDisplay();
        });

        this.bassControl.addEventListener('input', () => {
            this.updateBassDisplay();
        });

        // Permission popup
        this.grantPermissionBtn.addEventListener('click', () => {
            this.requestMicrophonePermission();
        });
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            this.microphoneAccessGranted = true;
            this.permissionPopup.classList.add('hidden');
        } catch (err) {
            console.error('Microphone permission denied:', err);
            alert('Microphone access is required for this app to work. Please allow access in your browser settings.');
        }
    }

    async startRecording() {
        if (!this.microphoneAccessGranted) {
            this.permissionPopup.classList.remove('hidden');
            return;
        }

        try {
            this.recordButton.innerHTML = '<span class="btn-icon">⏹️</span><span class="btn-text">Stop Recording</span>';
            this.recordButton.classList.add('recording', 'active');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.recordedStream = stream;
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                // Stop all tracks
                if (this.recordedStream) {
                    this.recordedStream.getTracks().forEach(track => track.stop());
                    this.recordedStream = null;
                }
                
                // Process the recorded audio
                if (this.audioChunks.length > 0) {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    const arrayBuffer = await audioBlob.arrayBuffer();

                    try {
                        if (!this.audioContext) {
                            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        }

                        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    } catch (error) {
                        console.error('Error decoding audio:', error);
                    }
                }
            };

            this.mediaRecorder.start();
            this.isRecording = true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.resetRecordingState();
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            const tracks = this.mediaRecorder.stream.getTracks();
            tracks.forEach(track => track.stop());
            this.isRecording = false;
            this.resetRecordingState();
        }
    }

    resetRecordingState() {
        this.recordButton.innerHTML = '<span class="btn-icon">🔴</span><span class="btn-text">Start Recording</span>';
        this.recordButton.classList.remove('recording', 'active');
    }

    async processAudio() {
        if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            try {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.error('Error decoding audio:', error);
            }
        }
    }

    async playNormal() {
        if (!this.audioBuffer) {
            return;
        }

        // Stop any current playback
        this.stopPlayback();

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Resume audio context if suspended (mobile browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create gain node for proper audio output
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 1.0;
            this.gainNode.connect(this.audioContext.destination);

            // Create delay/echo effect
            const echoAmount = parseFloat(this.echoControl.value);
            if (echoAmount > 0) {
                this.delayNode = this.audioContext.createDelay();
                this.delayNode.delayTime.value = 0.3; // 300ms delay
                const delayGain = this.audioContext.createGain();
                delayGain.gain.value = echoAmount;
                this.delayNode.connect(delayGain);
                delayGain.connect(this.audioContext.destination);
            }

            // Create bass boost filter
            const bassAmount = parseInt(this.bassControl.value);
            if (bassAmount > 0) {
                this.bassFilter = this.audioContext.createBiquadFilter();
                this.bassFilter.type = 'lowshelf';
                this.bassFilter.frequency.value = 200; // 200Hz
                this.bassFilter.gain.value = bassAmount * 5; // 0-50dB boost
            }

            // Build audio chain: source -> bass -> gain -> destination
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;

            // Apply playback rate
            const playbackRate = parseFloat(this.speedControl.value);
            this.sourceNode.playbackRate.value = playbackRate;

            // Apply detune for pitch shifting (in cents)
            const pitchShift = parseInt(this.pitchControl.value) * 100;
            this.sourceNode.detune.value = pitchShift;

            // Connect nodes
            if (this.bassFilter) {
                this.sourceNode.connect(this.bassFilter);
                this.bassFilter.connect(this.gainNode);
            } else {
                this.sourceNode.connect(this.gainNode);
            }
            this.gainNode.connect(this.audioContext.destination);

            // Connect echo
            if (this.delayNode) {
                this.sourceNode.connect(this.delayNode);
            }

            // Handle looping
            this.sourceNode.loop = this.loopToggle.checked;

            this.sourceNode.onended = () => {
                if (this.sourceNode && !this.sourceNode.loop) {
                    this.stopPlayback();
                }
            };

            this.sourceNode.start();

            this.isPlaying = true;
            this.isReversed = false;

            // Update button states
            this.playButton.innerHTML = '<span class="btn-icon">⏹️</span><span class="btn-text">Stop Playing</span>';
            this.playButton.classList.add('active');
            this.reverseButton.innerHTML = '<span class="btn-icon">◀️</span><span class="btn-text">Play Reverse</span>';
            this.reverseButton.classList.remove('active');


        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    async playReversed() {
        if (!this.audioBuffer) {
            return;
        }

        // Stop any current playback
        this.stopPlayback();

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Resume audio context if suspended (mobile browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create gain node for proper audio output
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 1.0;
            this.gainNode.connect(this.audioContext.destination);

            // Create delay/echo effect
            const echoAmount = parseFloat(this.echoControl.value);
            if (echoAmount > 0) {
                this.delayNode = this.audioContext.createDelay();
                this.delayNode.delayTime.value = 0.3; // 300ms delay
                const delayGain = this.audioContext.createGain();
                delayGain.gain.value = echoAmount;
                this.delayNode.connect(delayGain);
                delayGain.connect(this.audioContext.destination);
            }

            // Create bass boost filter
            const bassAmount = parseInt(this.bassControl.value);
            if (bassAmount > 0) {
                this.bassFilter = this.audioContext.createBiquadFilter();
                this.bassFilter.type = 'lowshelf';
                this.bassFilter.frequency.value = 200; // 200Hz
                this.bassFilter.gain.value = bassAmount * 5; // 0-50dB boost
            }

            // Create reversed buffer
            const reversedBuffer = this.reverseAudioBuffer(this.audioBuffer);

            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = reversedBuffer;

            // Apply playback rate
            const playbackRate = parseFloat(this.speedControl.value);
            this.sourceNode.playbackRate.value = playbackRate;

            // Apply detune for pitch shifting (in cents)
            const pitchShift = parseInt(this.pitchControl.value) * 100;
            this.sourceNode.detune.value = pitchShift;

            // Connect nodes
            if (this.bassFilter) {
                this.sourceNode.connect(this.bassFilter);
                this.bassFilter.connect(this.gainNode);
            } else {
                this.sourceNode.connect(this.gainNode);
            }
            this.gainNode.connect(this.audioContext.destination);

            // Connect echo
            if (this.delayNode) {
                this.sourceNode.connect(this.delayNode);
            }

            // Handle looping
            this.sourceNode.loop = this.loopToggle.checked;

            this.sourceNode.onended = () => {
                if (this.sourceNode && !this.sourceNode.loop) {
                    this.stopPlayback();
                }
            };

            this.sourceNode.start();

            this.isPlaying = true;
            this.isReversed = true;

            // Update button states
            this.playButton.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play Normal</span>';
            this.playButton.classList.remove('active');
            this.reverseButton.innerHTML = '<span class="btn-icon">⏹️</span><span class="btn-text">Stop Playing</span>';
            this.reverseButton.classList.add('active');


        } catch (error) {
            console.error('Error playing reversed audio:', error);
        }
    }

    reverseAudioBuffer(buffer) {
        // Create a new buffer with the same properties
        const reversedBuffer = this.audioContext.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        // Reverse each channel
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const originalData = buffer.getChannelData(channel);
            const reversedData = reversedBuffer.getChannelData(channel);
            
            // Copy and reverse the data
            for (let i = 0; i < buffer.length; i++) {
                reversedData[i] = originalData[buffer.length - i - 1];
            }
        }

        return reversedBuffer;
    }

    stopPlayback() {
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
            } catch (e) {
                // Already stopped
            }
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }

        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }

        if (this.delayNode) {
            this.delayNode.disconnect();
            this.delayNode = null;
        }

        if (this.bassFilter) {
            this.bassFilter.disconnect();
            this.bassFilter = null;
        }

        this.isPlaying = false;
        this.isReversed = false;

        // Update button states
        this.playButton.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play Normal</span>';
        this.playButton.classList.remove('active');
        this.reverseButton.innerHTML = '<span class="btn-icon">◀️</span><span class="btn-text">Play Reverse</span>';
        this.reverseButton.classList.remove('active');
    }

    openMenu() {
        this.menuOverlay.classList.remove('hidden');
    }

    closeMenu() {
        this.menuOverlay.classList.add('hidden');
    }

    updateSpeedDisplay() {
        const speed = this.speedControl.value;
        this.speedValue.textContent = `${speed}x`;
    }

    updatePitchDisplay() {
        const pitch = this.pitchControl.value;
        this.pitchValue.textContent = `${pitch > 0 ? '+' : ''}${pitch}`;
    }

    updateEchoDisplay() {
        const echo = Math.round(parseFloat(this.echoControl.value) * 100);
        this.echoValue.textContent = `${echo}%`;
    }

    updateBassDisplay() {
        const bass = this.bassControl.value;
        this.bassValue.textContent = `${bass}`;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AudioReverseApp();
});

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('ServiceWorker registered: ', registration);
            })
            .catch((error) => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}