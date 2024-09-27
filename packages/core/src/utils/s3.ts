import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import { Config } from '@/interface'

export class TmpFileStorage {
  private s3Client: S3Client
  private readonly bucket: string
  private readonly keyPrefix: string = ''
  private readonly baseURL: string = ''
  // env sdk, env
  constructor(config: Config) {
    const s3 = new S3Client({
      region: config.uploadImageToS3.region ?? 'auto',
      endpoint: config.uploadImageToS3.endpoint,
      credentials: {
        accessKeyId: config.uploadImageToS3.s3AccessKey,
        secretAccessKey: config.uploadImageToS3.s3SecretKey,
      },
    })
    this.bucket = config.uploadImageToS3.bucketName
    this.keyPrefix = config.uploadImageToS3.keyPrefix
    this.baseURL = config.uploadImageToS3.baseURL
    this.s3Client = s3
  }

  async uploadImg(buffer: Buffer, mimeType?: string): Promise<string> {
    // md5 digest
    const md5 = crypto.createHash('md5').update(buffer).digest('hex')
    const key = this.keyPrefix ? `${this.keyPrefix}-${md5}` : md5
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType ?? 'image/png',
    }
    const command = new PutObjectCommand(params)
    const data = await this.s3Client.send(command)
    return `${this.baseURL}${key}`
  }
}
