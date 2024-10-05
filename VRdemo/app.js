const URL = "./";
let model, webcam, ctx, labelContainer, maxPredictions;

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const size = 200;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    const canvas = document.getElementById("canvas");
    canvas.width = size; canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
    // finally draw the poses
    drawPose(pose);

    const leftProbability = prediction.find(p => p.className === "left").probability;
    const rightProbability = prediction.find(p => p.className === "right").probability;
    const walkProbability = prediction.find(p => p.className === "Walk").probability;

    // ควบคุมการเคลื่อนที่ของกล้อง
    const camera = document.querySelector('[camera]');
    const currentPosition = camera.getAttribute('position');

    if (leftProbability > 0.5) {
        camera.setAttribute('position', {
            x: currentPosition.x - 0.1,
            y: currentPosition.y,
            z: currentPosition.z
        });
    }
    if (rightProbability > 0.5) {
        camera.setAttribute('position', {
            x: currentPosition.x + 0.1,
            y: currentPosition.y,
            z: currentPosition.z
        });
    }
    if (walkProbability > 0.5) {
        camera.setAttribute('position', {
            x: currentPosition.x,
            y: currentPosition.y,
            z: currentPosition.z - 0.1
        });
    }


}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}


