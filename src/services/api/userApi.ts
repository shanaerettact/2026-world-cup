import request from '@/utils/request'

export const getUserInfo = async () => {
  const { data } = await request.post<unknown>('/user/index', new FormData())
  return data
}