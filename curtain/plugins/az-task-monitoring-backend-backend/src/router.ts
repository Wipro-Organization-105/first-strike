/*import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { todoListServiceRef } from './services/TodoListService';

export async function createRouter({
  httpAuth,
  todoList,
}: {
  httpAuth: HttpAuthService;
  todoList: typeof todoListServiceRef.T;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started
  const todoSchema = z.object({
    title: z.string(),
    entityRef: z.string().optional(),
  });

  router.post('/todos', async (req, res) => {
    const parsed = todoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await todoList.createTodo(parsed.data, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    res.status(201).json(result);
  });

  router.get('/todos', async (_req, res) => {
    res.json(await todoList.listTodos());
  });

  router.get('/todos/:id', async (req, res) => {
    res.json(await todoList.getTodo({ id: req.params.id }));
  });

  return router;
}*/

import express, { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.WECOLLAB_DATA_DIR || '/home/ec2-user/BS-Wipro/wecollab/azure/task/data';

async function readJson(fileName: string) {
  const filePath = path.join(DATA_DIR, fileName);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

export async function createRouter(): Promise<Router> {
  const router = Router();
  router.use(express.json());

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      dataDir: DATA_DIR,
    });
  });

  router.get('/metadata', async (_req, res) => {
    try {
      const data = await readJson('metadata.json');
      res.json(data);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to read metadata.json',
        details: error.message,
      });
    }
  });

  router.get('/work-items', async (_req, res) => {
    try {
      const data = await readJson('work_items.json');
      res.json(data);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to read work_items.json',
        details: error.message,
      });
    }
  });

  router.get('/summary', async (_req, res) => {
    try {
      const data = await readJson('summary.json');
      res.json(data);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to read summary.json',
        details: error.message,
      });
    }
  });

  return router;
}
``
