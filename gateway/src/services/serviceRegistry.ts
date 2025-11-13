import axios from 'axios';
import { ServiceConfig, HealthStatus } from '../types';
import { SERVICES, GATEWAY_CONFIG } from '../config/services';

/**
 * Service Registry
 *
 * ANALOGY: Think of this as the restaurant manager who constantly checks:
 * - "Is the pizza kitchen open?" ✅
 * - "Is the delivery department working?" ✅
 * - "Is the membership desk responding?" ❌ (Uh oh!)
 *
 * This helps the gateway know which services are available and healthy
 */

class ServiceRegistry {
  private services: Map<string, ServiceConfig> = new Map();
  private healthStatuses: Map<string, HealthStatus> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeServices();
  }

  /**
   * Initialize service registry with configured services
   */
  private initializeServices(): void {
    SERVICES.forEach(service => {
      this.services.set(service.name, service);
      this.healthStatuses.set(service.name, {
        service: service.name,
        status: 'unknown',
        lastCheck: new Date()
      });
    });

    console.log(`📋 Registered ${this.services.size} services:`,
      Array.from(this.services.keys()).join(', '));
  }

  /**
   * Get service configuration by name
   */
  getService(serviceName: string): ServiceConfig | undefined {
    return this.services.get(serviceName);
  }

  /**
   * Get service by route prefix
   *
   * EXAMPLE: "/api/products/123" → returns product-service config
   */
  getServiceByRoute(routePath: string): ServiceConfig | undefined {
    // Import route mappings to find which service handles this route
    const { ROUTE_MAPPINGS } = require('../config/services');

    const mapping = ROUTE_MAPPINGS.find((mapping: any) =>
      routePath.startsWith(mapping.prefix)
    );

    if (!mapping) {
      return undefined;
    }

    return this.services.get(mapping.serviceName);
  }

  /**
   * Check health of a single service
   *
   * ANALOGY: Like calling a kitchen to ask "Are you there? Are you working?"
   */
  async checkServiceHealth(serviceName: string): Promise<HealthStatus> {
    const service = this.services.get(serviceName);

    if (!service) {
      return {
        service: serviceName,
        status: 'unknown',
        lastCheck: new Date(),
        error: 'Service not found in registry'
      };
    }

    const startTime = Date.now();

    try {
      await axios.get(
        `${service.url}${service.healthCheck}`,
        {
          timeout: service.timeout || 5000,
          validateStatus: (status) => status === 200
        }
      );

      const responseTime = Date.now() - startTime;

      const healthStatus: HealthStatus = {
        service: serviceName,
        status: 'healthy',
        responseTime,
        lastCheck: new Date()
      };

      this.healthStatuses.set(serviceName, healthStatus);
      return healthStatus;

    } catch (error: any) {
      const healthStatus: HealthStatus = {
        service: serviceName,
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error.message
      };

      this.healthStatuses.set(serviceName, healthStatus);
      console.error(`❌ Service ${serviceName} is unhealthy:`, error.message);
      return healthStatus;
    }
  }

  /**
   * Check health of all services
   */
  async checkAllServicesHealth(): Promise<HealthStatus[]> {
    const healthChecks = Array.from(this.services.keys()).map(serviceName =>
      this.checkServiceHealth(serviceName)
    );

    return Promise.all(healthChecks);
  }

  /**
   * Get current health status of a service
   */
  getHealthStatus(serviceName: string): HealthStatus | undefined {
    return this.healthStatuses.get(serviceName);
  }

  /**
   * Get health status of all services
   */
  getAllHealthStatuses(): HealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  /**
   * Start periodic health checks
   *
   * ANALOGY: Like having a manager do rounds every 30 seconds
   * to check on all departments
   */
  startHealthChecks(): void {
    console.log('🏥 Starting periodic health checks...');

    // Initial health check
    this.checkAllServicesHealth();

    // Set up periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.checkAllServicesHealth();
    }, GATEWAY_CONFIG.healthCheckInterval);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      console.log('🛑 Stopped health checks');
    }
  }

  /**
   * Check if a service is healthy
   */
  isServiceHealthy(serviceName: string): boolean {
    const status = this.healthStatuses.get(serviceName);
    return status?.status === 'healthy';
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

// Export singleton instance
export const serviceRegistry = new ServiceRegistry();
