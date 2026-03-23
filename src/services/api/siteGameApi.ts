import request from '@/utils/request'
import { GameDetailDataSchema } from '@/schema/siteGameSchema'

export const getSiteGame = async (id: number) => {
  const formData = new FormData()
  formData.append('id', String(id))
  return request.post('/site/game', formData).then((res) => {
    return GameDetailDataSchema.parse(res)
  })
}