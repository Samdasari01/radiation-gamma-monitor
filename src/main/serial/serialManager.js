const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { EventEmitter } = require('events');

class SerialManager extends EventEmitter {
  constructor() {
    super();
    this.port = null;
    this.parser = null;
    this.connected = false;
    this.lastProcessTime = 0;
    this.mainWindow = null;
  }

  setMainWindow(win) {
    this.mainWindow = win;
  }

  sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  async getAvailablePorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map(p => ({
        path: p.path,
        manufacturer: p.manufacturer || 'Unknown',
        vendorId: p.vendorId,
        productId: p.productId
      }));
    } catch (err) {
      console.error('Error listing ports:', err);
      return [];
    }
  }

  connect(portPath, baudRate = 115200) {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        this.disconnect();
      }

      this.port = new SerialPort({
        path: portPath,
        baudRate: parseInt(baudRate) || 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      this.parser.on('data', (line) => {
        this.handleData(line);
      });

      this.port.on('open', () => {
        this.connected = true;
        this.emit('status', { connected: true, port: portPath });
        resolve({ success: true, port: portPath });
      });

      this.port.on('error', (err) => {
        this.connected = false;
        this.emit('status', { connected: false, error: err.message });
        reject({ success: false, error: err.message });
      });

      this.port.on('close', () => {
        this.connected = false;
        this.emit('status', { connected: false });
      });
    });
  }

  disconnect() {
    if (this.port && this.port.isOpen) {
      this.port.close();
    }
    this.connected = false;
  }

  handleData(line) {
    const now = Date.now();
    if (now - this.lastProcessTime < 100) return;
    this.lastProcessTime = now;

    this.emit('rawData', line);

    if (line.startsWith('$')) {
      this.emit('nmea', line);
    } else if (line.startsWith('{')) {
      try {
        const jsonData = JSON.parse(line);
        this.emit('sensorData', jsonData);
      } catch (e) {
        // Not valid JSON - try key=value fallback
        const parsed = this.parseKeyValue(line);
        if (parsed) this.emit('sensorData', parsed);
      }
    } else if (line.startsWith('DOSE:') || line.startsWith('TEMP:') || line.startsWith('HUM:')) {
      this.emit('customData', this.parseCustomFormat(line));
    } else if (line.includes('=')) {
      const parsed = this.parseKeyValue(line);
      if (parsed) this.emit('sensorData', parsed);
    }
  }

  parseKeyValue(line) {
    const data = {};
    const parts = line.trim().split(/\s+/);
    let found = false;
    parts.forEach(part => {
      const eqIdx = part.indexOf('=');
      if (eqIdx > 0) {
        const key = part.substring(0, eqIdx).toLowerCase();
        const val = parseFloat(part.substring(eqIdx + 1));
        if (!isNaN(val)) {
          data[key] = val;
          found = true;
        }
      }
    });

    if (!found) return null;

    // Normalize key names to match app expectations
    const mapping = {
      dose: 'doseRate',
      doserate: 'doseRate',
      temp: 'temperature',
      t: 'temperature',
      temperature: 'temperature',
      hum: 'humidity',
      h: 'humidity',
      humidity: 'humidity',
      lat: 'latitude',
      latitude: 'latitude',
      lon: 'longitude',
      longitude: 'longitude',
      satellites: 'satellites',
      sat: 'satellites',
      cpm: 'cpm'
    };

    const normalized = {};
    for (const [key, val] of Object.entries(data)) {
      normalized[mapping[key] || key] = val;
    }

    normalized.timestamp = new Date().toISOString();
    return normalized;
  }

  parseCustomFormat(line) {
    const parts = line.split('|');
    const data = {};
    parts.forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) {
        data[key.toLowerCase()] = parseFloat(value);
      }
    });
    return data;
  }

  write(data) {
    if (this.port && this.port.isOpen) {
      this.port.write(data + '\n');
    }
  }
}

module.exports = { SerialManager };
