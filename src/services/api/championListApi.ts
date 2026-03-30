import { ChampionListDataSchema } from '@/schema/championListSchema'
import request from '@/utils/request'

export const getChampionList = async () => {
  const res = await request.postForm('/site/champion-list')
  return ChampionListDataSchema.parse(res)
}