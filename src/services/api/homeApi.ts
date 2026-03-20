import request from '@/utils/request'
import { HomeDataSchema } from '@/schema/homeSchema'

export const getHomeData = () => {
  return request.get('/site/home').then(res => HomeDataSchema.parse(res))
}