import logger from './logger';

class Validator {
  constructor() {
    this.rules = new Map();
    this.customValidators = new Map();
    this.errorMessages = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL',
      number: 'Please enter a valid number',
      integer: 'Please enter a valid integer',
      positive: 'Please enter a positive number',
      range: 'Value must be between {min} and {max}',
      minLength: 'Must be at least {min} characters long',
      maxLength: 'Must be no more than {max} characters long',
      pattern: 'Invalid format',
      date: 'Please enter a valid date',
      future: 'Date must be in the future',
      past: 'Date must be in the past',
      coordinates: 'Please enter valid coordinates (latitude, longitude)',
      carbonCredits: 'Invalid carbon credits value',
      projectName: 'Project name must be 3-100 characters',
      location: 'Please enter a valid location'
    };
  }

  // Register validation rules for a form
  registerRules(formName, rules) {
    this.rules.set(formName, rules);
    logger.debug(`Validation rules registered for ${formName}`, { rules }, 'VALIDATOR');
  }

  // Validate a single field
  validateField(value, rule, fieldName = '') {
    const errors = [];

    // Required validation
    if (rule.required && this.isEmpty(value)) {
      errors.push(this.getErrorMessage('required', rule, fieldName));
      return errors; // Stop validation if required field is empty
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !rule.required) {
      return errors;
    }

    // Type validations
    if (rule.type) {
      const typeError = this.validateType(value, rule.type, rule, fieldName);
      if (typeError) errors.push(typeError);
    }

    // Length validations
    if (rule.minLength !== undefined) {
      const lengthError = this.validateMinLength(value, rule.minLength, fieldName);
      if (lengthError) errors.push(lengthError);
    }

    if (rule.maxLength !== undefined) {
      const lengthError = this.validateMaxLength(value, rule.maxLength, fieldName);
      if (lengthError) errors.push(lengthError);
    }

    // Range validations
    if (rule.min !== undefined || rule.max !== undefined) {
      const rangeError = this.validateRange(value, rule.min, rule.max, fieldName);
      if (rangeError) errors.push(rangeError);
    }

    // Pattern validation
    if (rule.pattern) {
      const patternError = this.validatePattern(value, rule.pattern, fieldName);
      if (patternError) errors.push(patternError);
    }

    // Custom validator
    if (rule.validator) {
      const customError = this.validateCustom(value, rule.validator, rule, fieldName);
      if (customError) errors.push(customError);
    }

    // Predefined validators
    if (rule.validator && typeof rule.validator === 'string') {
      const predefinedError = this.validatePredefined(value, rule.validator, rule, fieldName);
      if (predefinedError) errors.push(predefinedError);
    }

    return errors;
  }

  // Validate entire form
  validateForm(formName, data) {
    const rules = this.rules.get(formName);
    if (!rules) {
      logger.warn(`No validation rules found for form: ${formName}`, null, 'VALIDATOR');
      return { isValid: true, errors: {} };
    }

    const errors = {};
    let isValid = true;

    for (const [fieldName, rule] of Object.entries(rules)) {
      const fieldErrors = this.validateField(data[fieldName], rule, fieldName);
      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    // Cross-field validations
    if (rules._crossField) {
      const crossFieldErrors = this.validateCrossField(data, rules._crossField);
      if (crossFieldErrors.length > 0) {
        errors._form = crossFieldErrors;
        isValid = false;
      }
    }

    logger.debug(`Form validation completed for ${formName}`, {
      isValid,
      errorCount: Object.keys(errors).length
    }, 'VALIDATOR');

    return { isValid, errors };
  }

  // Type validations
  validateType(value, type, rule, fieldName) {
    switch (type) {
      case 'email':
        return this.validateEmail(value, fieldName);
      case 'url':
        return this.validateUrl(value, fieldName);
      case 'number':
        return this.validateNumber(value, fieldName);
      case 'integer':
        return this.validateInteger(value, fieldName);
      case 'date':
        return this.validateDate(value, fieldName);
      case 'coordinates':
        return this.validateCoordinates(value, fieldName);
      default:
        return null;
    }
  }

  // Specific validation methods
  validateEmail(value, fieldName) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : this.getErrorMessage('email', {}, fieldName);
  }

  validateUrl(value, fieldName) {
    try {
      new URL(value);
      return null;
    } catch {
      return this.getErrorMessage('url', {}, fieldName);
    }
  }

  validateNumber(value, fieldName) {
    const num = Number(value);
    return !isNaN(num) && isFinite(num) ? null : this.getErrorMessage('number', {}, fieldName);
  }

  validateInteger(value, fieldName) {
    const num = Number(value);
    return Number.isInteger(num) ? null : this.getErrorMessage('integer', {}, fieldName);
  }

  validateDate(value, fieldName) {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? null : this.getErrorMessage('date', {}, fieldName);
  }

  validateCoordinates(value, fieldName) {
    if (typeof value === 'object' && value.latitude !== undefined && value.longitude !== undefined) {
      const lat = Number(value.latitude);
      const lng = Number(value.longitude);
      const isValidLat = !isNaN(lat) && lat >= -90 && lat <= 90;
      const isValidLng = !isNaN(lng) && lng >= -180 && lng <= 180;
      return (isValidLat && isValidLng) ? null : this.getErrorMessage('coordinates', {}, fieldName);
    }
    return this.getErrorMessage('coordinates', {}, fieldName);
  }

  validateMinLength(value, minLength, fieldName) {
    const length = typeof value === 'string' ? value.length : String(value).length;
    return length >= minLength ? null : this.getErrorMessage('minLength', { min: minLength }, fieldName);
  }

  validateMaxLength(value, maxLength, fieldName) {
    const length = typeof value === 'string' ? value.length : String(value).length;
    return length <= maxLength ? null : this.getErrorMessage('maxLength', { max: maxLength }, fieldName);
  }

  validateRange(value, min, max, fieldName) {
    const num = Number(value);
    if (isNaN(num)) return this.getErrorMessage('number', {}, fieldName);
    
    if (min !== undefined && num < min) {
      return this.getErrorMessage('range', { min, max: max || 'infinity' }, fieldName);
    }
    
    if (max !== undefined && num > max) {
      return this.getErrorMessage('range', { min: min || 'negative infinity', max }, fieldName);
    }
    
    return null;
  }

  validatePattern(value, pattern, fieldName) {
    const regex = new RegExp(pattern);
    return regex.test(value) ? null : this.getErrorMessage('pattern', {}, fieldName);
  }

  validateCustom(value, validator, rule, fieldName) {
    try {
      const result = validator(value, rule, fieldName);
      return result === true ? null : (result || this.getErrorMessage('pattern', {}, fieldName));
    } catch (error) {
      logger.error('Custom validator error', { error: error.message, fieldName }, 'VALIDATOR');
      return 'Validation error';
    }
  }

  validatePredefined(value, validatorName, rule, fieldName) {
    const validator = this.customValidators.get(validatorName);
    if (!validator) {
      logger.warn(`Predefined validator not found: ${validatorName}`, null, 'VALIDATOR');
      return null;
    }
    return this.validateCustom(value, validator, rule, fieldName);
  }

  // Cross-field validations
  validateCrossField(data, rules) {
    const errors = [];
    
    for (const rule of rules) {
      try {
        const result = rule.validator(data);
        if (result !== true) {
          errors.push(result || 'Cross-field validation failed');
        }
      } catch (error) {
        logger.error('Cross-field validator error', { error: error.message }, 'VALIDATOR');
        errors.push('Validation error');
      }
    }
    
    return errors;
  }

  // Utility methods
  isEmpty(value) {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }

  getErrorMessage(type, params = {}, fieldName = '') {
    let message = this.errorMessages[type] || 'Invalid value';
    
    // Replace placeholders
    for (const [key, value] of Object.entries(params)) {
      message = message.replace(`{${key}}`, value);
    }
    
    return message;
  }

  // Register custom validator
  registerValidator(name, validator) {
    this.customValidators.set(name, validator);
    logger.debug(`Custom validator registered: ${name}`, null, 'VALIDATOR');
  }

  // Register custom error message
  registerErrorMessage(type, message) {
    this.errorMessages[type] = message;
  }

  // Sanitize input
  sanitize(value, type = 'string') {
    if (value === null || value === undefined) return value;

    switch (type) {
      case 'string':
        return String(value).trim();
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'integer':
        const int = parseInt(value, 10);
        return isNaN(int) ? null : int;
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
      case 'email':
        return String(value).trim().toLowerCase();
      case 'html':
        return this.sanitizeHtml(value);
      default:
        return value;
    }
  }

  // Basic HTML sanitization
  sanitizeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  // Real-time validation for forms
  createRealTimeValidator(formName) {
    return {
      validateField: (fieldName, value) => {
        const rules = this.rules.get(formName);
        if (!rules || !rules[fieldName]) return { isValid: true, errors: [] };
        
        const errors = this.validateField(value, rules[fieldName], fieldName);
        return { isValid: errors.length === 0, errors };
      },
      
      validateForm: (data) => {
        return this.validateForm(formName, data);
      }
    };
  }
}

