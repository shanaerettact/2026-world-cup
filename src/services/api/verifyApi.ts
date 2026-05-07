import request from '@/utils/request'

/**
 * POST /user/verify（與文件相同）
 * - body: multipart form-data
 * - VerifyForm[name]：文字
 * - selfie：檔案（檔名須含 .zip；Postman 若設成 Text 僅為備註，實際須選 File）
 */
export type SubmitUserVerifyParams = {
  id: string
  selfie: File
}

export async function submitUserVerify(params: SubmitUserVerifyParams): Promise<unknown> {
  const body = new FormData()
  const id = params.id.trim()
  const file = params.selfie
  const filename = file.name || 'avatar.zip'

  body.append('VerifyForm[name]', id)
  body.append('selfie', file, filename)

  const { data } = await request.post<unknown>('/user/verify', body, {
    headers: {
      Accept: 'application/json, text/plain, */*',
    },
  })
  return data
}
