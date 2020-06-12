import * as uuid from 'uuid'
import { TodoAccess } from '../dataLayer/todoAccess'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import { CreateTodoRequest } from "../requests/createTodoRequest";
import { UpdateTodoRequest } from "../requests/updateTodoRequest";

const todoAccess = new TodoAccess()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {

    const result = await todoAccess.getTodosForUser(userId);
    if (result) {

        for (const item of result) {
            item.attachmentUrl = await todoAccess.getTodoAttachmentUrl(item.todoId)
        }
    }

    return result;
}

export async function createTodo(userId: string, newTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuid.v4()

    const newTodoItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        name: newTodoRequest.name,
        dueDate: newTodoRequest.dueDate,
        done: false
    } as TodoItem;

    return todoAccess.createTodo(newTodoItem)
}

export async function deleteTodo(todoId: string) {
    return todoAccess.deleteTodo(todoId)
}

export async function getTodoAttachmentUploadUrl(todoId: string): Promise<string> {
    return todoAccess.getTodoAttachmentUploadUrl(todoId)
}

export async function updateTodo(todoId: string, updatedTodoRequest: UpdateTodoRequest) {
    const todoUpdate = {
        name: updatedTodoRequest.name,
        dueDate: updatedTodoRequest.dueDate,
        done: updatedTodoRequest.done
    } as TodoUpdate;

    return todoAccess.updateTodo(todoId, todoUpdate)
}