import request from '@/utils/request'
import { HomeDataSchema } from '@/schema/homeSchema'

export const getHomeData = () => {
  return request.get('/site/home').then((res) => {
    const raw = res.data
    const r =
      raw != null && typeof raw === 'object'
        ? (raw as Record<string, unknown>)
        : {}
    return HomeDataSchema.parse({
      banner: Array.isArray(r.banner) ? r.banner : [],
      group: Array.isArray(r.group) ? r.group : [],
    })
  })
}