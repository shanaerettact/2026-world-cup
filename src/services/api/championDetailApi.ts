import request from '@/utils/request'
import { ChampionGameDataSchema } from '@/schema/championDetailSchema'

/** 與 championList／siteGame 相同：走 /api 代理；攔截器已 unwrap `data` */
export const getChampionDetail = async (id: string) => {
  const formData = new FormData()
  formData.append('id', id)
  const res = await request.post('/site/champion', formData)
  return ChampionGameDataSchema.parse(res)
}