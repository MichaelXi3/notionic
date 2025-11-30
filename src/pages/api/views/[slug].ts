import { NextApiRequest, NextApiResponse } from "next"
import { kv } from "@vercel/kv"
import { createClient } from "redis"
import fs from "fs"
import path from "path"

// 存储类型
type StorageType = "redis" | "file" | "memory"

// 内存存储（最后的后备方案）
let memoryStorage: { [slug: string]: number } = {}

// 文件存储路径（用于本地开发）
const STORAGE_FILE = path.join(process.cwd(), ".view-counts.json")

// Redis 客户端（用于标准 Redis 连接）
let redisClient: ReturnType<typeof createClient> | null = null
let redisClientPromise: Promise<ReturnType<typeof createClient>> | null = null

// 初始化标准 Redis 客户端（如果需要，复用连接）
async function getRedisClient() {
  if (!process.env.REDIS_URL) {
    return null
  }
  
  // 如果客户端已连接，直接返回
  if (redisClient?.isReady) {
    return redisClient
  }
  
  // 如果正在连接，等待连接完成
  if (redisClientPromise) {
    return redisClientPromise
  }
  
  // 创建新的连接
  redisClientPromise = (async () => {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error("[ViewCount] Redis connection failed after 10 retries")
              return false
            }
            return Math.min(retries * 100, 3000)
          },
        },
      })
      
      redisClient.on("error", (err) => {
        console.error("[ViewCount] Redis Client Error:", err)
      })
      
      redisClient.on("connect", () => {
        console.log("[ViewCount] Redis connecting...")
      })
      
      redisClient.on("ready", () => {
        console.log("[ViewCount] Redis connected and ready")
      })
      
      await redisClient.connect()
      redisClientPromise = null // 连接成功后清除 promise
      return redisClient
    } catch (error) {
      redisClientPromise = null // 连接失败后清除 promise
      throw error
    }
  })()
  
  return redisClientPromise
}

// 检测使用哪种存储方式
function getStorageType(): StorageType {
  // 检查是否有 Redis 环境变量（多种格式）
  const hasKvRestApi = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  const hasKvUrl = process.env.KV_URL && (process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN)
  const hasRedisUrl = process.env.REDIS_URL
  
  // 如果有任何一种 Redis 配置，使用 Redis
  if (hasKvRestApi || hasKvUrl || hasRedisUrl) {
    if (hasRedisUrl) {
      console.log("[ViewCount] Using Redis storage (REDIS_URL)")
    } else {
      console.log("[ViewCount] Using Redis storage (Vercel KV)")
    }
    return "redis"
  }
  
  // 本地开发环境，使用文件存储
  if (process.env.NODE_ENV === "development") {
    console.log("[ViewCount] Using file storage (development)")
    return "file"
  }
  
  // 生产环境但没有 KV，警告并使用内存（临时）
  if (process.env.NODE_ENV === "production") {
    console.warn("[ViewCount] WARNING: Production environment but no Redis configured! Using memory storage (data will be lost on restart)")
  }
  
  // 最后使用内存存储
  return "memory"
}

// 文件存储操作
const fileStorage = {
  async get(slug: string): Promise<number> {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STORAGE_FILE, "utf-8"))
        return data[slug] || 0
      }
      return 0
    } catch (error) {
      console.error("Error reading from file storage:", error)
      return 0
    }
  },

  async set(slug: string, views: number): Promise<void> {
    try {
      let data: { [key: string]: number } = {}
      if (fs.existsSync(STORAGE_FILE)) {
        data = JSON.parse(fs.readFileSync(STORAGE_FILE, "utf-8"))
      }
      data[slug] = views
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error("Error writing to file storage:", error)
    }
  },

  async increment(slug: string): Promise<number> {
    const current = await this.get(slug)
    const newValue = current + 1
    await this.set(slug, newValue)
    return newValue
  },
}

// 获取浏览次数
async function getViews(slug: string): Promise<number> {
  const storageType = getStorageType()

  switch (storageType) {
    case "redis":
      try {
        const key = `views:${slug}`
        
        // 如果使用 REDIS_URL，使用标准 Redis 客户端
        if (process.env.REDIS_URL) {
          const client = await getRedisClient()
          if (client) {
            const views = await client.get(key)
            const count = views ? parseInt(views, 10) : 0
            console.log(`[ViewCount] GET ${slug}: ${count} (from Redis via REDIS_URL)`)
            return count
          }
        }
        
        // 否则使用 Vercel KV
        const views = await kv.get<number>(key)
        console.log(`[ViewCount] GET ${slug}: ${views || 0} (from Vercel KV)`)
        return views || 0
      } catch (error: any) {
        console.error("[ViewCount] Redis GET error:", error?.message || error)
        // 在生产环境不要降级到文件存储（文件系统是只读的）
        if (process.env.NODE_ENV === "production") {
          console.error("[ViewCount] Production environment: Cannot fallback to file storage")
          throw error
        }
        return fileStorage.get(slug)
      }

    case "file":
      return fileStorage.get(slug)

    case "memory":
    default:
      const views = memoryStorage[slug] || 0
      console.log(`[ViewCount] GET ${slug}: ${views} (from memory)`)
      return views
  }
}

// 增加浏览次数
async function incrementViews(slug: string): Promise<number> {
  const storageType = getStorageType()

  switch (storageType) {
    case "redis":
      try {
        const key = `views:${slug}`
        
        // 如果使用 REDIS_URL，使用标准 Redis 客户端
        if (process.env.REDIS_URL) {
          const client = await getRedisClient()
          if (client) {
            const views = await client.incr(key)
            console.log(`[ViewCount] POST ${slug}: ${views} (incremented in Redis via REDIS_URL)`)
            return views
          }
        }
        
        // 否则使用 Vercel KV
        const views = await kv.incr(key)
        console.log(`[ViewCount] POST ${slug}: ${views} (incremented in Vercel KV)`)
        return views
      } catch (error: any) {
        console.error("[ViewCount] Redis INCR error:", error?.message || error)
        // 在生产环境不要降级到文件存储（文件系统是只读的）
        if (process.env.NODE_ENV === "production") {
          console.error("[ViewCount] Production environment: Cannot fallback to file storage")
          throw error
        }
        return fileStorage.increment(slug)
      }

    case "file":
      return fileStorage.increment(slug)

    case "memory":
    default:
      if (!memoryStorage[slug]) {
        memoryStorage[slug] = 0
      }
      memoryStorage[slug] += 1
      console.log(`[ViewCount] POST ${slug}: ${memoryStorage[slug]} (incremented in memory)`)
      return memoryStorage[slug]
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ message: "Invalid slug" })
  }

  // 记录存储类型（用于调试）
  const storageType = getStorageType()
  console.log(`[ViewCount] ${req.method} ${slug} - Storage: ${storageType}`)

  try {
    if (req.method === "GET") {
      const views = await getViews(slug)
      return res.status(200).json({ slug, views })
    } else if (req.method === "POST") {
      const views = await incrementViews(slug)
      return res.status(200).json({ slug, views })
    } else {
      return res.status(405).json({ message: "Method not allowed" })
    }
  } catch (error: any) {
    console.error("[ViewCount] Error handling views:", {
      method: req.method,
      slug,
      error: error?.message || error,
      stack: error?.stack,
    })
    return res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error?.message : undefined
    })
  }
}

