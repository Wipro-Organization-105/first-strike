import express from 'express';
import Router from 'express-promise-router';
import { z } from 'zod';

import { InputError } from '@backstage/errors';
import type { LoggerService, HttpAuthService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';

import { todoListServiceRef, type TodoListService } from './services/TodoListService';

// Prefer Node 20 global fetch; fall back to node-fetch only if needed
async function getFetch(): Promise<typeof fetch> {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  const mod = await import('node-fetch');
  // @ts-expect-error: node-fetch types differ slightly from built-in fetch
  return (mod.default || mod) as typeof fetch;
}

export interface RouterOptions {
  logger: LoggerService;
  config: Config;
  httpAuth: HttpAuthService;
  todoList: TodoListService; // the actual service instance, not the ref
}

export async function createRouter(options: RouterOptions): Promise<express.Router> {
  const { logger, config, httpAuth, todoList } = options;

  const router = Router();
  router.use(express.json());

  // ---- Health check (optional but useful) ----
  router.get('/healthz', async (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ---- TODOS endpoints (uses HttpAuth + your TodoListService) ----
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

  // ---- External data endpoint (reads from app-config.yaml) ----
  router.get('/external-data', async (_req, res) => {
    // Read secure config
    const apiUrl = config.getString('myData.baseUrl');
    // token can be optional if your API supports public calls
    const apiToken = config.getOptionalString('myData.apiToken');

    try {
      const $fetch = await getFetch();

      const externalResponse = await $fetch(`${apiUrl}/api/data`, {
        headers: {
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        'Content-Type': 'application/json',
        },
      });

      //const externalResponse = await $fetch(`${apiUrl}/items`, {
        //headers: {
         // ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
         // 'Content-Type': 'application/json',
       // },
     // });

      if (!externalResponse.ok) {
        const text = await externalResponse.text().catch(() => '');
        throw new Error(`API Error: ${externalResponse.status} ${externalResponse.statusText} ${text}`);
      }

      const data = await externalResponse.json();
      res.json(data);
    } catch (error) {
      logger.error(`Failed to fetch external data: ${String(error)}`);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  return router;
}
