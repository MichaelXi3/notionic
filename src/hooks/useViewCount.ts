import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface ViewCountData {
  slug: string
  views: number
}

// 获取浏览次数
const fetchViewCount = async (slug: string): Promise<ViewCountData> => {
  const response = await fetch(`/api/views/${slug}`)
  if (!response.ok) {
    throw new Error("Failed to fetch view count")
  }
  return response.json()
}

// 增加浏览次数
const incrementViewCount = async (slug: string): Promise<ViewCountData> => {
  const response = await fetch(`/api/views/${slug}`, {
    method: "POST",
  })
  if (!response.ok) {
    throw new Error("Failed to increment view count")
  }
  return response.json()
}

export const useViewCount = (slug: string, shouldIncrement: boolean = true) => {
  const queryClient = useQueryClient()
  const [hasIncremented, setHasIncremented] = useState(false)

  // 查询浏览次数
  const { data, isLoading, error } = useQuery({
    queryKey: ["viewCount", slug],
    queryFn: () => fetchViewCount(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
  })

  // 增加浏览次数的 mutation
  const incrementMutation = useMutation({
    mutationFn: incrementViewCount,
    onSuccess: (data) => {
      // 更新缓存
      queryClient.setQueryData(["viewCount", slug], data)
    },
  })

  // 在组件挂载时增加浏览次数（仅一次）
  useEffect(() => {
    if (shouldIncrement && slug && !hasIncremented) {
      // 延迟一点时间再增加，避免快速跳转导致误计数
      const timer = setTimeout(() => {
        incrementMutation.mutate(slug)
        setHasIncremented(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, shouldIncrement, hasIncremented])

  return {
    views: data?.views || 0,
    isLoading,
    error,
  }
}

