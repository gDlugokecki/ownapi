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

    try {
      await client.query(
        "INSERT INTO conversation (conversation_id, content) VALUES ($1, $2)",
        [request.headers["x-forwarded-for"], request.body.question]
      );
    } catch (error) {
      reply.status(500).send("Error while adding conversation ID");
    }

    let conversation = [] as string[];

    try {
      const result = await client.query(
        `SELECT content FROM conversation WHERE conversation_id ='${request.headers["x-forwarded-for"]}'`
      );
      result.rows.forEach((row) => {
        conversation.push(row.content);
      });
    } catch (err) {
      console.error("Error fetching conversation IDs:", err);
      reply.status(500).send("Error fetching conversation IDs");
    }

    const systemPrompt =
      "Answer question in user prompt. \n\n" + conversation.join("\n");

    const { content } = await chat.call([
      new SystemMessage(systemPrompt),
      new HumanMessage(request.body.question),
    ]);

    reply.send({ reply: content });

    // await server.pg.query(
    //   "INSERT INTO conversation (conversation_id) VALUES ($1)",
    //   ["test"]
    // );
    // const t = await server.pg.query("SELECT * FROM conversation");
    // console.log(t, "TTT");
    // return "pong\n";
  }
);

// app.post('/ownapipro', async (req, res) => {
//   console.log(req.body);

//   try {
//     await db.query('INSERT INTO conversations (conversation_id) VALUES ($1)', [
//       req.body.question,
//     ]);
//   } catch (error) {
//     res.status(500).send('Error adding conversation ID');
//   }

//   let context = [];
//   try {
//     const result = await db.query('SELECT conversation_id FROM conversations');
//     result.rows.forEach((row) => {
//       context.push(row.conversation_id);
//     });
//   } catch (err) {
//     console.error('Error fetching conversation IDs:', err);
//     res.status(500).send('Error fetching conversation IDs');
//   }

//   const systemPrompt =
//     'Answer question in user prompt. \n\n' + context.join('\n');

//   console.log(systemPrompt);

//   const { content } = await chatModel.call([
//     new SystemMessage(systemPrompt),
//     new HumanMessage(req.body.question),
//   ]);
//   res.json({ reply: content });
// });

server.listen({ port: 8080, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
