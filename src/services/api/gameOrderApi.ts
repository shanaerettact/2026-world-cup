import request from '@/utils/request'

export type GameOrderListParams = {
  status: string
  start_time: string
  end_time: string
}

export const getGameOrderList = (params: GameOrderListParams) => {
  const formData = new FormData()
  formData.append('status', String(params.status))
  formData.append('start_time', String(params.start_time))
  formData.append('end_time', String(params.end_time))
  return request.post('/user/game-order', formData)
}