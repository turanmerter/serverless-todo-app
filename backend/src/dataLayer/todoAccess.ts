import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly s3: AWS.S3 = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosIndex = process.env.INDEX_NAME,
        private readonly bucketName = process.env.TODO_IMAGES_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {
    }

    async getTodosForUser(userId: string): Promise<TodoItem[]> {

        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        if (result.Count === 0)
            return [] as TodoItem[]
        else {
            const items = result.Items
            return items as TodoItem[]
        }
    }

    async getTodo(todoId: string): Promise<TodoItem> {

        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosIndex,
            KeyConditionExpression: 'todoId = :todoId',
            ExpressionAttributeValues: {
                ':todoId': todoId
            }
        }).promise()

        if (result.Count !== 0)
            return result.Items[0] as TodoItem
        else
            return null
    }

    async createTodo(newTodoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todosTable,
            Item: newTodoItem
        }).promise()

        return newTodoItem
    }

    async deleteTodo(todoId: string) {

        const deletee = await this.getTodo(todoId);

        if (deletee) {
            await this.docClient.delete({
                TableName: this.todosTable,
                Key: {
                    userId: deletee.userId,
                    dueDate: deletee.dueDate
                }
            }).promise()
        }


        return
    }

    async getTodoAttachmentUploadUrl(todoId: string): Promise<string> {

        const todo = await this.getTodo(todoId);
        if (todo) {
            const url = this.s3.getSignedUrl('putObject', {
                Bucket: this.bucketName,
                Key: todoId,
                Expires: parseInt(this.urlExpiration)
            })

            return url
        } else {
            return null
        }

    }

    async getTodoAttachmentUrl(todoId: string): Promise<string> {

        await this.s3.headObject({
            Bucket: this.bucketName,
            Key: todoId
        }).promise();

        return this.s3.getSignedUrl('getObject', {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: parseInt(this.urlExpiration)
        });
    }

    async updateTodo(todoId: string, updatedTodo: TodoUpdate) {

        const updatee = await this.getTodo(todoId);

        if (updatee) {

            await this.docClient.update({
                TableName: this.todosTable,
                Key: {
                    userId: updatee.userId,
                    dueDate: updatee.dueDate
                },
                UpdateExpression: "set dueDate = :dd, #nm=:name, done=:done",
                ExpressionAttributeValues: {
                    ":dd": updatedTodo.dueDate,
                    ":name": updatedTodo.name,
                    ":done": updatedTodo.done
                },
                ExpressionAttributeNames: {
                    "#nm": 'name'
                },
                ReturnValues: "UPDATED_NEW"
            }).promise()
        }

        return
    }
}



