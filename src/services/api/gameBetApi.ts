import request from '@/utils/request'

export type GameBetPayload = {
  id: string
  amount: string | number
  /** 買保險：1 有、2 沒 */
  escape: '1' | '2'
}

export const postGameBet = async (payload: GameBetPayload) => {
  const formData = new FormData()
  formData.append('id', String(payload.id))
  formData.append('amount', String(payload.amount))
  formData.append('escape', payload.escape)
  return request.post('/game/bet', formData)
}
