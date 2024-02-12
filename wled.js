
//call the wled json api
function wledRequest(onoff, brightness, ledarray) {
    const request = { on: onoff, bri: `${brightness}`, seg: { i: ledarray } }
    try {
        const response = fetch('http://192.168.64.42/json', {
            method: "POST",
            mode: "cors",
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
function paintonWled(context, imgdata, time, startdelay, reverse = false, Callback) {
    var width = 0;
    const pc = canvasPainter(context);
    var delay = setInterval(() => setTimeout(() => {
        ledarray = []
        paintColnum(imgdata, pixelSize, width, function (r, g, b, x, y) {
            ledarray.push(`${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`)
            pc(r, g, b, x, y)
        });

        if (reverse === true) {
            wledRequest(true, "", ledarray.reverse())
        } else {
            wledRequest(true, "", ledarray)
        }

        width++;
        if (width == imgdata.width) {
            wledRequest(false, "", [])
            clearInterval(delay)
            Callback()
        }
    }, startdelay), time)
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
    var reader = new FileReader()
    reader.onload = function (e) {
        img.src = e.target.result
    };
    reader.readAsDataURL(file)
}

function startWledProjection(e) {
    startDelay = document.getElementById("startdelay").value
    direction = document.getElementById("direction").value
    brightness = 100;
    wledcontrols.hidden = true;
    previewContext.fillStyle = `rgba(0 0 0)`
    previewContext.fillRect(0, 0, previewElement.width, previewElement.height)
    paintonWled(previewContext, imagedata, brightness, startDelay, direction, () => {
        previewElement.hidden = false
        wledcontrols.hidden = false
    })
}

function loader() {
    pixelSize = Math.floor(480 / document.getElementById("ledCount").value)
    setCanvaseSize(previewElement, img, pixelSize * document.getElementById("ledCount").value)
    imagedata = resizeImgetoCanvas(img, document.getElementById("ledCount").value)
    paintScaledImage(previewContext, imagedata, pixelSize)
    previewElement.hidden = false
    wledcontrols.hidden = false
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
const wledcontrols = document.getElementById('wledcontrols')
const wledsetupdialog = document.getElementById("wledsetupdialog")
var img = new Image()

wledcontrols.hidden = false
previewElement.hidden = false

loadbutton.addEventListener('change', loadImage)
document.getElementById('run').addEventListener('click', startWledProjection)

//Handle loading Image.
img.onload = function () {
    loader()
}

//Dialog with elements
document.getElementById("wledsetup").addEventListener('click', () => { wledsetupdialog.showModal() })
document.getElementById("wledsetupclose").addEventListener('click', () => { savesetup(); wledsetupdialog.close() })
document.getElementById("direction").addEventListener('click', (event) => {
    if (event.target.checked) {
        document.getElementById("directionstate").textContent = "downwards"
    } else {
        document.getElementById("directionstate").textContent = "upwards"
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
    img.src = "wledpainter.png"
})