import request from '@/utils/request'

/** 冠軍賽下注：`id` 為線別／賠率項 id（與 BetSelection.betApiId 一致） */
export const postBetChampion = async (id: string, amount: number) => {
  const formData = new FormData()
  formData.append('id', id)
  formData.append('amount', String(amount))
  return request.post('/game/bet-champion', formData)
}