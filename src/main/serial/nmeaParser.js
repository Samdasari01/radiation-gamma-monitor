class NMEAParser {
  constructor() {
    this.lastPosition = null;
    this.lastTime = null;
  }

  parse(sentence) {
    if (!sentence || !sentence.startsWith('$')) return null;

    const parts = sentence.split('*');
    if (parts.length < 2) return null;

    const data = parts[0].substring(1);
    const fields = data.split(',');

    switch (fields[0]) {
      case 'GPGGA':
      case 'GNGGA':
        return this.parseGGA(fields);
      case 'GPRMC':
      case 'GNRMC':
        return this.parseRMC(fields);
      case 'GPGLL':
      case 'GNGLL':
        return this.parseGLL(fields);
      default:
        return null;
    }
  }

  parseGGA(fields) {
    if (fields.length < 15) return null;

    const latitude = this.parseCoord(fields[2], fields[3]);
    const longitude = this.parseCoord(fields[4], fields[5]);
    const fixQuality = parseInt(fields[6]);
    const satellites = parseInt(fields[7]);
    const altitude = parseFloat(fields[9]);

    return {
      type: 'position',
      time: this.parseTime(fields[1]),
      latitude,
      longitude,
      fixQuality,
      satellites,
      altitude,
      valid: fixQuality > 0 && latitude !== null && longitude !== null
    };
  }

  parseRMC(fields) {
    if (fields.length < 12) return null;

    const latitude = this.parseCoord(fields[3], fields[4]);
    const longitude = this.parseCoord(fields[5], fields[6]);
    const speedKnots = parseFloat(fields[7]);
    const trackMadeGood = parseFloat(fields[8]);
    const status = fields[2];

    return {
      type: 'position',
      time: this.parseTime(fields[1]),
      latitude,
      longitude,
      speed: speedKnots * 1.852,
      track: trackMadeGood,
      valid: status === 'A' && latitude !== null && longitude !== null
    };
  }

  parseGLL(fields) {
    if (fields.length < 7) return null;

    const latitude = this.parseCoord(fields[1], fields[2]);
    const longitude = this.parseCoord(fields[3], fields[4]);
    const status = fields[6];

    return {
      type: 'position',
      latitude,
      longitude,
      valid: status === 'A' && latitude !== null && longitude !== null
    };
  }

  parseCoord(coord, direction) {
    if (!coord || !direction) return null;

    const value = parseFloat(coord);
    if (isNaN(value)) return null;

    let degrees, minutes;

    if (coord.includes('.')) {
      const parts = coord.split('.');
      const intPart = parts[0];
      const decPart = parts[1];

      if (intPart.length <= 2) {
        degrees = parseInt(intPart);
        minutes = parseFloat(intPart.substring(intPart.length - 2) + '.' + decPart);
      } else {
        degrees = parseInt(intPart.substring(0, intPart.length - 2));
        minutes = parseFloat(intPart.substring(intPart.length - 2) + '.' + decPart);
      }
    } else {
      degrees = parseInt(coord.substring(0, 2));
      minutes = parseInt(coord.substring(2, 4));
      const seconds = parseInt(coord.substring(4));
      minutes = minutes + seconds / 60;
    }

    let decimal = degrees + minutes / 60;

    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }

    return decimal;
  }

  parseTime(timeStr) {
    if (!timeStr || timeStr.length < 6) return null;

    const hours = timeStr.substring(0, 2);
    const minutes = timeStr.substring(2, 4);
    const seconds = timeStr.substring(4);

    return `${hours}:${minutes}:${seconds}`;
  }

  static verifyChecksum(sentence) {
    const parts = sentence.split('*');
    if (parts.length < 2) return false;

    const data = parts[0].substring(1);
    const checksum = parseInt(parts[1], 16);

    let calculated = 0;
    for (let i = 0; i < data.length; i++) {
      calculated ^= data.charCodeAt(i);
    }

    return calculated === checksum;
  }
}

module.exports = { NMEAParser };
