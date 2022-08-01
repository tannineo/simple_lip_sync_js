// 最先载入图片
const downloadingImage = new Image()
downloadingImage.src = 'my-sprite.png'

let canvas, context
let isHFlip = false

const hflip = () => {
  isHFlip = !isHFlip
  console.log('hflip', { isHFlip })
}

const audioContext = new AudioContext()

// node 串联起来可以解析音频 README.md有音频流的走向
let sourceNodeMic, micStream
let sourceNodeAudio, audio
let analyserNode, dataArray
let gainNode

let oa = 0,
  ob = 0 // 之前的解析值 用来比较
const freq = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] // 图表显示用的几个频率

const drawRect = (x, y, w, h, color = '#3399CC', edgeColor = '#0024fa') => {
  // 带边框和填色的矩形
  context.fillStyle = color
  context.fillRect(x, y, w, h)
  context.lineWidth = 6
  context.strokeStyle = edgeColor
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.strokeRect(x, y, w, h)
}

const connectMic = () => {
  // 从麦克风输入
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false,
    })
    .then((stream) => {
      // 获得授权 启用成功
      document.getElementById('status').className = 'green'
      document.getElementById('status').innerHTML = '已连接'
      document.getElementById('connect').disabled = true
      document.getElementById('disconnect').disabled = false
      // 麦克风的sourceNode
      micStream = stream
      sourceNodeMic = audioContext.createMediaStreamSource(micStream)
      sourceNodeMic.connect(analyserNode)
      audioContext.resume()
    })
    .catch((error) => {
      // 启用失败 通常是用户未授权
      document.getElementById('status').className = 'red'
      document.getElementById('status').innerHTML = error.name
    })
}

const disconnectMic = () => {
  // 断开麦克风
  micStream.getAudioTracks()[0].stop()
  document.getElementById('status').innerHTML = '已断开'
  document.getElementById('connect').disabled = false
  document.getElementById('disconnect').disabled = true
}

const loadAudio = (files) => {
  // 设置音频文件
  audio.src = URL.createObjectURL(files[0])
  audioContext.resume()
}

const setVolume = () => {
  // 设置音量
  const micVolume = document.getElementById('mic').value
  gainNode.gain.setValueAtTime(micVolume, audioContext.currentTime)
  document.getElementById('micText').innerHTML = `[${micVolume}]`
}

const analyze = () => {
  // 清空canvas 重新绘制
  context.clearRect(0, 0, canvas.width, canvas.height)

  // 用image作背景
  context.drawImage(downloadingImage, 180, 50, 256, 256)

  // 画线段图
  analyserNode.getByteFrequencyData(dataArray)
  const d = audioContext.sampleRate / analyserNode.fftSize
  const w = canvas.width / freq.length
  let color,
    a = 0,
    b = 0
  for (let i = 0; i < freq.length; i++) {
    const index = Math.round(freq[i] / d)
    const h = dataArray[index] * 0.5
    const x = i * w + w * 0.3
    const y = canvas.height - h
    color = '#3399CC'
    if (i == 2 || i == 3) {
      // 125Hz, 250Hz
      color = '#FF9933'
      a += h
    } else if (i == 4 || i == 5) {
      // 500Hz, 1000Hz
      color = '#FF33FF'
      b += h
    }
    drawRect(x, y, w * 0.4, h, color)
  }

  // 画机器人
  // 头和耳朵轮廓 三个矩形
  // drawRect(220, 50, 200, 160)
  // drawRect(190, 100, 30, 60)
  // drawRect(420, 100, 30, 60)

  // 眼睛和嘴巴 三个矩形
  const t = document.getElementById('t').value

  // color = '#009900'
  // if (a > t && b > t) color = '#FF0000'
  // drawRect(270, 100, 20, 20, color)
  // drawRect(350, 100, 20, 20, color)

  let [mw, mh] = [60, 4]
  // if (a > t) {
  //   mw = 70
  //   if (a > oa) mw = 80
  // }

  if (b > t) {
    mh = 10
    if (b > ob) mh = 20
  }
  drawRect(319 - mw / 2, 222, mw, mh, '#dd5566')

  // 记录a he b的值用于下一次比较
  ;[oa, ob] = [a, b]

  // 显示数值
  context.fillStyle = '#FF9933'
  context.fillText('125Hz+250Hz', 10, 30)
  context.fillText(`: ${a}`, 90, 30)
  context.fillStyle = '#FF33FF'
  context.fillText('500Hz+1000Hz', 10, 50)
  context.fillText(`: ${b}`, 90, 50)

  // 水平翻转
  if (isHFlip) {
    context.scale(-1, 1)
  } else {
    context.scale(1, 1)
  }
}

const init = () => {
  // 获得canvas和其context
  canvas = document.getElementById('visualizer')
  context = canvas.getContext('2d')

  // audio的sourceNode
  audio = document.getElementById('audio')
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
  gainNode.connect(audioContext.destination) // 监听

  // disable “断开” 按钮
  document.getElementById('disconnect').disabled = true

  // 开始解析
  setInterval(analyze, 100)
}
