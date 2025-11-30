import { NextApiRequest, NextApiResponse } from "next"
import { kv } from "@vercel/kv"
import fs from "fs"
import path from "path"

// 存储类型
type StorageType = "redis" | "file" | "memory"

// 内存存储（最后的后备方案）
let memoryStorage: { [slug: string]: number } = {}

// 文件存储路径（用于本地开发）
const STORAGE_FILE = path.join(process.cwd(), ".view-counts.json")

// 检测使用哪种存储方式
function getStorageType(): StorageType {
  // 如果有 Vercel KV 环境变量，使用 Redis
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return "redis"
  }
  // 本地开发环境，使用文件存储
  if (process.env.NODE_ENV === "development") {
    return "file"
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
        const views = await kv.get<number>(`views:${slug}`)
        return views || 0
      } catch (error) {
        console.error("Redis error, falling back to file storage:", error)
        return fileStorage.get(slug)
      }

    case "file":
      return fileStorage.get(slug)

    case "memory":
    default:
      return memoryStorage[slug] || 0
  }
}

// 增加浏览次数
async function incrementViews(slug: string): Promise<number> {
  const storageType = getStorageType()

  switch (storageType) {
    case "redis":
      try {
        const views = await kv.incr(`views:${slug}`)
        return views
      } catch (error) {
        console.error("Redis error, falling back to file storage:", error)
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
  } catch (error) {
    console.error("Error handling views:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

