// Standard IAEA Radiation Protection Scale

const IAEA_SCALE = [
  {
    label: 'Normal Background',
    min: 0,
    max: 0.5,
    color: '#22c55e',
    bgColor: '#22c55e20',
    severity: 0,
    description: 'Normal background radiation levels'
  },
  {
    label: 'Slightly Elevated',
    min: 0.5,
    max: 2.0,
    color: '#eab308',
    bgColor: '#eab30820',
    severity: 1,
    description: 'Slightly above background - investigation recommended'
  },
  {
    label: 'Elevated - Caution',
    min: 2.0,
    max: 10.0,
    color: '#f97316',
    bgColor: '#f9731620',
    severity: 2,
    description: 'Elevated radiation levels - use caution'
  },
  {
    label: 'High - Warning',
    min: 10.0,
    max: 100.0,
    color: '#ef4444',
    bgColor: '#ef444420',
    severity: 3,
    description: 'High radiation levels - restricted access'
  },
  {
    label: 'Dangerous - Critical',
    min: 100.0,
    max: Infinity,
    color: '#991b1b',
    bgColor: '#991b1b20',
    severity: 4,
    description: 'Dangerous radiation levels - evacuate immediately'
  }
];

export function getDoseColor(doseRate) {
  if (doseRate === null || doseRate === undefined || isNaN(doseRate)) {
    return '#64748b';
  }

  for (const level of IAEA_SCALE) {
    if (doseRate >= level.min && doseRate < level.max) {
      return level.color;
    }
  }

  return IAEA_SCALE[IAEA_SCALE.length - 1].color;
}

export function getDoseBgColor(doseRate) {
  if (doseRate === null || doseRate === undefined || isNaN(doseRate)) {
    return '#64748b20';
  }

  for (const level of IAEA_SCALE) {
    if (doseRate >= level.min && doseRate < level.max) {
      return level.bgColor;
    }
  }

  return IAEA_SCALE[IAEA_SCALE.length - 1].bgColor;
}

export function getDoseLabel(doseRate) {
  if (doseRate === null || doseRate === undefined || isNaN(doseRate)) {
    return 'No Data';
  }

  for (const level of IAEA_SCALE) {
    if (doseRate >= level.min && doseRate < level.max) {
      return level.label;
    }
  }

  return IAEA_SCALE[IAEA_SCALE.length - 1].label;
}

export function getDoseSeverity(doseRate) {
  if (doseRate === null || doseRate === undefined || isNaN(doseRate)) {
    return -1;
  }

  for (const level of IAEA_SCALE) {
    if (doseRate >= level.min && doseRate < level.max) {
      return level.severity;
    }
  }

  return IAEA_SCALE.length - 1;
}

export function getDoseLevel(doseRate) {
  if (doseRate === null || doseRate === undefined || isNaN(doseRate)) {
    return {
      label: 'No Data',
      color: '#64748b',
      bgColor: '#64748b20',
      severity: -1,
      description: 'No radiation data available'
    };
  }

  for (const level of IAEA_SCALE) {
    if (doseRate >= level.min && doseRate < level.max) {
      return level;
    }
  }

  return IAEA_SCALE[IAEA_SCALE.length - 1];
}

export function getAllLevels() {
  return IAEA_SCALE.map(level => ({
    ...level,
    displayRange: level.max === Infinity
      ? `> ${level.min} µSv/h`
      : `${level.min} - ${level.max} µSv/h`
  }));
}

export function formatDoseRate(value, unit = 'microSv') {
  if (value === null || value === undefined) return 'N/A';

  switch (unit) {
    case 'milliSv':
      return `${(value / 1000).toFixed(4)} mSv/h`;
    case 'mR':
      return `${(value * 100).toFixed(2)} mR/h`;
    case 'microSv':
    default:
      return `${value.toFixed(4)} µSv/h`;
  }
}
