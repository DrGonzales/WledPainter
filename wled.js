
function wledRequest(onoff, brightness, ledarray) {
    const request = { on: onoff, bri: "50", seg: { i: ledarray } }
    console.dir(request);
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

function paintonWled(context, imgdata, time, startdelay, reverse = false) {
    var width = 0;
    const pc = canvasPainter(context);
    var delay = setInterval(() => setTimeout(()=>
        {
        ledarray = []
        paintColnum(imgdata, pixelSize, width, function (r, g, b, x, y) {
            ledarray.push(`${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
            pc(r, g, b, x, y);
        });

        if (reverse === true) {
            wledRequest(true, "", ledarray.reverse());
        } else {
            wledRequest(true, "", ledarray);
        }

        width++;
        if (width == imgdata.width) {
            wledRequest(false, "", []);
            clearInterval(delay);
        }
    }, startdelay), time);
}

function canvasPainter(context) {
    return function (r, g, b, x, y) {
        context.fillStyle = `rgba(${r} ${g} ${b})`;
        context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
}

function paintScaledImage(context, imgdata, pixelSize) {
    for (width = 0; width < imgdata.width; width++) {
        paintColnum(imgdata, pixelSize, width, canvasPainter(context))
    }
}

function paintColnum(imgdata, pixelSize, colnum, paintfunction) {
    for (height = 0; height < imgdata.height; height++) {
        index = (colnum + height * imgdata.width) * 4;
        paintfunction(imagedata.data[index], imagedata.data[index + 1], imagedata.data[index + 2], colnum, height)
    }
}

function setCanvaseSize(canvasElement, image, scaleFactor) {
    canvasElement.height = scaleFactor;
    canvasElement.width = scaleFactor * image.width / image.height;
}

function resizeImgetoCanvas(image, ledHight) {
    var canvas = document.createElement('canvas');
    canvas.height = ledHight;
    canvas.width = ledHight * image.width / image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height);
}

function loadImage(e) {
    var file = e.target.files[0];
    console.log(file)
    var reader = new FileReader();
    reader.onload = function (e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function startWledProjection(e) {
    wledcontrols.hidden = true;
    previewContext.fillStyle = `rgba(0 0 0)`;
    previewContext.fillRect(0, 0, previewElement.width, previewElement.height);
    paintonWled(previewContext, imagedata, 100, 0, false); // Todo - Callback zum Anzeigen und Stoppen der Buttons
}

const pixelSize = 8;
//Count of leds
const ledHight = 60;

const scaleFactor = pixelSize * ledHight;
const previewElement = document.getElementById('preview');
const previewContext = previewElement.getContext('2d');
const loadbutton = document.getElementById('imageInput');
const wledcontrols = document.getElementById('wledcontrols');

wledcontrols.hidden = false;
previewElement.hidden = false;
var img = new Image();
loadbutton.addEventListener('change', loadImage);
document.getElementById('run').addEventListener('click', startWledProjection);

img.onload = function () {
    setCanvaseSize(previewElement, img, scaleFactor);
    imagedata = resizeImgetoCanvas(img, ledHight);
    paintScaledImage(previewContext, imagedata, pixelSize);
    previewElement.hidden = false;
    wledcontrols.hidden = false;
};

//Default picture
img.src = "wledpainter.png";

