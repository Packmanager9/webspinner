let worldnode = {}
window.addEventListener('DOMContentLoaded', (event) => {
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            // canvas_context.stroke()
            // canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
            this.origin = this.clone()
            this.marked = 0
            this.link = new LineOP(this, this.origin)
        }

        clone(){
            if(this.xmom != 1){
                let circ = new Circle(this.x, this.y, this.radius, this.color, 1)
                circ.clonex =1
                return circ
            }
            return this
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            if(this.rooted != 1){
                this.x -= this.xmom
                this.y -= this.ymom
            }else{
                this.xmom = 0
                this.ymom = 0
            }
        }
        frictiveMove() {
            if(this.marked == 1){

            }else{
                if(this.link.hypotenuse()<12000){
                    if(!sproinger.marked.includes(this)){
                        if(this.marked3 !== 1){
                        this.xmom += (this.origin.x-this.x)/18
                        this.ymom += (this.origin.y-this.y)/18
                        }
                    }else{

                // this.xmom -= (this.origin.x-this.x)/4
                // this.ymom -= (this.origin.y-this.y)/4
                    }
                }
            // this.xmom += (this.origin.x-this.x)/10
            // this.ymom += (this.origin.y-this.y)/10
            }
            if(keysPressed['g']){
                if(this.marked == 1){

                }else{
                    if(this.link.hypotenuse()<50){
                        this.xmom += (this.origin.x-this.x)/4
                        this.ymom += (this.origin.y-this.y)/4
                    }
                }
            }
            if(this.marked3 == 1){
                this.ymom+=1
            }
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            if(this.rooted != 1){
                this.x += this.xmom
                this.y += this.ymom
            }else{
                this.xmom = 0
                this.ymom = 0
            }
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        isMouseInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                this.color = "white"
                if(dregger == 0){
                    if(sproinger.marked.length == 0){

                    worldnode = this
                    worldnode.friction = .9998
                    }else{
                        worldnode = {}
                    }
                }
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        doesBugTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    this.shapes[t].from.xmom += point.xmom
                    this.shapes[t].to.xmom += point.xmom
                    this.shapes[t].from.ymom += point.ymom
                    this.shapes[t].to.ymom += point.ymom
                    return true
                }
            }
            return false
        }
        doesMouseTouch() {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isMouseInside(TIP_engine)) {
                    return true
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        push(object) {
            this.shapes.push(object)
        }
    }
    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }
    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            this.springs.push(this.spring)
            for (let k = 0; k < members; k++) {
                this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
                if (k < members - 1) {
                    this.springs.push(this.spring)
                } else {
                    this.spring.anchor = this.pin
                    this.springs.push(this.spring)
                }
            }
            this.forceConstant = force
            this.centroid = new Point(0, 0)
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.springs.length; t++) {
                this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            for (let s = this.springs.length - 1; s >= 0; s--) {
                this.springs[s].balance()
            }
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            for (let s = 0; s < this.springs.length; s++) {
                this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
                if (this.link.hypotenuse() != 0) {
                    this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].move()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 17)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            let circ = new Circle(TIP_engine.x, TIP_engine.y, 10, "red")
            // circ.draw()
            sproinger.marked = []
            dregger = 0
            dregger = 1
            if(!keysPressed[' ']){
                for(let t = 0;t<sproinger.bodies.length;t++){
                    if(circ.doesPerimeterTouch(sproinger.bodies[t])){
                        sproinger.marked.push(sproinger.bodies[t])
                        // sproinger.bodies[t].marked = 1
                        sproinger.bodies[t].marked3 = 1
                    }
                }
            }else{
            for(let t = 0;t<sproinger.bodies.length;t++){
                if(circ.doesPerimeterTouch(sproinger.bodies[t])){
                    sproinger.marked2.push(sproinger.bodies[t])
                    // sproinger.bodies[t].marked = 1
                        sproinger.bodies[t].marked3 = 1
                }
            }
            }

            if(start.isPointInside(TIP_engine)){

            if(bugs.length == 0){
                let length = 0
                for(let t =0;t<sproinger.links.length;t++){
                    length+=(sproinger.links[t].beam.hypotenuse())+50
                }

                mimsma.aminos-=length
                bugs = []
                for(let t = 0;t<10;t++){
                let bug = new Bug()
                bugs.push(bug)
                }
            }else{
                for(let f = 0;f<bugs.length;f++){
                for(let k = 0;k<bugs.length;k++){
                for(let t = 0;t<bugs.length;t++){
                    if(bugs[t].wet !== 0){
                        mimsma.aminos += (bugs[t].speed * bugs[t].body.radius)*6
                        bugs.splice(t,1)
                    }
                }
            }
        }

                for(let t = 0;t<bugs.length;t++){
                    bugs[t].body.xmom += Math.random()-.5
                    bugs[t].body.ymom += Math.random()-.5
                    bugs[t].body.xmom*=10
                    bugs[t].body.ymom*=10
                    bugs[t].body.reflect = 0
                }
                bugs = []

                sproinger.links = []
                sproinger.bodies.splice(32, sproinger.bodies.length)
                let linker = new SpringOP(sproinger.bodies[0], sproinger.bodies[16],18)
                sproinger.bodies[0].touches.push(16)
                sproinger.bodies[16].touches.push(0)
                sproinger.links.push(linker)
            }
            }


            if(sproinger.marked.length == 0){

                if(typeof worldnode.radius == "number"){
                    if(!sproinger.bodies.includes(worldnode)){
    
                        worldnode.draw()
                        worldnode.bigbody = new Circle(worldnode.x, worldnode.y, 5, getRandomColor()) //(this.space*1)
                        worldnode.superbigbody = new Circle(worldnode.x, worldnode.y, worldnode.space*10, getRandomColor())
                        worldnode.touches = []
                        worldnode.bumped = 0
                        worldnode.marked3 = 1
                        for(let t = 0;t<sproinger.links.length;t++){
                            if((sproinger.bodies[sproinger.bodies.indexOf(sproinger.links[t].anchor)] == worldnode.from && sproinger.bodies[sproinger.bodies.indexOf(sproinger.links[t].body)] == worldnode.to) || (sproinger.bodies[sproinger.bodies.indexOf(sproinger.links[t].body)] == worldnode.from && sproinger.bodies[sproinger.bodies.indexOf(sproinger.links[t].anchor)] == worldnode.to)){
                                if(mimsma.amsto > 0){
                                // if(!worldnode.touches.includes(sproinger.bodies.indexOf(sproinger.links[t].anchor))){
                                //     if(!worldnode.touches.includes(sproinger.bodies.indexOf(sproinger.links[t].body))){
                                    worldnode.touches.push(sproinger.bodies.indexOf(sproinger.links[t].anchor))
                                    worldnode.touches.push(sproinger.bodies.indexOf(sproinger.links[t].body))
            
                                    // console.log( (new LineOP(worldnode,  worldnode.to)).hypotenuse()/3)
                                    // let link = new LineOP(worldnode, sproinger.bodies[worldnode.from])
                                    let linker = new SpringOP(worldnode, worldnode.from, 10)
                                    sproinger.links.push(linker)
                                    //  link = new LineOP(worldnode, sproinger.bodies[worldnode.to])
                                     linker = new SpringOP(worldnode,  worldnode.to,10)
                                    sproinger.links.push(linker)
                                    sproinger.links.splice(t,1)
                                    sproinger.bodies.push(worldnode)
                                    sproinger.marked.push(worldnode)
                                    break
                                    //     }
                                    // }
                                }
                            }
                        }
    
                    }
                }
            }

            // example usage: if(object.isPointInside(TIP_engine)){ take action }
            window.addEventListener('pointermove', continued_stimuli);
        });
        window.addEventListener('pointermove', continued_stimuli);
        window.addEventListener('pointerup', e => {
            // if(typeof worldnode.radius == "number"){
            // worldnode.bigbody = new Circle(worldnode.x, worldnode.y, 5, getRandomColor()) //(this.space*1)
            // worldnode.superbigbody = new Circle(worldnode.x, worldnode.y, worldnode.space*10, getRandomColor())
            // worldnode.touches = []
            // worldnode.bumped = 0
            // sproinger.bodies.push(worldnode)
            // sproinger.marked.push(worldnode)
            // }
            // sproinger.marked = []
            // dregger = 0

            // if(typeof worldnode.radius == "number"){
            //     if(!sproinger.bodies.includes(worldnode)){

            //         worldnode.draw()
            //         worldnode.bigbody = new Circle(worldnode.x, worldnode.y, 5, getRandomColor()) //(this.space*1)
            //         worldnode.superbigbody = new Circle(worldnode.x, worldnode.y, worldnode.space*10, getRandomColor())
            //         worldnode.touches = []
            //         worldnode.bumped = 0
            //         worldnode.marked3 = 1
            //         for(let t = 0;t<sproinger.links.length;t++){
            //             if((sproinger.bodies[sproinger.bodies.indexOf(sproinger.links[t].anchor)] == worldnode.from && sproinger.bodies[sproinger.bodies.indexOf(sproinger.links[t].body)] == worldnode.to) || (sproinger.bodies[sproinger.bodies.indexOf(sproinger.links[t].body)] == worldnode.from && sproinger.bodies[sproinger.bodies.indexOf(sproinger.links[t].anchor)] == worldnode.to)){
                         
    
            //                 worldnode.touches.push(sproinger.bodies.indexOf(sproinger.links[t].anchor))
            //                 worldnode.touches.push(sproinger.bodies.indexOf(sproinger.links[t].body))
    
            //                 // console.log( (new LineOP(worldnode,  worldnode.to)).hypotenuse()/3)
            //                 // let link = new LineOP(worldnode, sproinger.bodies[worldnode.from])
            //                 let linker = new SpringOP(worldnode, worldnode.from, 10)
            //                 sproinger.links.push(linker)
            //                 //  link = new LineOP(worldnode, sproinger.bodies[worldnode.to])
            //                  linker = new SpringOP(worldnode,  worldnode.to,10)
            //                 sproinger.links.push(linker)
            //                 sproinger.links.splice(t,1)
            //                 sproinger.bodies.push(worldnode)
            //                 sproinger.marked.push(worldnode)
            //                 break
            //             }
            //         }

            //     }
            // }
            sproinger.marked = []
            dregger = 0
            // if(dregger == 1){
                // sproinger.marked = []
                // dregger = 0
            // }
            // window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            webshape = []
            if(dregger == 0){
            for(let t = 0;t<handlers.length;t++){
                handlers[t].cast()
            }
            let wet = 0
            for(let t = 0;t<webshape.length;t++){
                if(webshape[t].doesMouseTouch()){
                    wet = 1
                    break
                }
            }
            if(wet == 0){
                worldnode = {}
            }
            }
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
        console.log(gamepadAPI.axesStatus[1]*gamepadAPI.axesStatus[0])
        if (typeof object.body != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.body.x += (gamepadAPI.axesStatus[2] * speed)
                object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.x += (gamepadAPI.axesStatus[0] * speed)
                object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
            let limit = granularity
            let shape_array = []
            let batch = (sproinger.bodies.indexOf(from)*sproinger.bodies.indexOf(to))
            let fromindex = sproinger.bodies[sproinger.bodies.indexOf(from)]
            let toindex = sproinger.bodies[sproinger.bodies.indexOf(to)]

            for (let t = 0; t < limit; t++) {
                let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
                shape_array.push(circ)
                // circ.draw()
                circ.batch = batch
                circ.from = fromindex
                circ.to = toindex
            }
            let shape =  (new Shape(shape_array))
            shape.from = fromindex
            shape.to = toindex
            return shape
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 

    let handlers = []
    let webshape = []
    class HandlerCast{
        constructor(object, target){
            this.object = object
            this.target = target
            this.link = new LineOP(this.object, this.target, getRandomColor(), 5)
            this.thickness = 4
            this.granularity=this.link.hypotenuse()/this.thickness
            this.shape = castBetween(this.object, this.target, this.granularity, this.thickness)
        }
        cast(){
            this.granularity=this.link.hypotenuse()/this.thickness
            this.shape = castBetween(this.object, this.target, this.granularity, this.thickness)
            webshape.push(this.shape)
            // this.link.draw()
        }

    }

    let color = "white"// getRandomLightColor()
    let color2 = "white" ///getRandomDarkColor()
    

    class SpringOP {
        constructor(body, anchor, length) {
                this.body = body
                this.anchor = anchor
                if(body.y%50 > 24){
                    this.beam = new LineOP(body, anchor, color, 4.9)
                }else{
                    this.beam = new LineOP(body, anchor, color2, 4.9)
                }
                this.length = length
            this.gravity = 0
            // this.width = width
            let handler = new HandlerCast(this.body, this.anchor)
            handlers.push(handler)
        }
        balance() {

            let handler = new HandlerCast(this.body, this.anchor)
            handlers.push(handler)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
                if(this.length > 5){
                    this.length *= .9
                }
            } else  if (this.beam.hypotenuse() > this.length) {
                this.body.xmom -= (this.body.x - this.anchor.x) / (this.length/2)
                this.body.ymom -= (this.body.y - this.anchor.y) / (this.length/2)
                this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length/2)
                this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length/2)
                if(this.length > 5){
                    this.length *= .9
                }
            }

            if(this.length > 5){
                this.length *= .9
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
    //         xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
    //         ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
    //        this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
    //        this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
    //        this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
    //        this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
    //        xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
    //        ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
    //       this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
    //       this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
    //       this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
    //       this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
    //       xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
    //       ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
    //      this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
    //      this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
    //      this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
    //      this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
    //      xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
    //      ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
    //     this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
    //     this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
    //     this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
    //     this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
    //     xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
    //     ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
    //    this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
    //    this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
    //    this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
    //    this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam.draw()
            // this.body.draw()
            // this.anchor.draw()
        }
        move() {
            // this.anchor.ymom += this.gravity
            // this.anchor.move()
            let j = 0
            // while (this.beam.hypotenuse() < this.length) {
            //     this.body.xmom -= (this.body.x - this.anchor.x) / this.length
            //     this.body.ymom -= (this.body.y - this.anchor.y) / this.length
            //     this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
            //     this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            //     this.anchor.move()
            //     j++
            //     if(j>100){
            //         break
            //     }
            // }
        }
        clean(){
            if (this.beam.hypotenuse() > this.length*5.5) { //this.length*5.5
                // sproinger.links.splice(sproinger.links.indexOf(this),1)
            }
        }
    }

    class Jelly{
        constructor(x,y, rip){
            this.marked = []
            this.marked2 = []
            this.rip = rip
            this.bodies = []
            this.links = []
            this.x = 200
            this.y = 500
            this.space = 35
            for(let t = 1;t<1;t++){
                let x1 = this.x
                let y1 = this.y
                let dot = new Circle(x1, y1,5.01, "white", 0, 0, .9998,1)
                dot.bigbody = new Circle(x1, y1, 5, getRandomColor()) //(this.space*1)
                dot.superbigbody = new Circle(this.x, this.y, this.space*10, getRandomColor())
                dot.touches = []
                dot.bumped = 0
                dot.batch = Math.random()
                // if(shaper.isPointInside(dot)){
                    this.bodies.push(dot)
                // }
                // }else{
                //     if(dot.x%12 == 0 && dot.y%12 == 0){
                //         // dot.bigbody.radius = 12
                //         // this.bodies.push(dot)
                //     }
                // }
                this.x+=this.space
                if(t%10 == 0){
                    this.x = 200
                    this.y+=this.space
                }
            }
            for(let t = 1;t<17;t++){
                let x = 100
                let y = (t*40)
                let dot = new Circle(x, y,10.01, "gray", 0, 0, .99999,1)
                dot.bigbody = new Circle(x, y, 10, getRandomColor()) //(this.space*1)
                dot.superbigbody = new Circle(this.x, this.y, this.space*10, getRandomColor())
                dot.touches = []
                dot.bumped = 0
                // dot.friction = 0
                dot.rooted = 1
                dot.batch = Math.random()
                // if(shaper.isPointInside(dot)){
                    this.bodies.push(dot)
                // }
                // }else{
                //     if(dot.x%12 == 0 && dot.y%12 == 0){
                //         // dot.bigbody.radius = 12
                //         // this.bodies.push(dot)
                //     }
                // }
                this.x+=this.space
                if(t%5 == 0){
                    this.x = x
                    this.y+=this.space
                }
            }
            for(let t = 1;t<17;t++){
                let x = 600
                let y = (t*40)
                let dot = new Circle(x, y,10.01, "gray", 0, 0, .99999,1)
                dot.bigbody = new Circle(x, y, 10, getRandomColor()) //(this.space*1)
                dot.superbigbody = new Circle(this.x, this.y, this.space*10, getRandomColor())
                dot.touches = []
                dot.bumped = 0
                dot.batch = Math.random()
                // dot.friction = 0
                dot.rooted = 1
                // if(shaper.isPointInside(dot)){
                    this.bodies.push(dot)
                // }
                // }else{
                //     if(dot.x%12 == 0 && dot.y%12 == 0){
                //         // dot.bigbody.radius = 12
                //         // this.bodies.push(dot)
                //     }
                // }
                this.x+=this.space
                if(t%5 == 0){
                    this.x = x
                    this.y+=this.space
                }
            }

            // for(let t = 0;t<this.bodies.length;t++){
            //     for(let k = 0;k<this.bodies.length;k++){
            //         if(t!=k){
            //             if(this.bodies[t].doesPerimeterTouch(this.bodies[k].bigbody)){
            //                 if(!this.bodies[t].touches.includes(k) && !this.bodies[k].touches.includes(t)){
            //                     let linker = new SpringOP(this.bodies[t], this.bodies[k], Math.max(this.bodies[t].bigbody.radius, this.bodies[k].bigbody.radius))
            //                     this.bodies[t].touches.push(k)
            //                     this.bodies[k].touches.push(t)
            //                     this.links.push(linker)
            //                 }
            //             }
            //             // if(this.bodies[t].superbigbody.doesPerimeterTouch(this.bodies[k])){
            //             //     if(!this.bodies[t].touches.includes(k) && !this.bodies[k].touches.includes(t)){
            //             //         this.bodies[t].touches.push(k)
            //             //         this.bodies[k].touches.push(t)
            //             //     }
            //             // }
            //         }
            //     }
            // }

            // for(let t = 0;t<this.bodies.length;t++){
            //     this.bodies[t].bigbody.radius  = 20
            // }
        }
        draw(){
            // if(Math.random()<.01){
                if(!this.bodies[0].touches.includes(16)){
                    let linker = new SpringOP(this.bodies[0], this.bodies[16],18)
                    this.bodies[0].touches.push(16)
                    this.bodies[16].touches.push(0)
                    this.links.push(linker)
                }

                    for(let t = 0;t<this.marked.length;t++){
                        for(let k = 0;k<this.bodies.length;k++){
                            if(this.bodies[k] != this.marked[t]){
                                if(!this.marked.includes(this.bodies[k])){
                                    if(this.bodies[k].bigbody.doesPerimeterTouch(this.marked[t])){
                                        if(!this.marked[t].touches.includes(k) && !this.bodies[k].touches.includes(this.bodies.indexOf(this.marked[t]))){
                                            if(this.marked[t].batch != this.bodies[k].batch){ 
                                                 if(mimsma.amsto > 0){
                                                let link = new LineOP(this.marked[t], this.bodies[k])
                                                let linker = new SpringOP(this.bodies[k], this.marked[t],18)
                                                this.marked[t].touches.push(k)
                                                this.bodies[k].touches.push(this.bodies.indexOf(this.marked[t]))
                                                this.links.push(linker)
                                                 }
                                                // sproinger.marked = []
                                                // dregger = 0
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

            // }
            if(this.rip == 1){
                for(let t = 0;t<this.links.length;t++){
                    this.links[t].clean()
                }
            }
            handlers = []
            for(let t = 0;t<this.links.length;t++){
                this.links[t].balance()
            }
            for(let t = 0;t<this.bodies.length;t++){
                // if(this.bodies[t].doesPerimeterTouch(rock)){
                //     let link = new LineOP(this.bodies[t], rock)
                //     let angle = link.angle()
                //     let dis = link.hypotenuse()-rock.radius
                //     this.bodies[t].xmom -= Math.cos(angle)*dis*1.5
                //     this.bodies[t].ymom -= Math.sin(angle)*dis*1.5
                //     // rock.xmom -= Math.cos(angle)*dis*.0000015
                //     // rock.ymom -= Math.sin(angle)*dis*.0000015



                //     // this.bodies[t].bumped = 1
                //     // this.bodies[t].xmom += (rock.xmom)/2
                //     // this.bodies[t].ymom += (rock.ymom)/2
                //     // rock.xmom*=.99999
                //     // rock.ymom*=.99999
                // }


                //options
            // for(let k = 0;k<this.bodies.length;k++){
            //     if(k!=t){
            //         this.bodies[k].xmom += (this.bodies[k].x-this.bodies[t].x)/10000000
            //         this.bodies[k].ymom += (this.bodies[k].y-this.bodies[t].y)/10000000
            //     }
            // }
                this.bodies[t].ymom +=.1
                if(!this.marked.includes(this.bodies[t])){
                    if(this.bodies[t].bumped == 0){

                    }else{
                        // this.bodies[t].ymom+=.4
                    }
                    this.bodies[t].frictiveMove()
                }
                // this.bodies[t].draw()
                    this.bodies[t].bigbody.x = this.bodies[t].x
                    this.bodies[t].bigbody.y = this.bodies[t].y
            }
            for(let t = 0;t<this.links.length;t++){
                this.links[t].balance()
            }
            for(let t = 0;t<this.links.length;t++){
                // this.links[t].move()
            }
            // canvas_context.beginPath()
            for(let t = 0;t<this.links.length;t++){
                this.links[t].draw()
            }
            for(let t = 0;t<this.bodies.length;t++){
                this.bodies[t].draw()
                // this.bodies[t].bigbody.draw()
            }
            // canvas_context.stroke()

        }
    }

    let shapemaker = []

    // let x = 260
    // let y = 200
    // let width = 330
    // for(let t = 0;t<300;t++){
    //     let rectangle = new Rectangle(x,y, width, 1, "red")
    //     y++
    //     if(t>10){
    //         x+=(2*(1-Math.abs(Math.sin(t/(20*Math.PI*2)))))
    //         width-=(4.4*(1-Math.abs(Math.sin(t/(20*Math.PI*2)))))
    //         x-=.1
    //         width+=.2
    //     }else{

    //     x+=1
    //     width-=2
    //     }
    //     shapemaker.push(rectangle)

    // }
    let bag = new Circle(360, 250, 150, "transparent")
    shapemaker.push(bag)

    let shaper = new Shape(shapemaker)
    let sproinger = new Jelly(160, 100, 1)
    let rock = new Circle(10, 290, 26, "white", 20, 0, 1, 1)
    // rock.friction=.9995

    

    let dregger =0

    class Bug{
        constructor(){
            this.body = new Circle(canvas.width*Math.random(), canvas.height*Math.random(), (Math.random()*5)+5, getRandomColor(), Math.random()-.5, Math.random()-.5, 1, 1)
            this.angle = Math.random()*Math.PI*2
            this.speed = (Math.random()*4)+5
            this.rot = (Math.random()*.4)+.3
            this.capturerate = Math.random()*.01
            this.friction = 1-( Math.random()*.1)
        }
        draw(){
            if(this.marked != 1){

                if(this.wet !== 1){
                    this.body.xmom+=(Math.cos(this.angle))
                    this.body.ymom+=(Math.sin(this.angle/1.1))
                    this.body.xmom+=(Math.random()-.5)*.5
                    this.body.ymom+=(Math.random()-.5)*.5
                this.angle += this.rot
                }
                this.wet -=.05
                if(this.wet <0){
                    this.wet = 0
                }
                for(let t = 0;t<webshape.length;t++){
                    if(webshape[t].doesBugTouch(this.body)){
                        this.body.ymom *= this.friction
                        this.body.xmom *= this.friction
                        if(Math.random()<this.capturerate){
                            this.body.ymom *= .5
                            this.body.xmom *= .5
                        }
                        this.wet = 1
                    }
                }
                if(this.wet == 0){
                    while(Math.abs(this.body.xmom) + Math.abs(this.body.ymom)  < this.speed/2){
                        this.body.xmom*=1.01
                        this.body.ymom*=1.01
                    }
                    while(Math.abs(this.body.xmom) + Math.abs(this.body.ymom)  > this.speed){
                        this.body.xmom*=.95
                        this.body.ymom*=.95
                    }
                }
                this.body.move()
                this.body.draw()
                if(Math.random()<.01){
                    this.body.reflect = 0
                }
                if(rectangle.isPointInside(this.body)){
                    // console.log(this)
                }else{
                    // console.log(this,2)
                    this.marked = 1
                }
            }
        }
        clean(){
            if(this.marked ==1){
                // bugs.splice(bugs.indexOf(this))
            }
        }
    }

    let rectangle = new Rectangle(0,0,canvas.width,canvas.height,"red")
    class Spider{
        constructor(){
            this.aminos = 5000
            this.amsto = this.aminos
        }
        draw(){
            let rect = new Rectangle(0, 0, 25, 100, "white")
            rect.height = 100*(this.aminos/5000)
            rect.draw()


            let length = 0
            for(let t =0;t<sproinger.links.length;t++){
                length+=(sproinger.links[t].beam.hypotenuse())+50
            }
             rect = new Rectangle(0, 0, 25, 100, "magenta")
            rect.height = 100*((this.aminos-length)/5000)
            if(bugs.length==0){
                rect.draw()
            }

            this.amsto = this.aminos-length

        }

    }
    let mimsma = new Spider()
    let bugs = []
    // for(let t = 0;t<10;t++){
    // let bug = new Bug()
    // bugs.push(bug)
    // }
    let start = new Rectangle(660,660, 40,40, "#00FF00")

    function main() {
        // webshape = []
        if(keysPressed['b']){
            if(bugs.length == 0){
                bugs = []
                for(let t = 0;t<10;t++){
                let bug = new Bug()
                bugs.push(bug)
                }
            }
        }
        canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image

        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        // game code goes here
        if(keysPressed['h']){
            // rock.ymom+=.1
            rock.move()
        }
        if(dregger == 1){

            for(let t = 0;t<sproinger.marked.length;t++){
                sproinger.marked[t].xmom = 0// (sproinger.marked[t].x-TIP_engine.x)/1
                sproinger.marked[t].ymom = 0// (sproinger.marked[t].y-TIP_engine.y)/1
                sproinger.marked[t].x = TIP_engine.x
                sproinger.marked[t].y = TIP_engine.y
                if(keysPressed['g']){
                    sproinger.marked[t].xmom -= (sproinger.marked[t].x-TIP_engine.x)/200
                    sproinger.marked[t].ymom -= (sproinger.marked[t].y-TIP_engine.y)/200
                }
            }
        }
        // rock.draw()
        sproinger.draw()
        if(keysPressed[' ']){
            console.log(sproinger)
        }
        control(rock, 3)
        // for(let t = 0;t<handlers.length;t++){
        //     handlers[t].cast()
        // }
        // for(let t = 0;t<webshape.length;t++){
        //     if(webshape[t].doesMouseTouch()){
        //         break
        //     }
        // }        
        for(let t = 0;t<bugs.length;t++){
            bugs[t].draw()
        }
        for(let t = 0;t<bugs.length;t++){
            bugs[t].clean()
        }
        mimsma.draw()
        start.draw()
    }
})