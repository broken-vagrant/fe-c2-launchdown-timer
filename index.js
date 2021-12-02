// Flipdown Copied from https://github.com/PButcher/flipdown/blob/master/src/flipdown.js

class FlipDown {
  constructor(uts, el = "flipdown") {
    if (typeof uts !== "number") {
      throw new Error(`FlipDown: constructor expected unix timestamp, got ${typeof uts} instead.`)
    }

    this.initialised = false;

    this.now = this._getTime();

    this.epoch = uts;

    this.countdownEnded = false;

    this.onEndCallback = null;

    this.element = document.getElementById(el);

    this.rotors = [];
    this.rotorLeafFront = [];
    this.rotorLeafRear = [];
    this.rotorTops = [];
    this.rotorBottoms = [];

    this.countdown = null;

    this.daysRemaining = '0';

    this.clockValues = {};
    this.clockStrings = {};

    this.clockValuesAsString = [];
    this.prevClockValuesAsString = [];

    this.headings = ["Days", "Hours", "Minutes", "Seconds"]
  }

  start() {
    if (!this.initialised) this._init();

    this.countdown = setInterval(this._tick.bind(this), 1000)

    return this;
  }

  onEnd(cb) {
    this.onEndCallback = function () {
      cb();
      this.onEndCallback = null;
    }

    return this;
  }

  _getTime() {
    return new Date().getTime() / 1000;
  }

  _hasCountdownEnded() {

    if (this.epoch - this.now < 0) {
      this.countdownEnded = true;

      if (this.onEndCallback !== null) {
        this.onEndCallback();

        this.onEndCallback = null;
      }

      return true;
    } else {
      this.countdownEnded = false;
      return false;
    }
  }

  _init() {
    this.initialised = true;

    if (this._hasCountdownEnded()) {
      this.daysRemaining = '0';
    } else {
      this.daysRemaining = Math.floor((this.epoch - this.now) / 86400).toString();
    }

    const dayRotorCount = this.daysRemaining.length <= 2 ? 2 : this.daysRemaining.length;

    // dd::hh::mm::ss (last three sections take 2 rotors at max i.e 6)
    for (var i = 0; i < dayRotorCount + 6; i++) {
      this.rotors.push(this._createRotor(0));
    }

    // Create day rotor group
    const dayRotors = [];
    for (var i = 0; i < dayRotorCount; i++) {
      dayRotors.push(this.rotors[i]);
    }
    this.element.appendChild(this._createRotorGroup(dayRotors, 0));

    // Create Other rotor groups
    let count = dayRotorCount;
    for (var i = 0; i < 3; i++) {
      var otherRotors = [];
      for (var j = 0; j < 2; j++) {
        otherRotors.push(this.rotors[count]);
        count++;
      }
      this.element.appendChild(this._createRotorGroup(otherRotors, i + 1));
    }

    this.rotorLeafFront = Array.prototype.slice.call(
      this.element.getElementsByClassName('rotor-leaf-front')
    );

    this.rotorLeafRear = Array.prototype.slice.call(this.element.getElementsByClassName('rotor-leaf-rear'));

    this.rotorTop = Array.prototype.slice.call(this.element.getElementsByClassName('rotor-top'));

    this.rotorBottom = Array.prototype.slice.call(this.element.getElementsByClassName('rotor-bottom'));

    // set initial values;
    this._tick();
    this._updateClockValues(true);

    return this;
  }

  _createRotorGroup(rotors, rotorIndex) {
    const rotorGroup = document.createElement('div');
    rotorGroup.className = 'rotor-group';

    const dayRotorGroupLabel = document.createElement('span');
    dayRotorGroupLabel.textContent = this.headings[rotorIndex];
    dayRotorGroupLabel.className = 'rotor-group-label';

    appendChildren(rotorGroup, rotors)

    rotorGroup.appendChild(dayRotorGroupLabel);

    return rotorGroup;
  }
  _createRotor(v = 0) {
    const rotor = document.createElement('div');
    const rotorLeaf = document.createElement('div');
    const rotorLeafRear = document.createElement('figure');
    const rotorLeafFront = document.createElement('figure');
    const rotorTop = document.createElement('div');
    const rotorBottom = document.createElement('div');

    rotor.className = 'rotor';
    rotorLeaf.className = 'rotor-leaf';
    rotorLeafRear.className = 'rotor-leaf-rear';
    rotorLeafFront.className = 'rotor-leaf-front';
    rotorTop.className = 'rotor-top';
    rotorBottom.className = 'rotor-bottom';

    rotorLeafRear.textContent = v;
    rotorTop.textContent = v;
    rotorBottom.textContent = v;

    appendChildren(rotor, [rotorLeaf, rotorTop, rotorBottom])
    appendChildren(rotorLeaf, [rotorLeafRear, rotorLeafFront])

    return rotor;
  }

