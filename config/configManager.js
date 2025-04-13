/**
 * Configuration management system.
 * 
 * This module provides centralized configuration management for the mock server,
 * allowing dynamic settings based on environment and providing defaults.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Default configuration
const defaultConfig = {
  // Factory settings
  factory: {
    defaultRepeat: 10,
    maxRepeat: 1000,
    useStreaming: true,
    streamingThreshold: 5 * 1024 * 1024, // 5MB
  },
  
  // Processing settings
  processing: {
    parallel: true,
    maxWorkers: 0, // 0 means use CPU count
  },
  
  // Output settings
  output: {
    pretty: true,
    dbDir: './db',
    outputFile: './db.json',
  },
  
  // Server settings
  server: {
    port: 3000,
    delay: 0,
    watch: true,
  },
  
  // Entity specific overrides
  entities: {
    // Override default _repeat values by entity key
    // Example: users: 50
  }
};

class ConfigManager {
  constructor() {
    this.config = { ...defaultConfig };
    this.envConfig = {};
    this.userConfig = {};
    this.loaded = false;
  }
  
  /**
   * Load all configuration sources
   */
  load() {
    if (this.loaded) return;
    
    // Load environment variables
    this._loadFromEnvironment();
    
    // Load from config file if exists
    this._loadFromFile();
    
    // Merge configurations with precedence: userConfig > envConfig > defaultConfig
    this.config = this._mergeConfigs(defaultConfig, this.envConfig, this.userConfig);
    
    this.loaded = true;
    return this.config;
  }
  
  /**
   * Get the complete configuration object
   * @returns {Object} Complete configuration
   */
  getConfig() {
    if (!this.loaded) {
      this.load();
    }
    return this.config;
  }
  
  /**
   * Get a specific configuration value by path
   * @param {string} path - Dot notation path (e.g., 'factory.defaultRepeat')
   * @param {any} [defaultValue] - Default value if path not found
   * @returns {any} Configuration value
   */
  get(path, defaultValue = undefined) {
    if (!this.loaded) {
      this.load();
    }
    
    const parts = path.split('.');
    let current = this.config;
    
    for (const part of parts) {
      if (current === undefined || current === null || !(part in current)) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Get entity-specific repeat value or default
   * @param {string} entityKey - Entity key name
   * @returns {number} Repeat value
   */
  getRepeatForEntity(entityKey) {
    const entityRepeat = this.get(`entities.${entityKey}`);
    if (entityRepeat !== undefined) {
      return entityRepeat;
    }
    return this.get('factory.defaultRepeat');
  }
  
  /**
   * Load configuration from environment variables
   * @private
   */
  _loadFromEnvironment() {
    const env = process.env;
    const envConfig = {
      factory: {},
      processing: {},
      output: {},
      server: {},
      entities: {}
    };
    
    // Map environment variables to configuration
    if (env.MOCK_SERVER_DEFAULT_REPEAT) {
      envConfig.factory.defaultRepeat = parseInt(env.MOCK_SERVER_DEFAULT_REPEAT, 10);
    }
    
    if (env.MOCK_SERVER_MAX_REPEAT) {
      envConfig.factory.maxRepeat = parseInt(env.MOCK_SERVER_MAX_REPEAT, 10);
    }
    
    if (env.MOCK_SERVER_USE_STREAMING) {
      envConfig.factory.useStreaming = env.MOCK_SERVER_USE_STREAMING.toLowerCase() === 'true';
    }
    
    if (env.MOCK_SERVER_PARALLEL) {
      envConfig.processing.parallel = env.MOCK_SERVER_PARALLEL.toLowerCase() === 'true';
    }
    
    if (env.MOCK_SERVER_MAX_WORKERS) {
      envConfig.processing.maxWorkers = parseInt(env.MOCK_SERVER_MAX_WORKERS, 10);
    }
    
    if (env.MOCK_SERVER_PORT) {
      envConfig.server.port = parseInt(env.MOCK_SERVER_PORT, 10);
    }
    
    // Entity repeat values from environment (format: MOCK_ENTITY_{KEY}_REPEAT)
    Object.keys(env)
      .filter(key => key.startsWith('MOCK_ENTITY_') && key.endsWith('_REPEAT'))
      .forEach(key => {
        const entityKey = key
          .replace('MOCK_ENTITY_', '')
          .replace('_REPEAT', '')
          .toLowerCase();
        envConfig.entities[entityKey] = parseInt(env[key], 10);
      });
    
    this.envConfig = envConfig;
  }
  
  /**
   * Load configuration from config file
   * @private
   */
  _loadFromFile() {
    const configPath = path.join(PROJECT_ROOT, 'mock-config.json');
    
    try {
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        this.userConfig = JSON.parse(fileContent);
      }
    } catch (error) {
      console.warn(`Error loading config from ${configPath}:`, error.message);
    }
  }
  
  /**
   * Deep merge multiple configuration objects
   * @private
   */
  _mergeConfigs(...configs) {
    return configs.reduce((result, current) => {
      if (!current) return result;
      
      Object.keys(current).forEach(key => {
        if (
          result[key] && 
          typeof result[key] === 'object' && 
          !Array.isArray(result[key]) && 
          typeof current[key] === 'object' && 
          !Array.isArray(current[key])
        ) {
          result[key] = this._mergeConfigs(result[key], current[key]);
        } else {
          result[key] = current[key];
        }
      });
      
      return result;
    }, {});
  }
}

// Export singleton instance
export const configManager = new ConfigManager();

// Export for testing or direct import
export default ConfigManager;
