
var recording, stream, paused = false, timer, defaultTitle = document.title
const $output = document.getElementById('voutput')
const $start = document.getElementById('vstart')
const $pause = document.getElementById('vpause')
const $stop = document.getElementById('vstop')
const $download = document.getElementById('vdownload')
const $timer = document.getElementById('vtimer')

$output.style.display = 'none'
$pause.style.display = 'none'
$stop.style.display = 'none'
$download.style.display = 'none'

$start.onclick = startCapturing
$pause.onclick = pauseCapturing
$stop.onclick = stopCapturing
$download.onclick = downloadRecording

if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
	$timer.innerHTML = 'Your browser does not support screen capture!'
	$start.disabled = true
}

function startScreenCapture() {
	return navigator.mediaDevices.getDisplayMedia({
		video: {
			width: window.innerWidth,
			height: window.innerHeight,
			frameRate: 30,
		},
		audio: true
	})
}

async function startCapturing() {
	window.URL.revokeObjectURL(recording)
	chunks = []
	stream = await startScreenCapture().catch(() => { })
	if (!stream) return
	$start.style.display = 'none'
	$pause.disabled = true
	$stop.disabled = true
	$output.style.display = 'none'
	$pause.style.display = 'inline-block'
	$stop.style.display = 'inline-block'
	$download.style.display = 'none'

	stream.addEventListener('inactive', stopCapturing)
	mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
	mediaRecorder.addEventListener('dataavailable', event => {
		if (event.data && event.data.size > 0) {
			chunks.push(event.data)
		}
	})
	timer = new Stopwatch(null, 1000, false)
	timer.setElapsed(null, null, parseInt(0))
	timer.setListener(timer => {
		$timer.innerHTML = 'Starting at: ' + timer.toString()
		document.title = `(-${timer.toString()}) ${defaultTitle}`
	})
	timer.start()
	$timer.innerHTML = 'Starting at: ' + timer.toString()
	document.title = `(-${timer.toString()}) ${defaultTitle}`

	setTimeout(() => {
		timer.stop()
		mediaRecorder.start(10)
		$pause.disabled = false
		$stop.disabled = false

		timer = new Stopwatch(null, 1000)
		timer.setListener(timer => {
			$timer.innerHTML = timer.toString()
			document.title = `(${timer.toString()}) ${defaultTitle}`
		})
		timer.start()
		$timer.innerHTML = timer.toString()
		document.title = `(${timer.toString()}) ${defaultTitle}`
	}, 0)
}

function pauseCapturing() {
	if (paused) {
        $pause.innerHTML = 'Pause';
		document.title = `(${timer.toString()}) ${defaultTitle}`
		mediaRecorder.resume()
		timer.start()
		paused = false
	} else {
        $pause.innerHTML = 'Play';
		document.title = `(⏸ ${timer.toString()}) ${defaultTitle}`
		mediaRecorder.pause()
		timer.stop()
		paused = true
	}
}

function stopCapturing() {
	$start.style.display = 'inline-block'
	$pause.style.display = 'none'
	$stop.style.display = 'none'
	$download.style.display = 'inline-block'
	$output.style.display = 'block'
	timer.stop()
	document.title = defaultTitle
    $pause.innerHTML = 'Pause';
	paused = false

	stream.removeEventListener('inactive', stopCapturing)
	mediaRecorder.stop()
	stream.getTracks().forEach(track => track.stop())
	stream = undefined
	const blob = new Blob(chunks, { type: 'video/webm' })
	ysFixWebmDuration(blob, timer.totalElapsed, blob => {
		recording = window.URL.createObjectURL(blob)
		$output.src = recording
	})
}

function downloadRecording() {
	const downloadLink = document.createElement('a')
	downloadLink.href = recording
	downloadLink.download = `screen-recording-${Date.now()}.webm`
	downloadLink.style.display = 'none'
	document.body.appendChild(downloadLink)
	downloadLink.click()
}
