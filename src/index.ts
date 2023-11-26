import fastify, { FastifyRequest } from "fastify";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
const server = fastify();

import postgres from "@fastify/postgres";

const chat = new ChatOpenAI({
  modelName: "gpt-4",
  openAIApiKey: Bun.env.OPEN_API_KEY,
});

server.register(postgres, {
  connectionString: Bun.env.CONNECTION_STRING,
});

server.post(
  "/ping",
  async (request: FastifyRequest<{ Body: { question: string } }>, reply) => {
    const client = await server.pg.connect();
    const conversationId = request.headers["x-forwarded-for"];

    try {
      await client.query(
        "INSERT INTO conversation (conversation_id, content) VALUES ($1, $2)",
        [conversationId, request.body.question]
      );
    } catch (error) {
      reply.status(500).send("Error while adding conversation_id");
    }

    let conversation = [] as string[];

    try {
      const result = await client.query(
        `SELECT content FROM conversation WHERE conversation_id ='${conversationId}'`
      );
      result.rows.forEach((row) => {
        conversation.push(row.content);
      });
    } catch (err) {
      console.error("Error fetching conversation IDs:", err);
      reply.status(500).send("Error fetching conversation IDs");
    }

    const { content } = await chat.call([
      new SystemMessage("Be ultra-concise." + conversation.join("\n")),
      new HumanMessage(request.body.question),
    ]);

    reply.send({ reply: content });
  }
);

server.post(
  "/serp",
  async (request: FastifyRequest<{ Body: { question: string } }>, reply) => {
    const { getJson } = require("serpapi");

    const response = await getJson({
      engine: "google",
      api_key: Bun.env.SERP_API_KEY,
      q: request.body.question,
    });

    reply.send({ reply: response["organic_results"][0].link });
  }
);

server.listen({ port: 8080, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
