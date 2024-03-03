
//call the wled json api
function wledRequest(onoff, brightness, ledarray) {
    const wledcontroller = document.getElementById("wledserver").value
    const request = { on: onoff, bri: `${brightness}`, seg: { i: ledarray } }
    try {
        const response = fetch(`${wledcontroller}/json`, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request)
        });
    } catch (error) {
        console.error(error)
    }
}

//paint picute colmunwise and send data to wled json api
function paintonWled(context, imgdata, brightness, time, startdelay, reverse = false, Callback) {
    var width = 0;
    const pc = canvasPainter(context);
    setTimeout(() => {
        var delay = setInterval(() => {
            ledarray = []
            paintColnum(imgdata, pixelSize, width, function (r, g, b, x, y) {
                ledarray.push(`${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`)
                pc(r, g, b, x, y)
            });

            if (reverse === true) {
                wledRequest(true, brightness, ledarray.reverse())
            } else {
                wledRequest(true, brightness, ledarray)
            }

            width++;
            if (width >= imgdata.width) {
                wledRequest(false, "", [])
                clearInterval(delay)
                Callback()
            }
        }, time)
    }, startdelay * 1000)
}


function canvasPainter(context) {
    return function (r, g, b, x, y) {
        context.fillStyle = `rgba(${r} ${g} ${b})`;
        context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    }
}

function paintScaledImage(context, imgdata, pixelSize) {
    for (width = 0; width < imgdata.width; width++) {
        paintColnum(imgdata, pixelSize, width, canvasPainter(context))
    }
}

function paintColnum(imgdata, pixelSize, colnum, paintfunction) {
    for (height = 0; height < imgdata.height; height++) {
        index = (colnum + height * imgdata.width) * 4
        paintfunction(imagedata.data[index], imagedata.data[index + 1], imagedata.data[index + 2], colnum, height)
    }
}

function setCanvaseSize(canvasElement, image, scaleFactor) {
    canvasElement.height = scaleFactor
    canvasElement.width = scaleFactor * image.width / image.height
}

function resizeImgetoCanvas(image, ledHight) {
    var canvas = document.createElement('canvas')
    canvas.height = ledHight
    canvas.width = ledHight * image.width / image.height
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return context.getImageData(0, 0, canvas.width, canvas.height)
}

function loadImage(e) {
    var file = e.target.files[0]
    document.getElementById("filename").textContent = e.target.files[0].name
    var reader = new FileReader()
    reader.onload = function (e) {
        img.src = e.target.result
    };
    reader.readAsDataURL(file)
}

function startWledProjection(e) {
    startDelay = document.getElementById("startdelay").value
    direction = document.getElementById("direction").value
    speed = document.getElementById("speed").value
    brightness = document.getElementById("brightness").value

    wledcontrolls.hidden = true;
    previewContext.fillStyle = `rgba(0 0 0)`
    previewContext.fillRect(0, 0, previewElement.width, previewElement.height)
    paintonWled(previewContext, imagedata, brightness, speed, startDelay, direction, () => {
        previewElement.hidden = false
        wledcontrolls.hidden = false
    })
}

function loader() {
    pixelSize = Math.floor(480 / document.getElementById("ledCount").value)
    setCanvaseSize(previewElement, img, pixelSize * document.getElementById("ledCount").value)
    imagedata = resizeImgetoCanvas(img, document.getElementById("ledCount").value)
    paintScaledImage(previewContext, imagedata, pixelSize)
    previewElement.hidden = false
    wledcontrolls.hidden = false
    setRunDetails()
    setBrightness()
}

function setRunDetails() {
    speed = document.getElementById("speed").value / 1000
    realwidht = (document.getElementById("ledLenght").value / imagedata.height * imagedata.width).toFixed(2)
    realhight = document.getElementById("ledLenght").value
    document.getElementById("infopic").textContent = `Picture size  ${imagedata.height}LED x ${imagedata.width}LED or ${realhight}cm x ${realwidht}cm.`
    document.getElementById("inforun").textContent = `With ${speed.toFixed(2)} s per colnum it will runs ${(imagedata.width * speed).toFixed(2)} s for whole picture`
}

function setBrightness() {
    document.getElementById("bright").textContent = document.getElementById("brightness").value
}

function savesetup() {
    const setup = {
        wledserver: document.getElementById("wledserver").value,
        ledCount: document.getElementById("ledCount").value,
        ledLenght: document.getElementById("ledLenght").value,
        direction: document.getElementById("direction").checked,
        startdelay: document.getElementById("startdelay").value
    }
    document.cookie = "wledsetup=" + JSON.stringify(setup) + ";expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;SameSite=Lax"
    loader()
}

const previewElement = document.getElementById('preview')
const previewContext = previewElement.getContext('2d')
const loadbutton = document.getElementById('imageInput')
const wledcontrolls = document.getElementById('wledcontrolls')
const wledsetupdialog = document.getElementById("wledsetupdialog")
var img = new Image()


wledcontrolls.hidden = false
previewElement.hidden = false

loadbutton.addEventListener('change', loadImage)
document.getElementById('run').addEventListener('click', startWledProjection)
document.getElementById("speed").oninput = setRunDetails
document.getElementById("brightness").oninput = setBrightness
//Handle loading Image.
img.onload = function () {
    loader()
}

//Dialog with elements
document.getElementById("wledsetup").addEventListener('click', () => { wledsetupdialog.showModal() })
document.getElementById("wledsetupclose").addEventListener('click', () => { savesetup(); wledsetupdialog.close() })
document.getElementById("direction").addEventListener('click', (event) => {
    if (event.target.checked) {
        document.getElementById("directionstate").textContent = "WLED Controller top"
    } else {
        document.getElementById("directionstate").textContent = "LED Controller bottom"
    }
})

//Set configuration at start
addEventListener('load', () => {
    let setup = {
        wledserver: "http://wled",
        ledCount: "60",
        ledLenght: "100",
        direction: false,
        startdelay: 0
    }
    if (document.cookie.startsWith('wledsetup')) {
        setup = JSON.parse(document.cookie.split('=')[1])
    }
    document.getElementById("wledserver").value = setup.wledserver
    document.getElementById("ledCount").value = setup.ledCount
    document.getElementById("ledLenght").value = setup.ledLenght
    document.getElementById("direction").checked = setup.direction
    document.getElementById("startdelay").value = setup.startdelay

    document.getElementById("filename").textContent = "wledpainter.png"
    img.src = "wledpainter.png"
})