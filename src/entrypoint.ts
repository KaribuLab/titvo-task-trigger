import { NestFactory } from '@nestjs/core'
import { Context, APIGatewayProxyHandlerV2, APIGatewayProxyCallbackV2, APIGatewayProxyResultV2, APIGatewayProxyEventV2 } from 'aws-lambda'
import { AppModule } from './app.module'
import { HttpStatus, INestApplicationContext, Logger as NestLogger } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import { ApiKeyNotFoundError, NoAuthorizedApiKeyError } from '@titvo/auth'
import { BatchIdNotFoundError, BatchIdRequiredError, RepositoryUrlRequiredError, RepositoryUrlInvalidError, RepositoryIdUndefinedException, TriggerTaskInputDto, TriggerTaskUseCase } from '@titvo/trigger'
import { findHeaderCaseInsensitive } from './utils/headers'
import { AppError } from '@titvo/shared'
const logger = new NestLogger('TaskTriggerHandler')

async function initApp (): Promise<INestApplicationContext> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true
  })
  await app.init()
  app.useLogger(app.get(Logger))
  app.flushLogs()
  return app
}

const app = await initApp()
const triggerTaskUseCase = app.get(TriggerTaskUseCase)

export const handler: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2, context: Context, callback: APIGatewayProxyCallbackV2): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.debug(`Received event: ${JSON.stringify(event)}`)
    const apiKey = findHeaderCaseInsensitive(event.headers, 'x-api-key')
    const body = JSON.parse(event.body ?? '{}')
    logger.log(`Received event: [source=${body.source as string}, args=${JSON.stringify(body.args)}]`)
    const input: TriggerTaskInputDto = {
      apiKey,
      source: body.source,
      args: body.args
    }
    const output = await triggerTaskUseCase.execute(input)
    return {
      headers: {
        'Content-Type': 'application/json'
      },
      statusCode: HttpStatus.OK,
      body: JSON.stringify({
        message: output.message,
        scan_id: output.scanId
      })
    }
  } catch (error) {
    logger.error('Error processing task trigger')
    logger.error(error)
    if (error instanceof ApiKeyNotFoundError) {
      return {
        headers: {
          'Content-Type': 'application/json'
        },
        statusCode: HttpStatus.UNAUTHORIZED,
        body: JSON.stringify({ message: error.message })
      }
    }
    if (error instanceof NoAuthorizedApiKeyError) {
      return {
        headers: {
          'Content-Type': 'application/json'
        },
        statusCode: HttpStatus.UNAUTHORIZED,
        body: JSON.stringify({ message: error.message })
      }
    }
    if (
      error instanceof BatchIdNotFoundError ||
      error instanceof BatchIdRequiredError ||
      error instanceof RepositoryUrlRequiredError ||
      error instanceof RepositoryUrlInvalidError ||
      error instanceof RepositoryIdUndefinedException ||
      error instanceof AppError
    ) {
      return {
        headers: {
          'Content-Type': 'application/json'
        },
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({ message: error.message })
      }
    }
    return {
      headers: {
        'Content-Type': 'application/json'
      },
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ message: (error as Error).message })
    }
  }
}
