const { NMEAParser } = require('./nmeaParser');

class DataProcessor {
  constructor() {
    this.nmeaParser = new NMEAParser();
    this.currentPosition = null;
    this.currentData = {
      doseRate: 0,
      cpm: 0,
      temperature: 0,
      humidity: 0,
      latitude: null,
      longitude: null,
      satellites: 0,
      timestamp: null
    };
  }

  process(rawData) {
    let result = { ...this.currentData, updated: false };

    if (typeof rawData === 'string' && rawData.startsWith('$')) {
      const position = this.nmeaParser.parse(rawData);
      if (position && position.valid) {
        this.currentPosition = position;
        result.latitude = position.latitude;
        result.longitude = position.longitude;
        result.satellites = position.satellites || 0;
        result.updated = true;
      }
    } else if (typeof rawData === 'object' && rawData !== null) {
      if (rawData.dose !== undefined || rawData.doseRate !== undefined) {
        result.doseRate = parseFloat(rawData.dose || rawData.doseRate);
        result.updated = true;
      }
      if (rawData.cpm !== undefined) {
        result.cpm = parseInt(rawData.cpm) || 0;
        result.updated = true;
      }
      if (rawData.temp !== undefined || rawData.temperature !== undefined) {
        result.temperature = parseFloat(rawData.temp || rawData.temperature);
        result.updated = true;
      }
      if (rawData.hum !== undefined || rawData.humidity !== undefined) {
        result.humidity = parseFloat(rawData.hum || rawData.humidity);
        result.updated = true;
      }
      if (rawData.lat !== undefined && rawData.lon !== undefined) {
        result.latitude = parseFloat(rawData.lat);
        result.longitude = parseFloat(rawData.lon);
        result.updated = true;
      }
      if (rawData.satellites !== undefined) {
        result.satellites = parseInt(rawData.satellites);
        result.updated = true;
      }
    }

    if (result.updated) {
      result.timestamp = new Date().toISOString();
      this.currentData = { ...this.currentData, ...result };
    }

    return this.currentData;
  }

  getCurrentData() {
    return { ...this.currentData };
  }

  parseDelimited(data, format = 'dose,temp,hum,lat,lon') {
    const keys = format.split(',');
    const values = data.split(',');
    const result = {};

    keys.forEach((key, index) => {
      if (values[index] !== undefined) {
        const value = parseFloat(values[index]);
        if (!isNaN(value)) {
          result[key] = value;
        }
      }
    });

    return result;
  }
}

module.exports = { DataProcessor };
