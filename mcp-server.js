#!/usr/bin/env node
/**
 * GoHighLevel MCP Server - Local MCP Protocol Implementation
 * This wraps the HTTP client to work with the MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import GoHighLevelMCPClient from './index.js';

const client = new GoHighLevelMCPClient();

const server = new Server(
  {
    name: 'gohighlevel-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all available tools
const tools = [
  {
    name: 'ghl_get_contacts',
    description: 'Get all contacts from GoHighLevel',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Limit number of results' },
        skip: { type: 'number', description: 'Skip number of results' },
      },
    },
  },
  {
    name: 'ghl_get_contact',
    description: 'Get a specific contact by ID',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact ID', required: true },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'ghl_create_contact',
    description: 'Create a new contact',
    inputSchema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['email'],
    },
  },
  {
    name: 'ghl_update_contact',
    description: 'Update an existing contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', required: true },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'ghl_search_conversations',
    description: 'Search conversations',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string' },
        status: { type: 'string' },
      },
    },
  },
  {
    name: 'ghl_get_messages',
    description: 'Get messages from a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', required: true },
      },
      required: ['conversationId'],
    },
  },
  {
    name: 'ghl_send_message',
    description: 'Send a message to a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', required: true },
        message: { type: 'string', required: true },
      },
      required: ['conversationId', 'message'],
    },
  },
  {
    name: 'ghl_get_location',
    description: 'Get location/sub-account details',
    inputSchema: {
      type: 'object',
      properties: {
        locationId: { type: 'string' },
      },
    },
  },
  {
    name: 'ghl_search_opportunities',
    description: 'Search opportunities',
    inputSchema: {
      type: 'object',
      properties: {
        pipelineId: { type: 'string' },
        status: { type: 'string' },
      },
    },
  },
];

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'ghl_get_contacts':
        result = await client.getContacts(args);
        break;
      case 'ghl_get_contact':
        result = await client.getContact(args.contactId);
        break;
      case 'ghl_create_contact':
        result = await client.createContact(args);
        break;
      case 'ghl_update_contact':
        result = await client.updateContact(args.contactId, args);
        break;
      case 'ghl_search_conversations':
        result = await client.searchConversations(args);
        break;
      case 'ghl_get_messages':
        result = await client.getMessages(args.conversationId);
        break;
      case 'ghl_send_message':
        result = await client.sendMessage(args.conversationId, args.message);
        break;
      case 'ghl_get_location':
        result = await client.getLocation(args.locationId);
        break;
      case 'ghl_search_opportunities':
        result = await client.searchOpportunities(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GoHighLevel MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
