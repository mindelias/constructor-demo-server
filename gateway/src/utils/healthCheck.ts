import { Router, Request, Response } from 'express';
import { serviceRegistry } from '../services/serviceRegistry';

/**
 * Health Check Utilities
 *
 * ANALOGY: Like a restaurant manager's dashboard that shows:
 * - Is the front door open? ✅ (Gateway is running)
 * - Is the pizza kitchen working? ✅
 * - Is the delivery department online? ❌ (Problem!)
 *
 * This helps monitoring tools (like Kubernetes, AWS ELB) know if
 * everything is working properly.
 */

const router = Router();

/**
 * Simple health check - is the gateway alive?
 *
 * GET /health
 * Returns: 200 OK if gateway is running
 *
 * ANALOGY: Like checking if the lights are on
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'api-gateway'
  });
});

/**
 * Readiness check - is the gateway ready to serve traffic?
 *
 * GET /ready
 * Returns: 200 OK if all critical services are healthy
 *
 * ANALOGY: Like checking if the restaurant has:
 * - Ingredients in stock
 * - Staff on duty
 * - Kitchen equipment working
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check all services
    const healthStatuses = await serviceRegistry.checkAllServicesHealth();

    // Count healthy vs unhealthy services
    const healthy = healthStatuses.filter(s => s.status === 'healthy').length;
    const unhealthy = healthStatuses.filter(s => s.status === 'unhealthy').length;
    const total = healthStatuses.length;

    // Gateway is ready if at least one service is healthy
    const isReady = healthy > 0;

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      services: {
        total,
        healthy,
        unhealthy
      },
      details: healthStatuses
    });

  } catch (error: any) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Liveness check - is the gateway still alive?
 *
 * GET /live
 * Returns: 200 OK if process is alive and not deadlocked
 *
 * ANALOGY: Like checking if the manager is still breathing
 * (More serious than just checking if lights are on)
 */
router.get('/live', (_req: Request, res: Response) => {
  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024)
  };

  // Check if we're running out of memory (above 90% of heap)
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const isHealthy = heapUsedPercent < 90;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'alive' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: memUsageMB,
    heapUsedPercent: Math.round(heapUsedPercent)
  });
});

/**
 * Detailed status of all services
 *
 * GET /status
 * Returns: Detailed health status of all registered services
 *
 * ANALOGY: Like a detailed report showing each department's status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const healthStatuses = await serviceRegistry.checkAllServicesHealth();

    // Calculate statistics
    const stats = {
      total: healthStatuses.length,
      healthy: healthStatuses.filter(s => s.status === 'healthy').length,
      unhealthy: healthStatuses.filter(s => s.status === 'unhealthy').length,
      unknown: healthStatuses.filter(s => s.status === 'unknown').length
    };

    // Calculate average response time
    const responseTimes = healthStatuses
      .filter(s => s.responseTime !== undefined)
      .map(s => s.responseTime!);

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    res.json({
      timestamp: new Date().toISOString(),
      gateway: {
        status: 'running',
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      },
      services: {
        stats,
        avgResponseTime: `${avgResponseTime}ms`,
        details: healthStatuses.map(s => ({
          name: s.service,
          status: s.status,
          responseTime: s.responseTime ? `${s.responseTime}ms` : undefined,
          lastCheck: s.lastCheck,
          error: s.error
        }))
      }
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
});

/**
 * Service discovery endpoint
 *
 * GET /services
 * Returns: List of all registered services and their endpoints
 */
router.get('/services', (_req: Request, res: Response) => {
  const serviceNames = serviceRegistry.getServiceNames();

  const services = serviceNames.map(name => {
    const service = serviceRegistry.getService(name);
    const health = serviceRegistry.getHealthStatus(name);

    return {
      name,
      url: service?.url,
      status: health?.status,
      lastCheck: health?.lastCheck
    };
  });

  res.json({
    count: services.length,
    services
  });
});

export default router;
