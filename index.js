var Accessory, Service, Characteristic, UUIDGen;
var AwoxSmartLight = require('awox-smartlight-dave');

module.exports = function(homebridge) {
  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  // For platform plugin to be considered as dynamic platform plugin,
  homebridge.registerAccessory("homebridge-awox", "AwoxSmartLight", AwoxAccessory, true);
}

function AwoxAccessory(log, config) {
  this.log = log;
  this.config = config || {};
  this.name = config["name"];
  this.bulbName = config["bulbName"] || config["name"];
  this.lampMac = config["lampMac"];
  this.service = new Service.Lightbulb(this.name);

  this.on = false;
  this.brightness = 100;
  this.hue = 0;
  this.saturation = 0;

  this.lamp = new AwoxSmartLight(this.lampMac, this.log);

  this.service
    .getCharacteristic(Characteristic.On)
    .on('get', this.getPower.bind(this))
    .on('set', this.setPower.bind(this));
  this.service
    .getCharacteristic(Characteristic.Brightness)
    .on('get', this.getBrightness.bind(this))
    .on('set', this.setBrightness.bind(this));
  this.service
    .getCharacteristic(Characteristic.Hue)
    .on('get', this.getHue.bind(this))
    .on('set', this.setHue.bind(this));
  this.service
    .getCharacteristic(Characteristic.Saturation)
    .on('get', this.getSaturation.bind(this))
    .on('set', this.setSaturation.bind(this));
}

AwoxAccessory.prototype.getPower = function(callback) {
  this.log("Power state for the '%s' is %s", this.name, this.on);
  callback(null, this.on);
}

AwoxAccessory.prototype.setPower = function(powerOn, callback) {
  this.log("Set power state on the '%s' to %s", this.bulbName, powerOn);
  if (powerOn) {
    this.lamp.lightOn();
  } else {
    this.lamp.lightOff();
  }

  this.on = !powerOn;

  callback();
}

AwoxAccessory.prototype.getBrightness = function(callback) {
  this.log("brightness for the '%s' is %s", this.name, this.brightness);
  callback(null, this.brightness);
}

AwoxAccessory.prototype.setBrightness = function(brightness, callback, context) {
	if(context !== 'fromSetValue') {
    this.log("set brightness to:" + brightness);
		this.brightness = brightness;
    this.lamp.lightBrightness(brightness / 100);
	}
	callback();
}

AwoxAccessory.prototype.getHue = function(callback) {
  this.log("hue for the '%s' is %s", this.name, this.hue);
  callback(null, this.hue);
}

AwoxAccessory.prototype.setHue = function(hue, callback, context) {
	if(context !== 'fromSetValue') {
		this.hue = hue;
    var rgb = this._hsvToRgb(hue, this.saturation, this.brightness);
    this.lamp.lightRgbReset();
    this.lamp.lightRgb(rgb.r, rgb.g, rgb.b, false);
	}
	callback();
}

AwoxAccessory.prototype.getSaturation = function(callback) {
  this.log("saturation for the '%s' is %s", this.name, this.saturation);
  callback(null, this.saturation);
}

AwoxAccessory.prototype.setSaturation = function(saturation, callback, context) {
	if(context !== 'fromSetValue') {
    this.log("set saturation to:" + saturation);
		this.saturation = saturation;
    this.lamp.lightWhite(saturation / 100);
	}
	callback();
}

AwoxAccessory.prototype._hsvToRgb = function(h, s, v) {
    var r, g, b, i, f, p, q, t;

    h /= 360;
    s /= 100;
    v /= 100;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    var rgb = { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    return rgb;
}

AwoxAccessory.prototype._decToHex = function(d, padding) {
    var hex = Number(d).toString(16).toUpperCase();
    padding = typeof (padding) === 'undefined' || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
      hex = '0' + hex;
    }

    return hex;
}

AwoxAccessory.prototype.getServices = function() {
    return [this.service];
}