  _tick() {
    // Get time now
    this.now = this._getTime();

    // Between now and epoch
    let diff = this.epoch - this.now <= 0 ? 0 : this.epoch - this.now;

    // Days remaining
    this.clockValues.d = Math.floor(diff / 86400); // 24*60*60 (1 day) = 86400 seconds;
    diff -= this.clockValues.d * 86400;

    // Hours remaining
    this.clockValues.h = Math.floor(diff / 3600); // 60 * 60 (1 hour) = 36000 seconds;
    diff -= this.clockValues.h * 3600;

    // Minutes remaining
    this.clockValues.m = Math.floor(diff / 60);
    diff -= this.clockValues.m * 60;

    // Seconds remaining
    this.clockValues.s = Math.floor(diff);

    // Update clock values
    this._updateClockValues();

    // Has the countdown ended
    this._hasCountdownEnded();
  }

  _updateClockValues(init = false) {
    // build clock value strings
    this.clockStrings.d = pad(this.clockValues.d, 2)
    this.clockStrings.h = pad(this.clockValues.h, 2)
    this.clockStrings.m = pad(this.clockValues.m, 2)
    this.clockStrings.s = pad(this.clockValues.s, 2)

    // Concat clock value strings
    this.clockValuesAsString = (
      this.clockStrings.d + this.clockStrings.h + this.clockStrings.m + this.clockStrings.s
    ).split("");

    // Update rotor values
    // Note that the faces which are initially visible are:
    // - rotorLeafFront (top half of current rotor)
    // - rotorBottom (bottom half of current rotor)
    // Note that the faces which are initially hidden are:
    // - rotorTop (top half of next rotor)
    // - rotorLeafRear (bottom half of next rotor)
    this.rotorLeafFront.forEach((el, i) => {
      el.textContent = this.prevClockValuesAsString[i];
    })

    this.rotorBottom.forEach((el, i) => {
      el.textContent = this.prevClockValuesAsString[i];
    })

    function rotorTopFlip() {
      this.rotorTop.forEach((el, i) => {
        if (el.textContent != this.clockValuesAsString[i]) {
          el.textContent = this.clockValuesAsString[i];
        }
      })
    }

    function rotorLeafRearFlip() {
      this.rotorLeafRear.forEach((el, i) => {
        if (el.textContent != this.clockValuesAsString[i]) {
          el.textContent = this.clockValuesAsString[i];
          el.parentElement.classList.add('flipped');
          var flip = setInterval(function () {
            el.parentElement.classList.remove('flipped');
            clearInterval(flip)
          }.bind(this), 500)
        }
      })
    }

    if (!init) {
      setTimeout(
        rotorTopFlip.bind(this)
        , 500);
      setTimeout(
        rotorLeafRearFlip.bind(this)
        , 500);
    } else {
      rotorTopFlip.call(this)
      rotorLeafRearFlip.call(this)
    }

    // save a copy of clock values for next tick
    this.prevClockValuesAsString = this.clockValuesAsString;
  }
}

function pad(n, len) {
  n = n.toString()
  return n.length < len ? pad("0" + n, len) : n;
}

function appendChildren(parent, children) {
  children.forEach((el) => {
    parent.appendChild(el);
  })
}

document.addEventListener('DOMContentLoaded', () => {

  // Unix timestamp (in seconds) to count down to
  const twoDaysFromNow = (new Date().getTime() / 1000) + (86400 * 2) + 1;

  // Set up FlipDown
  new FlipDown(twoDaysFromNow)

    // Start the countdown
    .start()

    // Do something when the countdown ends
    .onEnd(() => {
      console.log('The countdown has ended!');
    });
})