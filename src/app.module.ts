import { Module } from '@nestjs/common'
import pino from 'pino'
import { LoggerModule } from 'nestjs-pino'
import { BatchModule, ConfigModule, SecretModule } from '@titvo/aws'
import { TaskModule } from '@infrastructure/task/task.module'
@Module({
  imports: [
    TaskModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level (label: string): { level: string } {
            return { level: label }
          }
        }
      }
    }),
    ConfigModule.forRoot({
      configOptions: {
        tableName: process.env.CONFIG_TABLE_NAME as string,
        awsStage: process.env.AWS_STAGE ?? 'prod',
        awsEndpoint: process.env.AWS_ENDPOINT ?? 'http://localhost:4566'
      },
      isGlobal: true
    }),
    SecretModule.forRoot({
      awsStage: process.env.AWS_STAGE ?? 'prod',
      awsEndpoint: process.env.AWS_ENDPOINT ?? 'http://localhost:4566'
    }),
    BatchModule.forRoot({
      batchServiceOptions: {
        awsEndpoint: process.env.AWS_ENDPOINT ?? 'http://localhost:4566',
        awsStage: process.env.AWS_STAGE ?? 'prod'
      },
      isGlobal: true
    })
  ]
})
export class AppModule {}
