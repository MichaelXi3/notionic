import { NextApiRequest, NextApiResponse } from "next"
import { kv } from "@vercel/kv"

/**
 * 诊断 API - 检查 View Count 存储配置
 * 访问: /api/views/debug
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 只在开发环境或明确允许时启用
  const isDevelopment = process.env.NODE_ENV === "development"
  const allowDebug = process.env.ALLOW_VIEW_COUNT_DEBUG === "true"

  if (!isDevelopment && !allowDebug) {
    return res.status(403).json({ message: "Debug endpoint disabled in production" })
  }

  const diagnostics = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    storage: {
      type: "unknown" as string,
      kv: {
        configured: false,
        accessible: false,
        error: null as string | null,
        envVars: {
          KV_REST_API_URL: !!process.env.KV_REST_API_URL,
          KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
          KV_URL: !!process.env.KV_URL,
          KV_REST_API_READ_ONLY_TOKEN: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
          REDIS_URL: !!process.env.REDIS_URL,
        },
      },
    },
  }

  // 检测存储类型
  const hasKvUrl = process.env.KV_REST_API_URL || process.env.KV_URL
  const hasKvToken = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN

  if (hasKvUrl && hasKvToken) {
    diagnostics.storage.type = "redis"
    diagnostics.storage.kv.configured = true

    // 测试 KV 连接
    try {
      const testKey = "view-count-test"
      await kv.set(testKey, "test", { ex: 10 }) // 10秒后过期
      const value = await kv.get(testKey)
      
      if (value === "test") {
        diagnostics.storage.kv.accessible = true
        await kv.del(testKey) // 清理测试键
      } else {
        diagnostics.storage.kv.accessible = false
        diagnostics.storage.kv.error = "Test write/read failed"
      }
    } catch (error: any) {
      diagnostics.storage.kv.accessible = false
      diagnostics.storage.kv.error = error?.message || String(error)
    }
  } else if (process.env.NODE_ENV === "development") {
    diagnostics.storage.type = "file"
  } else {
    diagnostics.storage.type = "memory"
    diagnostics.storage.kv.error = "No KV environment variables found"
  }

  return res.status(200).json(diagnostics)
}

