import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import * as todos from '../../bussinessLogic/todos'
import { createLogger } from '../../utils/logger'

const logger = createLogger('uploadUrlGenerator')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event: ', event)
  const todoId = event.pathParameters.todoId

  try {
    const url = await todos.getTodoAttachmentUploadUrl(todoId)
    logger.info('Upload URL is created: ', url)
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        "uploadUrl": url
      })
    }
  } catch (e) {
    logger.error('Error occured: ', event)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        e
      })
    }
  }
}
