import { NotionAPI } from "notion-client"
import { retryWithBackoff } from "src/libs/utils/retry"

export const getRecordMap = async (pageId: string) => {
  const api = new NotionAPI()
  
  return retryWithBackoff(async () => {
    return await api.getPage(pageId)
  })
}
