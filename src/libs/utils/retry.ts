/**
 * 重试函数，用于处理临时性错误（如 Notion API 503）
 * @param fn 要重试的异步函数
 * @param maxRetries 最大重试次数
 * @param delay 初始延迟时间（毫秒）
 * @returns 函数执行结果
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      const isLastAttempt = i === maxRetries - 1
      
      // 检查是否是可重试的错误
      const is503Error = 
        error?.statusCode === 503 || 
        error?.response?.statusCode === 503 ||
        error?.message?.includes('503') ||
        error?.message?.includes('Service Unavailable')
      
      if (isLastAttempt || !is503Error) {
        console.error(`Request failed${is503Error ? ' (503)' : ''}, no more retries`)
        throw error
      }
      
      // 指数退避：1s, 2s, 4s
      const waitTime = delay * Math.pow(2, i)
      console.log(`Notion API temporarily unavailable, retrying in ${waitTime}ms... (attempt ${i + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw new Error("Max retries reached")
}

