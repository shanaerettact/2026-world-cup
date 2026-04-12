import request from '@/utils/request'

export const getUserInfo = async () => {
  const { data } = await request.get<unknown>('/user/index')
  return data
}