let canvas, context
let sourceNodeMic, micStream
let sourceNodeAudio, audio
let analyserNode, dataArray
let gainNode
let oa = 0,
  ob = 0
const audioContext = new AudioContext()
const freq = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

const connectMic = () => {
  // マイクからの入力を開始
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false,
    })
    .then((stream) => {
      // 接続成功
      document.getElementById("status").className = "green"
      document.getElementById("status").innerHTML = "接続"
      document.getElementById("connect").disabled = true
      document.getElementById("disconnect").disabled = false
      // マイク用Sourceノードの作成
      micStream = stream
      sourceNodeMic = audioContext.createMediaStreamSource(micStream)
      sourceNodeMic.connect(analyserNode)
      audioContext.resume()
    })
    .catch((error) => {
      // 接続失敗、エラーを表示
      document.getElementById("status").className = "red"
      document.getElementById("status").innerHTML = error.name
    })
}

const disconnectMic = () => {
  // 切断
  micStream.getAudioTracks()[0].stop()
  document.getElementById("status").innerHTML = "切断"
  document.getElementById("connect").disabled = false
  document.getElementById("disconnect").disabled = true
}

const loadAudio = (files) => {
  // 選択したファイルをオーディオにセット
  audio.src = URL.createObjectURL(files[0])
  audioContext.resume()
}

const setVolume = () => {
  // ボリュームの変更
  const mic = document.getElementById("mic").value
  gainNode.gain.setValueAtTime(mic, audioContext.currentTime)
  document.getElementById("micText").innerHTML = `[${mic}]`
}

const analyze = () => {
  // 棒グラフを描画
  context.clearRect(0, 0, canvas.width, canvas.height)
  analyserNode.getByteFrequencyData(dataArray)
  const d = audioContext.sampleRate / analyserNode.fftSize
  const w = canvas.width / freq.length
  let color,
    a = 0,
    b = 0
  for (let i = 0; i < freq.length; i++) {
    const index = Math.round(freq[i] / d)
    const h = dataArray[index]
    const x = i * w + w * 0.3
    const y = canvas.height - h
    color = "#3399CC"
    if (i == 2 || i == 3) {
      // 125Hz, 250Hz
      color = "#FF9933"
      a += h
    } else if (i == 4 || i == 5) {
      // 500Hz, 1000Hz
      color = "#FF33FF"
      b += h
    }
    drawRect(x, y, w * 0.4, h, color)
  }
  // 顔、耳を描画
  drawRect(220, 50, 200, 160)
  drawRect(190, 100, 30, 60)
  drawRect(420, 100, 30, 60)
  // 目、口を描画
  const t = document.getElementById("t").value
  color = "#009900"
  if (a > t && b > t) color = "#FF0000"
  drawRect(270, 100, 20, 20, color)
  drawRect(350, 100, 20, 20, color)
  let [mw, mh] = [50, 10]
  if (a > t) {
    mw = 70
    if (a > oa) mw = 80
  }
  if (b > t) {
    mh = 30
    if (b > ob) mh = 50
  }
  drawRect(320 - mw / 2, 150, mw, mh, "#000000")
  ;[oa, ob] = [a, b]
  // 数値を表示
  context.fillStyle = "#FF9933"
  context.fillText("125Hz+250Hz", 10, 30)
  context.fillText(`: ${a}`, 90, 30)
  context.fillStyle = "#FF33FF"
  context.fillText("500Hz+1000Hz", 10, 50)
  context.fillText(`: ${b}`, 90, 50)
}

const drawRect = (x, y, w, h, color = "#3399CC") => {
  // 縁取り＋塗りつぶし矩形の描画
  context.fillStyle = color
  context.fillRect(x, y, w, h)
  context.lineWidth = 4
  context.strokeStyle = "#FFFFFF"
  context.strokeRect(x, y, w, h)
}

const init = () => {
  // 获得canvas和其context
  canvas = document.getElementById("visualizer")
  context = canvas.getContext("2d")

  // audio的sourceNode
  audio = document.getElementById("audio")
  sourceNodeAudio = audioContext.createMediaElementSource(audio)

  // analyserNode
  analyserNode = audioContext.createAnalyser()
  analyserNode.fftSize = 2048
  dataArray = new Uint8Array(analyserNode.frequencyBinCount)

  // gainNode, 音量初始化
  gainNode = audioContext.createGain()
  setVolume()

  // 将上述node连接
  sourceNodeAudio.connect(analyserNode)
  analyserNode.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // disable “断开” 按钮
  document.getElementById("disconnect").disabled = true

  // 开始解析
  setInterval(analyze, 100)
}