// Create global validator instance
const validator = new Validator();

// Register predefined validators for Blue Carbon Registry
validator.registerValidator('projectName', (value) => {
  if (typeof value !== 'string') return 'Project name must be a string';
  if (value.length < 3) return 'Project name must be at least 3 characters';
  if (value.length > 100) return 'Project name must be no more than 100 characters';
  if (!/^[a-zA-Z0-9\s\-_,.]+$/.test(value)) return 'Project name contains invalid characters';
  return true;
});

validator.registerValidator('carbonCredits', (value) => {
  const num = Number(value);
  if (isNaN(num)) return 'Carbon credits must be a number';
  if (num < 0) return 'Carbon credits must be positive';
  if (num > 1000000) return 'Carbon credits value seems unusually high';
  return true;
});

validator.registerValidator('ecosystemType', (value) => {
  const validTypes = ['mangrove', 'seagrass', 'salt_marsh', 'kelp_forest', 'coral_reef'];
  return validTypes.includes(value) ? true : 'Invalid ecosystem type';
});

// Register validation rules for forms
validator.registerRules('project', {
  name: { 
    required: true, 
    validator: 'projectName' 
  },
  description: { 
    required: true, 
    minLength: 10, 
    maxLength: 1000 
  },
  location: { 
    required: true, 
    minLength: 3, 
    maxLength: 100 
  },
  area_hectares: { 
    required: true, 
    type: 'number', 
    min: 0.1, 
    max: 100000 
  },
  latitude: { 
    type: 'number', 
    min: -90, 
    max: 90 
  },
  longitude: { 
    type: 'number', 
    min: -180, 
    max: 180 
  },
  ecosystem_type: { 
    required: true, 
    validator: 'ecosystemType' 
  }
});

validator.registerRules('carbonCredits', {
  project_id: { 
    required: true, 
    type: 'integer', 
    min: 1 
  },
  amount: { 
    required: true, 
    validator: 'carbonCredits' 
  },
  price_per_credit: { 
    required: true, 
    type: 'number', 
    min: 0.01, 
    max: 1000 
  },
  verification_standard: { 
    required: true, 
    minLength: 2, 
    maxLength: 50 
  }
});

validator.registerRules('fieldData', {
  project_id: { 
    required: true, 
    type: 'integer', 
    min: 1 
  },
  data_type: { 
    required: true, 
    minLength: 2, 
    maxLength: 50 
  },
  value: { 
    required: true, 
    type: 'number' 
  },
  unit: { 
    required: true, 
    minLength: 1, 
    maxLength: 20 
  },
  latitude: { 
    type: 'number', 
    min: -90, 
    max: 90 
  },
  longitude: { 
    type: 'number', 
    min: -180, 
    max: 180 
  }
});

export default validator;
